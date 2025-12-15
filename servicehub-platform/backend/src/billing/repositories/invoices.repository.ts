import { Injectable } from '@nestjs/common';
import { Payment, PaymentMethod } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';
import { IInvoicesRepository, InvoiceWithRelations } from './invoices.repository.interface';

const invoiceInclude = {
  createdBy: {
    select: { id: true, email: true, firstName: true, lastName: true },
  },
  lines: true,
  payments: {
    orderBy: { createdAt: 'desc' as const },
  },
  _count: {
    select: { lines: true, payments: true },
  },
};

@Injectable()
export class InvoicesRepository implements IInvoicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    reference: string;
    dueDate: Date;
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    notes?: string;
    createdById: string;
    lines: {
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
      ticketId?: string;
    }[];
  }): Promise<InvoiceWithRelations> {
    return this.prisma.invoice.create({
      data: {
        reference: data.reference,
        dueDate: data.dueDate,
        subtotal: data.subtotal,
        taxRate: data.taxRate,
        taxAmount: data.taxAmount,
        total: data.total,
        notes: data.notes,
        createdById: data.createdById,
        lines: {
          create: data.lines,
        },
      },
      include: invoiceInclude,
    });
  }

  async findById(id: string): Promise<InvoiceWithRelations | null> {
    return this.prisma.invoice.findUnique({
      where: { id },
      include: invoiceInclude,
    });
  }

  async findByReference(reference: string): Promise<InvoiceWithRelations | null> {
    return this.prisma.invoice.findUnique({
      where: { reference },
      include: invoiceInclude,
    });
  }

  async findMany(options: {
    where?: Record<string, unknown>;
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<InvoiceWithRelations[]> {
    return this.prisma.invoice.findMany({
      ...options,
      include: invoiceInclude,
    });
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.invoice.count({ where });
  }

  async countToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.invoice.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
  }

  async sumTotal(where?: Record<string, unknown>): Promise<number> {
    const result = await this.prisma.invoice.aggregate({
      where,
      _sum: {
        total: true,
      },
    });
    return Number(result._sum.total) || 0;
  }

  async update(id: string, data: Record<string, unknown>): Promise<InvoiceWithRelations> {
    return this.prisma.invoice.update({
      where: { id },
      data,
      include: invoiceInclude,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.invoice.delete({
      where: { id },
    });
  }

  async addPayment(
    invoiceId: string,
    data: { amount: number; method: string; reference?: string },
  ): Promise<Payment> {
    return this.prisma.payment.create({
      data: {
        invoiceId,
        amount: data.amount,
        method: data.method as PaymentMethod,
        reference: data.reference,
      },
    });
  }

  async getPayments(invoiceId: string): Promise<Payment[]> {
    return this.prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPaymentById(id: string): Promise<Payment | null> {
    return this.prisma.payment.findUnique({
      where: { id },
    });
  }

  async findManyPayments(options: {
    where?: Record<string, unknown>;
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<Payment[]> {
    return this.prisma.payment.findMany(options);
  }

  async countPayments(where?: Record<string, unknown>): Promise<number> {
    return this.prisma.payment.count({ where });
  }
}
