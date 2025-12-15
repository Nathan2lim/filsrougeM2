import { Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';
import { KpiService } from './kpi.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly kpiService: KpiService,
  ) {}

  async getDashboardData() {
    const [ticketStats, billingStats, userStats, kpis] = await Promise.all([
      this.getTicketStats(),
      this.getBillingStats(),
      this.getUserStats(),
      this.kpiService.calculateKpis(),
    ]);

    return {
      tickets: ticketStats,
      billing: billingStats,
      users: userStats,
      kpis,
      generatedAt: new Date().toISOString(),
    };
  }

  async getTicketStats() {
    const [total, byStatus, byPriority, recentTickets] = await Promise.all([
      this.prisma.ticket.count(),
      this.prisma.ticket.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.ticket.groupBy({
        by: ['priority'],
        _count: { priority: true },
      }),
      this.prisma.ticket.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          reference: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
        },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    byStatus.forEach((item) => {
      statusMap[item.status] = item._count.status;
    });

    const priorityMap: Record<string, number> = {};
    byPriority.forEach((item) => {
      priorityMap[item.priority] = item._count.priority;
    });

    return {
      total,
      byStatus: statusMap,
      byPriority: priorityMap,
      recentTickets,
    };
  }

  async getBillingStats() {
    const [total, byStatus, totalRevenue, recentInvoices] = await Promise.all([
      this.prisma.invoice.count(),
      this.prisma.invoice.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.invoice.aggregate({
        where: { status: 'PAID' },
        _sum: { total: true },
      }),
      this.prisma.invoice.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          reference: true,
          status: true,
          total: true,
          createdAt: true,
        },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    byStatus.forEach((item) => {
      statusMap[item.status] = item._count.status;
    });

    return {
      total,
      byStatus: statusMap,
      totalRevenue: Number(totalRevenue._sum.total) || 0,
      recentInvoices,
    };
  }

  async getUserStats() {
    const [total, active, byRole] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.groupBy({
        by: ['roleId'],
        _count: { roleId: true },
      }),
    ]);

    // Récupérer les noms des rôles
    const roles = await this.prisma.role.findMany({
      select: { id: true, name: true },
    });

    const roleMap: Record<string, number> = {};
    byRole.forEach((item) => {
      const role = roles.find((r) => r.id === item.roleId);
      if (role) {
        roleMap[role.name] = item._count.roleId;
      }
    });

    return {
      total,
      active,
      inactive: total - active,
      byRole: roleMap,
    };
  }

  async getRecentActivity() {
    const [recentTickets, recentComments, recentInvoices] = await Promise.all([
      this.prisma.ticket.findMany({
        take: 10,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          reference: true,
          title: true,
          status: true,
          updatedAt: true,
          createdBy: {
            select: { firstName: true, lastName: true },
          },
        },
      }),
      this.prisma.ticketComment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: {
            select: { firstName: true, lastName: true },
          },
          ticket: {
            select: { reference: true },
          },
        },
      }),
      this.prisma.invoice.findMany({
        take: 10,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          reference: true,
          status: true,
          total: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      tickets: recentTickets,
      comments: recentComments,
      invoices: recentInvoices,
    };
  }
}
