export interface ITicketKpis {
  openTickets: number;
  criticalTickets: number;
  createdThisMonth: number;
  resolvedThisMonth: number;
  overdueTickets: number;
  monthlyGrowth: number;
}

export interface IBillingKpis {
  totalOutstanding: number;
  revenueThisMonth: number;
  revenueGrowth: number;
  overdueInvoices: number;
}

export interface IPerformanceKpis {
  avgFirstResponseMinutes: number;
  avgResolutionHours: number;
  resolutionRate: number;
  ticketsLast30Days: number;
}

export interface IKpis {
  tickets: ITicketKpis;
  billing: IBillingKpis;
  performance: IPerformanceKpis;
  calculatedAt: string;
}
