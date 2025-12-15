import { Injectable } from '@nestjs/common';

interface InvoiceLine {
  quantity?: number;
  unitPrice: number;
}

@Injectable()
export class BillingCalculatorService {
  calculateLineTotal(quantity: number, unitPrice: number): number {
    return Number((quantity * unitPrice).toFixed(2));
  }

  calculateSubtotal(lines: InvoiceLine[]): number {
    const subtotal = lines.reduce((sum, line) => {
      const quantity = line.quantity || 1;
      return sum + this.calculateLineTotal(quantity, line.unitPrice);
    }, 0);
    return Number(subtotal.toFixed(2));
  }

  calculateTaxAmount(subtotal: number, taxRate: number): number {
    return Number((subtotal * (taxRate / 100)).toFixed(2));
  }

  calculateTotal(subtotal: number, taxRate: number): number {
    const taxAmount = this.calculateTaxAmount(subtotal, taxRate);
    return Number((subtotal + taxAmount).toFixed(2));
  }

  calculateRemainingAmount(total: number, paidAmount: number): number {
    return Number((total - paidAmount).toFixed(2));
  }

  isFullyPaid(total: number, paidAmount: number): boolean {
    return paidAmount >= total;
  }

  isPartiallyPaid(paidAmount: number): boolean {
    return paidAmount > 0;
  }
}
