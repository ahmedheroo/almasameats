import { Injectable, signal } from '@angular/core';
import { Invoice, InvoiceItem, PaymentMethod } from '../models';
import { CartService } from './cart.service';
import { AuthService } from './auth.service';
import { SettingsService } from './settings.service';

const STORAGE_KEY = 'pos_invoices';
const COUNTER_KEY = 'pos_invoice_counter';

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly _invoices = signal<Invoice[]>(this.loadInvoices());
  readonly invoices = this._invoices.asReadonly();

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private settingsService: SettingsService
  ) {}

  private loadInvoices(): Invoice[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._invoices()));
  }

  private getNextNumber(): number {
    const data = localStorage.getItem(COUNTER_KEY);
    const next = data ? parseInt(data, 10) + 1 : 1;
    localStorage.setItem(COUNTER_KEY, next.toString());
    return next;
  }

  completeSale(paymentMethod: PaymentMethod): Invoice {
    const items = this.cartService.items();
    const discount = this.cartService.discount();
    const subtotal = this.cartService.subtotal();
    const settings = this.settingsService.settings();
    const currentUser = this.authService.currentUser();

    const taxAmount = Math.round((subtotal - discount) * settings.taxRate / 100 * 100) / 100;
    const total = Math.round((subtotal - discount + taxAmount) * 100) / 100;

    const invoiceItems: InvoiceItem[] = items.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      quantity: item.quantity,
      unitPrice: item.product.price,
      total: Math.round(item.product.price * item.quantity * 100) / 100
    }));

    const invoice: Invoice = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
      invoiceNumber: this.getNextNumber(),
      items: invoiceItems,
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      taxRate: settings.taxRate,
      taxAmount,
      total,
      paymentMethod,
      cashierName: currentUser?.displayName ?? 'غير معروف',
      createdAt: new Date().toISOString()
    };

    this._invoices.update(list => [invoice, ...list]);
    this.save();
    this.cartService.clear();

    return invoice;
  }

  getInvoiceById(id: string): Invoice | undefined {
    return this._invoices().find(inv => inv.id === id);
  }

  searchInvoices(query: string): Invoice[] {
    const q = query.trim();
    if (!q) return this._invoices();
    return this._invoices().filter(inv =>
      inv.invoiceNumber.toString().includes(q)
    );
  }

  getTodaySales(): { total: number; count: number } {
    const today = new Date().toDateString();
    const todayInvoices = this._invoices().filter(inv =>
      new Date(inv.createdAt).toDateString() === today
    );
    return {
      total: todayInvoices.reduce((sum, inv) => sum + inv.total, 0),
      count: todayInvoices.length
    };
  }

  getTopProducts(limit: number = 5): { name: string; count: number; total: number }[] {
    const map = new Map<string, { name: string; count: number; total: number }>();

    for (const inv of this._invoices()) {
      for (const item of inv.items) {
        const existing = map.get(item.productId);
        if (existing) {
          existing.count += item.quantity;
          existing.total += item.total;
        } else {
          map.set(item.productId, {
            name: item.productName,
            count: item.quantity,
            total: item.total
          });
        }
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getRecentInvoices(limit: number = 5): Invoice[] {
    return this._invoices().slice(0, limit);
  }
}
