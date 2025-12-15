import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { ReportFilterDto } from '../dto';

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  status?: string;
  priority?: string;
}

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateTicketsReport(filter: ReportFilter) {
    const where: Record<string, unknown> = {};

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(filter.endDate);
      }
    }

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.priority) {
      where.priority = filter.priority;
    }

    const [tickets, summary] = await Promise.all([
      this.prisma.ticket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { firstName: true, lastName: true, email: true },
          },
          assignedTo: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.ticket.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
    ]);

    const statusSummary: Record<string, number> = {};
    summary.forEach((item) => {
      statusSummary[item.status] = item._count.status;
    });

    return {
      filter,
      totalCount: tickets.length,
      summary: statusSummary,
      data: tickets,
      generatedAt: new Date().toISOString(),
    };
  }

  async generateBillingReport(filter: ReportFilter) {
    const where: Record<string, unknown> = {};

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(filter.endDate);
      }
    }

    if (filter.status) {
      where.status = filter.status;
    }

    const [invoices, totals] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          lines: true,
          payments: true,
          createdBy: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.invoice.aggregate({
        where,
        _sum: {
          subtotal: true,
          taxAmount: true,
          total: true,
        },
        _count: true,
      }),
    ]);

    const paidTotal = await this.prisma.invoice.aggregate({
      where: { ...where, status: 'PAID' },
      _sum: { total: true },
    });

    return {
      filter,
      totalCount: totals._count,
      totals: {
        subtotal: Number(totals._sum.subtotal) || 0,
        taxAmount: Number(totals._sum.taxAmount) || 0,
        total: Number(totals._sum.total) || 0,
        paid: Number(paidTotal._sum.total) || 0,
      },
      data: invoices,
      generatedAt: new Date().toISOString(),
    };
  }

  async generatePerformanceReport(filter: ReportFilter) {
    const where: Record<string, unknown> = {};

    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        (where.createdAt as Record<string, Date>).lte = new Date(filter.endDate);
      }
    }

    // Statistiques de résolution par agent
    const agentPerformance = await this.prisma.ticket.groupBy({
      by: ['assignedToId'],
      where: {
        ...where,
        assignedToId: { not: null },
        status: { in: ['RESOLVED', 'CLOSED'] },
      },
      _count: { id: true },
    });

    // Récupérer les informations des agents
    const agentIds = agentPerformance
      .map((a) => a.assignedToId)
      .filter((id): id is string => id !== null);

    const agents = await this.prisma.user.findMany({
      where: { id: { in: agentIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    const performanceByAgent = agentPerformance.map((item) => {
      const agent = agents.find((a) => a.id === item.assignedToId);
      return {
        agent: agent || { id: item.assignedToId, firstName: 'Unknown', lastName: '' },
        resolvedTickets: item._count.id,
      };
    });

    // Temps moyen de résolution (approximatif)
    const resolvedTickets = await this.prisma.ticket.findMany({
      where: {
        ...where,
        status: { in: ['RESOLVED', 'CLOSED'] },
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    let avgResolutionTime = 0;
    if (resolvedTickets.length > 0) {
      const totalTime = resolvedTickets.reduce((sum, ticket) => {
        if (ticket.resolvedAt) {
          return sum + (ticket.resolvedAt.getTime() - ticket.createdAt.getTime());
        }
        return sum;
      }, 0);
      avgResolutionTime = totalTime / resolvedTickets.length / (1000 * 60 * 60); // En heures
    }

    return {
      filter,
      performanceByAgent,
      metrics: {
        totalResolved: resolvedTickets.length,
        avgResolutionTimeHours: Number(avgResolutionTime.toFixed(2)),
      },
      generatedAt: new Date().toISOString(),
    };
  }

  async exportToCsv(filter: ReportFilterDto): Promise<string> {
    const report = await this.generateTicketsReport(filter);

    const headers = [
      'Reference',
      'Title',
      'Status',
      'Priority',
      'Created By',
      'Assigned To',
      'Created At',
    ];

    const rows = report.data.map((ticket) => [
      ticket.reference,
      `"${ticket.title.replace(/"/g, '""')}"`,
      ticket.status,
      ticket.priority,
      `${ticket.createdBy.firstName} ${ticket.createdBy.lastName}`,
      ticket.assignedTo
        ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}`
        : '',
      ticket.createdAt.toISOString(),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join(
      '\n',
    );

    return csvContent;
  }
}
