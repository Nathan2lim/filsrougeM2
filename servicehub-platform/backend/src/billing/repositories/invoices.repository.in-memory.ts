import { Injectable } from '@nestjs/common';
import { IInvoicesRepository, InvoiceWithRelations } from './invoices.repository.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * Implémentation In-Memory du repository Invoices
 * Utilisée pour les tests et le développement sans base de données
 */
@Injectable()
export class InvoicesRepositoryInMemory implements IInvoicesRepository {
  private invoices: Map<string, InvoiceWithRelations> = new Map();
  private payments: Map<string, Payment[]> = new Map();

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
    const invoiceLines: InvoiceLine[] = data.lines.map((line) => ({
      id: uuidv4(),
      invoiceId: '', // Sera mis à jour après
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      total: line.total,
      ticketId: line.ticketId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const invoice: InvoiceWithRelations = {
      id: uuidv4(),
      reference: data.reference,
      status: 'DRAFT' as InvoiceStatus,
      issueDate: new Date(),
      dueDate: data.dueDate,
      subtotal: data.subtotal,
      taxRate: data.taxRate,
      taxAmount: data.taxAmount,
      total: data.total,
      notes: data.notes || null,
      createdById: data.createdById,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: {
        id: data.createdById,
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
      },
      lines: invoiceLines.map((l) => ({ ...l, invoiceId: '' })),
      payments: [],
      _count: { lines: invoiceLines.length, payments: 0 },
    };

    // Mettre à jour les invoiceId des lignes
    invoice.lines = invoice.lines.map((l) => ({ ...l, invoiceId: invoice.id }));

    this.invoices.set(invoice.id, invoice);
    this.payments.set(invoice.id, []);
    return invoice;
  }

  async findById(id: string): Promise<InvoiceWithRelations | null> {
    const invoice = this.invoices.get(id);
    if (invoice) {
      invoice.payments = this.payments.get(id) || [];
      invoice._count.payments = invoice.payments.length;
    }
    return invoice || null;
  }

  async findByReference(reference: string): Promise<InvoiceWithRelations | null> {
    for (const invoice of this.invoices.values()) {
      if (invoice.reference === reference) {
        invoice.payments = this.payments.get(invoice.id) || [];
        invoice._count.payments = invoice.payments.length;
        return invoice;
      }
    }
    return null;
  }

  async findMany(options: {
    where?: Record<string, unknown>;
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<InvoiceWithRelations[]> {
    let result = Array.from(this.invoices.values());

    // Filtrage basique
    if (options.where) {
      result = result.filter((invoice) => {
        return Object.entries(options.where!).every(([key, value]) => {
          return (invoice as Record<string, unknown>)[key] === value;
        });
      });
    }

    // Tri
    if (options.orderBy) {
      const [field, order] = Object.entries(options.orderBy)[0];
      result.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[field];
        const bVal = (b as Record<string, unknown>)[field];
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Ajouter les paiements
    result = result.map((invoice) => ({
      ...invoice,
      payments: this.payments.get(invoice.id) || [],
      _count: {
        lines: invoice.lines.length,
        payments: (this.payments.get(invoice.id) || []).length,
      },
    }));

    // Pagination
    const skip = options.skip || 0;
    const take = options.take || result.length;
    return result.slice(skip, skip + take);
  }

  async count(where?: Record<string, unknown>): Promise<number> {
    if (!where) {
      return this.invoices.size;
    }
    const filtered = await this.findMany({ where });
    return filtered.length;
  }

  async countToday(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let count = 0;
    for (const invoice of this.invoices.values()) {
      if (invoice.createdAt >= today && invoice.createdAt < tomorrow) {
        count++;
      }
    }
    return count;
  }

  async sumTotal(where?: Record<string, unknown>): Promise<number> {
    let invoices = Array.from(this.invoices.values());

    if (where) {
      invoices = invoices.filter((invoice) => {
        return Object.entries(where).every(([key, value]) => {
          return (invoice as Record<string, unknown>)[key] === value;
        });
      });
    }

    return invoices.reduce((sum, invoice) => sum + invoice.total, 0);
  }

  async update(id: string, data: Record<string, unknown>): Promise<InvoiceWithRelations> {
    const invoice = this.invoices.get(id);
    if (!invoice) {
      throw new Error(`Invoice with id ${id} not found`);
    }

    const updatedInvoice: InvoiceWithRelations = {
      ...invoice,
      ...data,
      updatedAt: new Date(),
    } as InvoiceWithRelations;

    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }

  async delete(id: string): Promise<void> {
    this.invoices.delete(id);
    this.payments.delete(id);
  }

  async addPayment(
    invoiceId: string,
    data: { amount: number; method: string; reference?: string },
  ): Promise<Payment> {
    const invoicePayments = this.payments.get(invoiceId) || [];

    const payment: Payment = {
      id: uuidv4(),
      invoiceId,
      amount: data.amount,
      method: data.method as PaymentMethod,
      reference: data.reference || null,
      paidAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    invoicePayments.unshift(payment);
    this.payments.set(invoiceId, invoicePayments);

    // Mettre à jour le statut de la facture si nécessaire
    const invoice = this.invoices.get(invoiceId);
    if (invoice) {
      const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
      if (totalPaid >= invoice.total) {
        invoice.status = 'PAID';
      } else if (totalPaid > 0) {
        invoice.status = 'PARTIALLY_PAID';
      }
      invoice._count.payments = invoicePayments.length;
    }

    return payment;
  }

  async getPayments(invoiceId: string): Promise<Payment[]> {
    return this.payments.get(invoiceId) || [];
  }

  async findPaymentById(id: string): Promise<Payment | null> {
    for (const paymentList of this.payments.values()) {
      const payment = paymentList.find((p) => p.id === id);
      if (payment) {
        return payment;
      }
    }
    return null;
  }

  async findManyPayments(options: {
    where?: Record<string, unknown>;
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<Payment[]> {
    let result: Payment[] = [];
    for (const paymentList of this.payments.values()) {
      result = result.concat(paymentList);
    }

    // Filtrage basique
    if (options.where) {
      result = result.filter((payment) => {
        return Object.entries(options.where!).every(([key, value]) => {
          return (payment as Record<string, unknown>)[key] === value;
        });
      });
    }

    // Tri
    if (options.orderBy) {
      const [field, order] = Object.entries(options.orderBy)[0];
      result.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[field];
        const bVal = (b as Record<string, unknown>)[field];
        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Pagination
    const skip = options.skip || 0;
    const take = options.take || result.length;
    return result.slice(skip, skip + take);
  }

  async countPayments(where?: Record<string, unknown>): Promise<number> {
    const payments = await this.findManyPayments({ where });
    return payments.length;
  }

  // Méthode utilitaire pour les tests
  clear(): void {
    this.invoices.clear();
    this.payments.clear();
  }
}

// Types locaux pour éviter la dépendance Prisma
type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'OVERDUE'
  | 'CANCELLED';

type PaymentMethod =
  | 'CREDIT_CARD'
  | 'BANK_TRANSFER'
  | 'CHECK'
  | 'CASH'
  | 'OTHER';

interface InvoiceLine {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  ticketId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
