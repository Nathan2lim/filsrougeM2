/**
 * Génère une référence unique au format PREFIX-YYYYMMDD-XXXX
 */
export function generateReference(prefix: string, sequence: number): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const seqStr = sequence.toString().padStart(4, '0');
  return `${prefix}-${dateStr}-${seqStr}`;
}

/**
 * Calcule le montant HT à partir du TTC et du taux de TVA
 */
export function calculateSubtotal(total: number, taxRate: number): number {
  return Number((total / (1 + taxRate / 100)).toFixed(2));
}

/**
 * Calcule le montant TTC à partir du HT et du taux de TVA
 */
export function calculateTotal(subtotal: number, taxRate: number): number {
  return Number((subtotal * (1 + taxRate / 100)).toFixed(2));
}

/**
 * Calcule le montant de TVA
 */
export function calculateTaxAmount(subtotal: number, taxRate: number): number {
  return Number((subtotal * (taxRate / 100)).toFixed(2));
}

/**
 * Formate un montant en devise
 */
export function formatCurrency(amount: number, locale = 'fr-FR', currency = 'EUR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Vérifie si une date est dépassée
 */
export function isOverdue(date: Date): boolean {
  return new Date(date) < new Date();
}

/**
 * Calcule le nombre de jours entre deux dates
 */
export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((date1.getTime() - date2.getTime()) / oneDay));
}

/**
 * Slugify une chaîne de caractères
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}
