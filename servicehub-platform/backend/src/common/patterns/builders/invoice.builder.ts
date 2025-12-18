import { v4 as uuidv4 } from 'uuid';
import { referenceGenerator } from '../singleton/reference-generator.singleton';
import { appConfig } from '../singleton/app-config.singleton';

/**
 * Builder pour la construction de factures complexes
 * Permet une construction fluide et flexible des factures
 */

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'CANCELLED';

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  ticketId: string | null;
}

export interface BuiltInvoice {
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

export class InvoiceBuilder {
  private id: string;
  private reference: string | null = null;
  private status: InvoiceStatus = 'DRAFT';
  private issueDate: Date;
  private dueDate: Date | null = null;
  private taxRate: number;
  private notes: string | null = null;
  private createdById: string | null = null;
  private lines: InvoiceLine[] = [];

  constructor() {
    this.id = uuidv4();
    this.issueDate = new Date();
    this.taxRate = appConfig.taxRate;
  }

  /**
   * Crée une nouvelle instance du builder
   */
  public static create(): InvoiceBuilder {
    return new InvoiceBuilder();
  }

  /**
   * Définit la référence (sinon générée automatiquement)
   */
  public withReference(reference: string): InvoiceBuilder {
    this.reference = reference;
    return this;
  }

  /**
   * Définit le statut initial
   */
  public withStatus(status: InvoiceStatus): InvoiceBuilder {
    this.status = status;
    return this;
  }

  /**
   * Définit la date d'émission
   */
  public withIssueDate(date: Date): InvoiceBuilder {
    this.issueDate = date;
    return this;
  }

  /**
   * Définit la date d'échéance
   */
  public withDueDate(date: Date): InvoiceBuilder {
    this.dueDate = date;
    return this;
  }

  /**
   * Définit le délai de paiement en jours
   */
  public withPaymentDelay(days: number): InvoiceBuilder {
    const dueDate = new Date(this.issueDate);
    dueDate.setDate(dueDate.getDate() + days);
    this.dueDate = dueDate;
    return this;
  }

  /**
   * Définit le taux de TVA
   */
  public withTaxRate(rate: number): InvoiceBuilder {
    this.taxRate = rate;
    return this;
  }

  /**
   * Définit une TVA réduite (5.5%)
   */
  public withReducedTax(): InvoiceBuilder {
    this.taxRate = 5.5;
    return this;
  }

  /**
   * Définit aucune TVA
   */
  public withoutTax(): InvoiceBuilder {
    this.taxRate = 0;
    return this;
  }

  /**
   * Ajoute des notes
   */
  public withNotes(notes: string): InvoiceBuilder {
    this.notes = notes;
    return this;
  }

  /**
   * Définit le créateur
   */
  public createdBy(userId: string): InvoiceBuilder {
    this.createdById = userId;
    return this;
  }

  /**
   * Ajoute une ligne de facture
   */
  public addLine(description: string, quantity: number, unitPrice: number, ticketId?: string): InvoiceBuilder {
    const total = this.roundToTwoDecimals(quantity * unitPrice);
    this.lines.push({
      id: uuidv4(),
      description,
      quantity,
      unitPrice,
      total,
      ticketId: ticketId || null,
    });
    return this;
  }

  /**
   * Ajoute plusieurs lignes d'un coup
   */
  public addLines(lines: Array<{ description: string; quantity: number; unitPrice: number; ticketId?: string }>): InvoiceBuilder {
    lines.forEach((line) => this.addLine(line.description, line.quantity, line.unitPrice, line.ticketId));
    return this;
  }

  /**
   * Ajoute une ligne pour un service horaire
   */
  public addHourlyService(description: string, hours: number, hourlyRate: number): InvoiceBuilder {
    return this.addLine(`${description} (${hours}h)`, hours, hourlyRate);
  }

  /**
   * Ajoute une ligne avec remise
   */
  public addLineWithDiscount(description: string, quantity: number, unitPrice: number, discountPercent: number): InvoiceBuilder {
    const discountedPrice = unitPrice * (1 - discountPercent / 100);
    return this.addLine(`${description} (-${discountPercent}%)`, quantity, this.roundToTwoDecimals(discountedPrice));
  }

  /**
   * Construit la facture finale
   */
  public build(): BuiltInvoice {
    // Validations
    if (!this.createdById) {
      throw new Error('Invoice must have a creator (use createdBy())');
    }
    if (this.lines.length === 0) {
      throw new Error('Invoice must have at least one line');
    }

    const now = new Date();
    const reference = this.reference || referenceGenerator.generateInvoiceReference();
    const dueDate = this.dueDate || this.calculateDefaultDueDate();

    // Calculs
    const subtotal = this.calculateSubtotal();
    const taxAmount = this.calculateTaxAmount(subtotal);
    const total = this.roundToTwoDecimals(subtotal + taxAmount);

    return {
      id: this.id,
      reference,
      status: this.status,
      issueDate: this.issueDate,
      dueDate,
      subtotal,
      taxRate: this.taxRate,
      taxAmount,
      total,
      notes: this.notes,
      createdById: this.createdById,
      lines: [...this.lines],
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Réinitialise le builder pour réutilisation
   */
  public reset(): InvoiceBuilder {
    this.id = uuidv4();
    this.reference = null;
    this.status = 'DRAFT';
    this.issueDate = new Date();
    this.dueDate = null;
    this.taxRate = appConfig.taxRate;
    this.notes = null;
    this.createdById = null;
    this.lines = [];
    return this;
  }

  private calculateSubtotal(): number {
    const subtotal = this.lines.reduce((sum, line) => sum + line.total, 0);
    return this.roundToTwoDecimals(subtotal);
  }

  private calculateTaxAmount(subtotal: number): number {
    return this.roundToTwoDecimals(subtotal * (this.taxRate / 100));
  }

  private calculateDefaultDueDate(): Date {
    const dueDate = new Date(this.issueDate);
    dueDate.setDate(dueDate.getDate() + appConfig.paymentDelay);
    return dueDate;
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
