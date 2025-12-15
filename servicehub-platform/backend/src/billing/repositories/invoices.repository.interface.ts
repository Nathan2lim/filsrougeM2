import { Invoice, InvoiceLine, Payment, User } from '@prisma/client';

export type InvoiceWithRelations = Invoice & {
  createdBy: Pick<User, 'id' | 'email' | 'firstName' | 'lastName'>;
  lines: InvoiceLine[];
  payments: Payment[];
  _count: { lines: number; payments: number };
};

export interface IInvoicesRepository {
  create(data: {
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
  }): Promise<InvoiceWithRelations>;

  findById(id: string): Promise<InvoiceWithRelations | null>;

  findByReference(reference: string): Promise<InvoiceWithRelations | null>;

  findMany(options: {
    where?: Record<string, unknown>;
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<InvoiceWithRelations[]>;

  count(where?: Record<string, unknown>): Promise<number>;

  countToday(): Promise<number>;

  sumTotal(where?: Record<string, unknown>): Promise<number>;

  update(id: string, data: Record<string, unknown>): Promise<InvoiceWithRelations>;

  delete(id: string): Promise<void>;

  addPayment(
    invoiceId: string,
    data: { amount: number; method: string; reference?: string },
  ): Promise<Payment>;

  getPayments(invoiceId: string): Promise<Payment[]>;

  findPaymentById(id: string): Promise<Payment | null>;

  findManyPayments(options: {
    where?: Record<string, unknown>;
    skip?: number;
    take?: number;
    orderBy?: Record<string, 'asc' | 'desc'>;
  }): Promise<Payment[]>;

  countPayments(where?: Record<string, unknown>): Promise<number>;
}
