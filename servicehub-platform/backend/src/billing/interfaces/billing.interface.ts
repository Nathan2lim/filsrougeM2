export interface IInvoice {
  id: string;
  reference: string;
  status: string;
  issueDate: Date;
  dueDate: Date;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
}

export interface IInvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  invoiceId: string;
  ticketId: string | null;
}

export interface IPayment {
  id: string;
  amount: number;
  method: string;
  reference: string | null;
  paidAt: Date;
  createdAt: Date;
  invoiceId: string;
}

export interface IBillingStats {
  total: number;
  byStatus: {
    draft: number;
    sent: number;
    paid: number;
    overdue: number;
  };
  revenue: {
    total: number;
    pending: number;
  };
}
