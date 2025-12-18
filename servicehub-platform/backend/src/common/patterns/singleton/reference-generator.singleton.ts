/**
 * Singleton pour la génération de références uniques
 * Garantit une instance unique pour la cohérence des compteurs
 */

export type ReferenceType = 'TKT' | 'INV' | 'PRO' | 'USR' | 'PAY';

interface CounterState {
  [dateKey: string]: {
    [type: string]: number;
  };
}

export class ReferenceGenerator {
  private static instance: ReferenceGenerator | null = null;
  private counters: CounterState = {};
  private readonly lock: Map<string, Promise<void>> = new Map();

  /**
   * Constructeur privé - empêche l'instanciation directe
   */
  private constructor() {
    // Initialisation privée
  }

  /**
   * Obtient l'instance unique du générateur
   */
  public static getInstance(): ReferenceGenerator {
    if (!ReferenceGenerator.instance) {
      ReferenceGenerator.instance = new ReferenceGenerator();
    }
    return ReferenceGenerator.instance;
  }

  /**
   * Génère une référence unique pour un type donné
   * Format: TYPE-YYYYMMDD-XXXX
   */
  public generate(type: ReferenceType): string {
    const dateStr = this.getCurrentDateString();
    const counter = this.getNextCounter(type, dateStr);
    return `${type}-${dateStr}-${counter.toString().padStart(4, '0')}`;
  }

  /**
   * Génère une référence pour un ticket
   */
  public generateTicketReference(): string {
    return this.generate('TKT');
  }

  /**
   * Génère une référence pour une facture
   */
  public generateInvoiceReference(): string {
    return this.generate('INV');
  }

  /**
   * Génère une référence pour un proforma
   */
  public generateProformaReference(): string {
    return this.generate('PRO');
  }

  /**
   * Génère une référence pour un paiement
   */
  public generatePaymentReference(): string {
    return this.generate('PAY');
  }

  /**
   * Initialise un compteur avec une valeur (synchronisation avec la BDD)
   */
  public initializeCounter(type: ReferenceType, dateStr: string, value: number): void {
    if (!this.counters[dateStr]) {
      this.counters[dateStr] = {};
    }
    this.counters[dateStr][type] = value;
  }

  /**
   * Récupère la valeur actuelle d'un compteur
   */
  public getCurrentCounter(type: ReferenceType, dateStr?: string): number {
    const date = dateStr || this.getCurrentDateString();
    return this.counters[date]?.[type] || 0;
  }

  /**
   * Réinitialise tous les compteurs (utile pour les tests)
   */
  public reset(): void {
    this.counters = {};
  }

  /**
   * Réinitialise l'instance singleton (utile pour les tests)
   */
  public static resetInstance(): void {
    ReferenceGenerator.instance = null;
  }

  /**
   * Obtient le prochain numéro de compteur
   */
  private getNextCounter(type: ReferenceType, dateStr: string): number {
    if (!this.counters[dateStr]) {
      this.counters[dateStr] = {};
    }

    const current = this.counters[dateStr][type] || 0;
    const next = current + 1;
    this.counters[dateStr][type] = next;

    return next;
  }

  /**
   * Retourne la date actuelle au format YYYYMMDD
   */
  private getCurrentDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * Nettoie les compteurs anciens (plus de 7 jours)
   */
  public cleanOldCounters(): void {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const cutoffStr = this.formatDate(sevenDaysAgo);

    Object.keys(this.counters).forEach((dateStr) => {
      if (dateStr < cutoffStr) {
        delete this.counters[dateStr];
      }
    });
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }
}

// Export de l'instance unique pour faciliter l'utilisation
export const referenceGenerator = ReferenceGenerator.getInstance();
