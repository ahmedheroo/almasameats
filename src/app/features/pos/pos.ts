import { Component, signal, computed, inject, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { SettingsService } from '../../core/services/settings.service';
import { ToastService } from '../../core/services/toast.service';
import { Product, Invoice, PaymentMethod } from '../../core/models';
import { ArabicDatePipe } from '../../shared/pipes/date.pipe';
import { ArabicTimePipe } from '../../shared/pipes/time.pipe';
import QRCode from 'qrcode';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [FormsModule, ArabicDatePipe, ArabicTimePipe],
  templateUrl: './pos.html',
  styleUrl: './pos.scss'
})
export class Pos {
  @ViewChild('printArea') printArea!: ElementRef;
  cartService = inject(CartService);
  private productService = inject(ProductService);
  private invoiceService = inject(InvoiceService);
  private settingsService = inject(SettingsService);
  private toast = inject(ToastService);

  searchQuery = '';
  barcodeInput = '';
  discountAmount = 0;
  paymentMethod: PaymentMethod = PaymentMethod.CASH;
  showMobileCart = false;
  lastInvoice: Invoice | null = null;
  settings = computed(() => this.settingsService.settings());

  filteredProducts = signal<Product[]>(this.productService.getActiveProducts());

  taxAmount = computed(() => {
    const sub = this.cartService.subtotal();
    const disc = this.discountAmount;
    const rate = this.settings().taxRate;
    return Math.round((sub - disc) * rate / 100 * 100) / 100;
  });

  finalTotal = computed(() => {
    const sub = this.cartService.subtotal();
    const disc = this.discountAmount;
    const tax = this.taxAmount();
    return Math.max(0, Math.round((sub - disc + tax) * 100) / 100);
  });

  onSearch(): void {
    const q = this.searchQuery.trim();
    if (!q) {
      this.filteredProducts.set(this.productService.getActiveProducts());
    } else {
      this.filteredProducts.set(this.productService.searchProducts(q));
    }
  }

  onBarcodeScan(): void {
    const barcode = this.barcodeInput.trim();
    if (!barcode) return;
    const product = this.productService.findByBarcode(barcode);
    if (product) {
      this.addToCart(product);
      this.barcodeInput = '';
      this.toast.success(`تمت إضافة: ${product.name}`);
    } else {
      this.toast.error('المنتج غير موجود');
    }
  }

  addToCart(product: Product): void {
    this.cartService.addItem(product);
  }

  onDiscountChange(): void {
    this.cartService.setDiscount(this.discountAmount);
  }

  clearCart(): void {
    this.cartService.clear();
    this.discountAmount = 0;
    this.showMobileCart = false;
  }

  async completeSale(): Promise<void> {
    if (this.cartService.items().length === 0) {
      this.toast.error('السلة فارغة');
      return;
    }
    this.lastInvoice = this.invoiceService.completeSale(this.paymentMethod);
    this.discountAmount = 0;
    this.showMobileCart = false;
    this.toast.success('تم إتمام البيع بنجاح');

    // Generate QR code
    setTimeout(async () => {
      const qrEl = document.getElementById('qrCode');
      if (qrEl && this.lastInvoice) {
        const data = `INV:${this.lastInvoice.invoiceNumber}|TOTAL:${this.lastInvoice.total}|TAX:${this.lastInvoice.taxAmount}|DATE:${this.lastInvoice.createdAt}`;
        try {
          const url = await QRCode.toDataURL(data, { width: 120 });
          qrEl.innerHTML = `<img src="${url}" width="120" height="120">`;
        } catch { /* ignore */ }
      }
    }, 100);

    // Print after short delay
    setTimeout(() => { window.print(); }, 300);
  }
}
