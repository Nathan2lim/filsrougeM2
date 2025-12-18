import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

/**
 * Factory pour la création de Tickets
 * Centralise la logique d'instanciation et la génération de références
 */

export interface TicketData {
  title: string;
  description: string;
  priority?: TicketPriority;
  createdById: string;
  assignedToId?: string;
  dueDate?: Date;
}

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_CLIENT' | 'WAITING_INTERNAL' | 'RESOLVED' | 'CLOSED' | 'CANCELLED';

export interface Ticket {
  id: string;
  reference: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdById: string;
  assignedToId: string | null;
  dueDate: Date | null;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TicketFactory {
  private dailyCounter: Map<string, number> = new Map();

  /**
   * Crée un nouveau ticket avec référence unique générée automatiquement
   */
  create(data: TicketData): Ticket {
    const now = new Date();
    const reference = this.generateReference(now);

    return {
      id: uuidv4(),
      reference,
      title: data.title,
      description: data.description,
      status: 'OPEN',
      priority: data.priority || 'MEDIUM',
      createdById: data.createdById,
      assignedToId: data.assignedToId || null,
      dueDate: data.dueDate || null,
      resolvedAt: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Crée un ticket urgent avec priorité CRITICAL et date limite à 24h
   */
  createUrgent(data: Omit<TicketData, 'priority' | 'dueDate'>): Ticket {
    const dueDate = new Date();
    dueDate.setHours(dueDate.getHours() + 24);

    return this.create({
      ...data,
      priority: 'CRITICAL',
      dueDate,
    });
  }

  /**
   * Crée un ticket de support standard avec priorité MEDIUM
   */
  createSupport(data: Omit<TicketData, 'priority'>): Ticket {
    return this.create({
      ...data,
      priority: 'MEDIUM',
    });
  }

  /**
   * Crée un ticket de maintenance avec priorité LOW
   */
  createMaintenance(data: Omit<TicketData, 'priority'>): Ticket {
    return this.create({
      ...data,
      priority: 'LOW',
    });
  }

  /**
   * Génère une référence unique au format TKT-YYYYMMDD-XXXX
   */
  private generateReference(date: Date): string {
    const dateStr = this.formatDate(date);
    const counter = this.getNextCounter(dateStr);
    return `TKT-${dateStr}-${counter.toString().padStart(4, '0')}`;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }

  private getNextCounter(dateStr: string): number {
    const current = this.dailyCounter.get(dateStr) || 0;
    const next = current + 1;
    this.dailyCounter.set(dateStr, next);
    return next;
  }

  /**
   * Réinitialise le compteur (utile pour les tests)
   */
  resetCounter(): void {
    this.dailyCounter.clear();
  }

  /**
   * Initialise le compteur avec une valeur spécifique (sync avec la BDD)
   */
  initializeCounter(dateStr: string, value: number): void {
    this.dailyCounter.set(dateStr, value);
  }
}
