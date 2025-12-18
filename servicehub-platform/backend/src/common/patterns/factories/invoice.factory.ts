import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

/**
 * Factory pour la création de Factures
 * Centralise la logique d'instanciation, calculs et génération de références
 */

export interface InvoiceLineData {
  description: string;
  quantity: number;
  unitPrice: number;
  ticketId?: string;
}

export interface InvoiceData {
  createdById: string;
  dueDate?: Date;
  taxRate?: number;
  notes?: string;
  lines: InvoiceLineData[];
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED';

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  ticketId: string | null;
}

export interface Invoice {
  id: string;
  reference: string;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes: string | null;
  createdById: string;
  lines: InvoiceLine[];
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class InvoiceFactory {
  private dailyCounter: Map<string, number> = new Map();
  private readonly DEFAULT_TAX_RATE = 20; // TVA 20%
  private readonly DEFAULT_PAYMENT_DELAY_DAYS = 30;

  /**
   * Crée une nouvelle facture avec calculs automatiques
   */
  create(data: InvoiceData): Invoice {
    const now = new Date();
    const reference = this.generateReference(now);
    const taxRate = data.taxRate ?? this.DEFAULT_TAX_RATE;

    // Créer les lignes avec calcul des totaux
    const lines = this.createLines(data.lines);

    // Calculer les montants
    const subtotal = this.calculateSubtotal(lines);
    const taxAmount = this.calculateTax(subtotal, taxRate);
    const total = subtotal + taxAmount;

    // Date d'échéance par défaut : 30 jours
    const dueDate = data.dueDate || this.calculateDueDate(now);

    return {
      id: uuidv4(),
      reference,
      status: 'DRAFT',
      issueDate: now,
      dueDate,
      subtotal,
      taxRate,
      taxAmount,
      total,
      notes: data.notes || null,
      createdById: data.createdById,
      lines,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Crée une facture proforma (devis)
   */
  createProforma(data: InvoiceData): Invoice {
    const invoice = this.create(data);
    invoice.reference = invoice.reference.replace('INV-', 'PRO-');
    return invoice;
  }

  /**
   * Crée une facture avec TVA réduite (5.5%)
   */
  createWithReducedTax(data: Omit<InvoiceData, 'taxRate'>): Invoice {
    return this.create({
      ...data,
      taxRate: 5.5,
    });
  }

  /**
   * Crée une facture sans TVA (export, auto-entrepreneur)
   */
  createWithoutTax(data: Omit<InvoiceData, 'taxRate'>): Invoice {
    return this.create({
      ...data,
      taxRate: 0,
    });
  }

  /**
   * Crée les lignes de facture avec calcul automatique
   */
  private createLines(linesData: InvoiceLineData[]): InvoiceLine[] {
    return linesData.map((line) => ({
      id: uuidv4(),
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      total: this.roundToTwoDecimals(line.quantity * line.unitPrice),
      ticketId: line.ticketId || null,
    }));
  }

  /**
   * Calcule le sous-total HT
   */
  private calculateSubtotal(lines: InvoiceLine[]): number {
    const subtotal = lines.reduce((sum, line) => sum + line.total, 0);
    return this.roundToTwoDecimals(subtotal);
  }

  /**
   * Calcule le montant de la TVA
   */
  private calculateTax(subtotal: number, taxRate: number): number {
    return this.roundToTwoDecimals(subtotal * (taxRate / 100));
  }

  /**
   * Calcule la date d'échéance
   */
  private calculateDueDate(fromDate: Date): Date {
    const dueDate = new Date(fromDate);
    dueDate.setDate(dueDate.getDate() + this.DEFAULT_PAYMENT_DELAY_DAYS);
    return dueDate;
  }

  /**
   * Arrondit à 2 décimales
   */
  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Génère une référence unique au format INV-YYYYMMDD-XXXX
   */
  private generateReference(date: Date): string {
    const dateStr = this.formatDate(date);
    const counter = this.getNextCounter(dateStr);
    return `INV-${dateStr}-${counter.toString().padStart(4, '0')}`;
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

  resetCounter(): void {
    this.dailyCounter.clear();
  }

  initializeCounter(dateStr: string, value: number): void {
    this.dailyCounter.set(dateStr, value);
  }
}
