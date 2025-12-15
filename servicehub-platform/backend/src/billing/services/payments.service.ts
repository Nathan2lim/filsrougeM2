import { Injectable, Inject } from '@nestjs/common';
import { IInvoicesRepository } from '../repositories/invoices.repository.interface';
import { CreatePaymentDto } from '../dto';
import { EntityNotFoundException, InvalidOperationException } from '@common/exceptions';

interface FindAllParams {
  page: number;
  limit: number;
  invoiceId?: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    @Inject('IInvoicesRepository')
    private readonly invoicesRepository: IInvoicesRepository,
  ) {}

  async create(createPaymentDto: CreatePaymentDto) {
    const invoice = await this.invoicesRepository.findById(createPaymentDto.invoiceId);
    if (!invoice) {
      throw new EntityNotFoundException('Facture', createPaymentDto.invoiceId);
    }

    if (invoice.status === 'CANCELLED') {
      throw new InvalidOperationException(
        'Impossible d\'enregistrer un paiement sur une facture annulée',
      );
    }

    if (invoice.status === 'PAID') {
      throw new InvalidOperationException('Cette facture est déjà entièrement payée');
    }

    const payment = await this.invoicesRepository.addPayment(createPaymentDto.invoiceId, {
      amount: createPaymentDto.amount,
      method: createPaymentDto.method,
      reference: createPaymentDto.reference,
    });

    // Calculer le total des paiements pour cette facture
    const payments = await this.invoicesRepository.getPayments(createPaymentDto.invoiceId);
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Mettre à jour le statut de la facture si nécessaire
    const invoiceTotal = Number(invoice.total);
    if (totalPaid >= invoiceTotal) {
      await this.invoicesRepository.update(createPaymentDto.invoiceId, { status: 'PAID' });
    } else if (totalPaid > 0) {
      await this.invoicesRepository.update(createPaymentDto.invoiceId, {
        status: 'PARTIALLY_PAID',
      });
    }

    return payment;
  }

  async findAll(params: FindAllParams) {
    const { page, limit, invoiceId } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (invoiceId) {
      where.invoiceId = invoiceId;
    }

    const [payments, total] = await Promise.all([
      this.invoicesRepository.findManyPayments({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.invoicesRepository.countPayments(where),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findById(id: string) {
    const payment = await this.invoicesRepository.findPaymentById(id);
    if (!payment) {
      throw new EntityNotFoundException('Paiement', id);
    }
    return payment;
  }

  async findByInvoice(invoiceId: string) {
    const invoice = await this.invoicesRepository.findById(invoiceId);
    if (!invoice) {
      throw new EntityNotFoundException('Facture', invoiceId);
    }

    return this.invoicesRepository.getPayments(invoiceId);
  }
}
