import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class KpiService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateKpis() {
    const [
      ticketKpis,
      billingKpis,
      performanceKpis,
    ] = await Promise.all([
      this.calculateTicketKpis(),
      this.calculateBillingKpis(),
      this.calculatePerformanceKpis(),
    ]);

    return {
      tickets: ticketKpis,
      billing: billingKpis,
      performance: performanceKpis,
      calculatedAt: new Date().toISOString(),
    };
  }

  private async calculateTicketKpis() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalOpen,
      totalCritical,
      createdThisMonth,
      createdLastMonth,
      resolvedThisMonth,
      overdueTickets,
    ] = await Promise.all([
      this.prisma.ticket.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CLIENT', 'WAITING_INTERNAL'] } },
      }),
      this.prisma.ticket.count({
        where: { priority: 'CRITICAL', status: { notIn: ['CLOSED', 'CANCELLED'] } },
      }),
      this.prisma.ticket.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      this.prisma.ticket.count({
        where: {
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
      this.prisma.ticket.count({
        where: {
          status: { in: ['RESOLVED', 'CLOSED'] },
          resolvedAt: { gte: startOfMonth },
        },
      }),
      this.prisma.ticket.count({
        where: {
          dueDate: { lt: now },
          status: { notIn: ['RESOLVED', 'CLOSED', 'CANCELLED'] },
        },
      }),
    ]);

    const monthlyGrowth =
      createdLastMonth > 0
        ? ((createdThisMonth - createdLastMonth) / createdLastMonth) * 100
        : 0;

    return {
      openTickets: totalOpen,
      criticalTickets: totalCritical,
      createdThisMonth,
      resolvedThisMonth,
      overdueTickets,
      monthlyGrowth: Number(monthlyGrowth.toFixed(1)),
    };
  }

  private async calculateBillingKpis() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalOutstanding,
      revenueThisMonth,
      revenueLastMonth,
      overdueInvoices,
    ] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: { status: { in: ['SENT', 'PARTIALLY_PAID'] } },
        _sum: { total: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          updatedAt: { gte: startOfMonth },
        },
        _sum: { total: true },
      }),
      this.prisma.invoice.aggregate({
        where: {
          status: 'PAID',
          updatedAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { total: true },
      }),
      this.prisma.invoice.count({
        where: {
          status: 'OVERDUE',
        },
      }),
    ]);

    const currentRevenue = Number(revenueThisMonth._sum.total) || 0;
    const lastRevenue = Number(revenueLastMonth._sum.total) || 0;
    const revenueGrowth =
      lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

    return {
      totalOutstanding: Number(totalOutstanding._sum.total) || 0,
      revenueThisMonth: currentRevenue,
      revenueGrowth: Number(revenueGrowth.toFixed(1)),
      overdueInvoices,
    };
  }

  private async calculatePerformanceKpis() {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Temps moyen de première réponse (approximé par le premier commentaire)
    const ticketsWithComments = await this.prisma.ticket.findMany({
      where: {
        createdAt: { gte: last30Days },
        comments: { some: {} },
      },
      select: {
        createdAt: true,
        comments: {
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    let avgFirstResponseTime = 0;
    if (ticketsWithComments.length > 0) {
      const totalResponseTime = ticketsWithComments.reduce((sum, ticket) => {
        if (ticket.comments.length > 0) {
          return (
            sum +
            (ticket.comments[0].createdAt.getTime() - ticket.createdAt.getTime())
          );
        }
        return sum;
      }, 0);
      avgFirstResponseTime = totalResponseTime / ticketsWithComments.length / (1000 * 60); // En minutes
    }

    // Temps moyen de résolution
    const resolvedTickets = await this.prisma.ticket.findMany({
      where: {
        resolvedAt: { gte: last30Days },
        status: { in: ['RESOLVED', 'CLOSED'] },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    let avgResolutionTime = 0;
    if (resolvedTickets.length > 0) {
      const totalResolutionTime = resolvedTickets.reduce((sum, ticket) => {
        if (ticket.resolvedAt) {
          return sum + (ticket.resolvedAt.getTime() - ticket.createdAt.getTime());
        }
        return sum;
      }, 0);
      avgResolutionTime = totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60); // En heures
    }

    // Taux de résolution
    const [totalTickets, resolvedCount] = await Promise.all([
      this.prisma.ticket.count({
        where: { createdAt: { gte: last30Days } },
      }),
      this.prisma.ticket.count({
        where: {
          createdAt: { gte: last30Days },
          status: { in: ['RESOLVED', 'CLOSED'] },
        },
      }),
    ]);

    const resolutionRate = totalTickets > 0 ? (resolvedCount / totalTickets) * 100 : 0;

    return {
      avgFirstResponseMinutes: Number(avgFirstResponseTime.toFixed(0)),
      avgResolutionHours: Number(avgResolutionTime.toFixed(1)),
      resolutionRate: Number(resolutionRate.toFixed(1)),
      ticketsLast30Days: totalTickets,
    };
  }
}
