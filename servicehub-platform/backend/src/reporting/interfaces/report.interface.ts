export interface IReportFilter {
  startDate?: string;
  endDate?: string;
  status?: string;
  priority?: string;
}

export interface ITicketReport {
  filter: IReportFilter;
  totalCount: number;
  summary: Record<string, number>;
  data: unknown[];
  generatedAt: string;
}

export interface IBillingReport {
  filter: IReportFilter;
  totalCount: number;
  totals: {
    subtotal: number;
    taxAmount: number;
    total: number;
    paid: number;
  };
  data: unknown[];
  generatedAt: string;
}

export interface IPerformanceReport {
  filter: IReportFilter;
  performanceByAgent: {
    agent: {
      id: string;
      firstName: string;
      lastName: string;
    };
    resolvedTickets: number;
  }[];
  metrics: {
    totalResolved: number;
    avgResolutionTimeHours: number;
  };
  generatedAt: string;
}

export interface IDashboardData {
  tickets: {
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    recentTickets: unknown[];
  };
  billing: {
    total: number;
    byStatus: Record<string, number>;
    totalRevenue: number;
    recentInvoices: unknown[];
  };
  users: {
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  };
  kpis: unknown;
  generatedAt: string;
}
