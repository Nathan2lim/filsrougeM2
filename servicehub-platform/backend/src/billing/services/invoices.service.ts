import { Injectable, Inject } from '@nestjs/common';
import { IInvoicesRepository } from '../repositories/invoices.repository.interface';
import { BillingCalculatorService } from './billing-calculator.service';
import { CreateInvoiceDto } from '../dto';
import {
  EntityNotFoundException,
  InvalidOperationException,
} from '@common/exceptions';
import { generateReference } from '@common/utils';

interface FindAllParams {
  page: number;
  limit: number;
  status?: string;
}

@Injectable()
export class InvoicesService {
  constructor(
    @Inject('IInvoicesRepository')
    private readonly invoicesRepository: IInvoicesRepository,
    private readonly billingCalculator: BillingCalculatorService,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto, createdById: string) {
    const count = await this.invoicesRepository.countToday();
    const reference = generateReference('INV', count + 1);

    // Calculer les montants
    const subtotal = this.billingCalculator.calculateSubtotal(createInvoiceDto.lines);
    const taxRate = createInvoiceDto.taxRate || 20;
    const taxAmount = this.billingCalculator.calculateTaxAmount(subtotal, taxRate);
    const total = this.billingCalculator.calculateTotal(subtotal, taxRate);

    // Calculer la date d'échéance (30 jours par défaut)
    const dueDate = createInvoiceDto.dueDate
      ? new Date(createInvoiceDto.dueDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return this.invoicesRepository.create({
      reference,
      dueDate,
      subtotal,
      taxRate,
      taxAmount,
      total,
      notes: createInvoiceDto.notes,
      createdById,
      lines: createInvoiceDto.lines.map((line) => ({
        description: line.description,
        quantity: line.quantity || 1,
        unitPrice: line.unitPrice,
        total: (line.quantity || 1) * line.unitPrice,
        ticketId: line.ticketId,
      })),
    });
  }

  async findAll(params: FindAllParams) {
    const { page, limit, status } = params;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      this.invoicesRepository.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.invoicesRepository.count(where),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: invoices,
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
    const invoice = await this.invoicesRepository.findById(id);
    if (!invoice) {
      throw new EntityNotFoundException('Facture', id);
    }
    return invoice;
  }

  async send(id: string) {
    const invoice = await this.invoicesRepository.findById(id);
    if (!invoice) {
      throw new EntityNotFoundException('Facture', id);
    }

    if (invoice.status !== 'DRAFT') {
      throw new InvalidOperationException(
        'Seules les factures en brouillon peuvent être envoyées',
      );
    }

    return this.invoicesRepository.update(id, { status: 'SENT' });
  }

  async cancel(id: string) {
    const invoice = await this.invoicesRepository.findById(id);
    if (!invoice) {
      throw new EntityNotFoundException('Facture', id);
    }

    if (invoice.status === 'PAID') {
      throw new InvalidOperationException(
        'Impossible d\'annuler une facture payée',
      );
    }

    return this.invoicesRepository.update(id, { status: 'CANCELLED' });
  }

  async delete(id: string) {
    const invoice = await this.invoicesRepository.findById(id);
    if (!invoice) {
      throw new EntityNotFoundException('Facture', id);
    }

    if (invoice.status !== 'DRAFT') {
      throw new InvalidOperationException(
        'Seules les factures en brouillon peuvent être supprimées',
      );
    }

    await this.invoicesRepository.delete(id);
    return { message: 'Facture supprimée avec succès' };
  }

  async getStats() {
    const [
      totalInvoices,
      draftInvoices,
      sentInvoices,
      paidInvoices,
      overdueInvoices,
      totalRevenue,
      pendingRevenue,
    ] = await Promise.all([
      this.invoicesRepository.count(),
      this.invoicesRepository.count({ status: 'DRAFT' }),
      this.invoicesRepository.count({ status: 'SENT' }),
      this.invoicesRepository.count({ status: 'PAID' }),
      this.invoicesRepository.count({ status: 'OVERDUE' }),
      this.invoicesRepository.sumTotal({ status: 'PAID' }),
      this.invoicesRepository.sumTotal({ status: 'SENT' }),
    ]);

    return {
      total: totalInvoices,
      byStatus: {
        draft: draftInvoices,
        sent: sentInvoices,
        paid: paidInvoices,
        overdue: overdueInvoices,
      },
      revenue: {
        total: totalRevenue,
        pending: pendingRevenue,
      },
    };
  }
}
