import { Component, signal, computed, inject, ViewChild, ElementRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../core/services/cart.service';
import { ProductService } from '../../core/services/product.service';
import { InvoiceService } from '../../core/services/invoice.service';
import { SettingsService } from '../../core/services/settings.service';
import { ToastService } from '../../core/services/toast.service';
import { Product, Invoice, PaymentMethod } from '../../core/models';
import { ArabicDatePipe } from '../../shared/pipes/date.pipe';
import { ArabicTimePipe } from '../../shared/pipes/time.pipe';
import { encodeZatcaQr, formatZatcaTimestamp, formatZatcaAmount } from '../../core/utils/zatca-qr';
import QRCode from 'qrcode';

@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [FormsModule, ArabicDatePipe, ArabicTimePipe],
  templateUrl: './pos.html',
  styleUrl: './pos.scss'
})
export class Pos implements OnInit {
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

  filteredProducts = signal<Product[]>([]);

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

  ngOnInit(): void {
    this.filteredProducts.set(this.productService.getActiveProducts());
  }

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
    this.lastInvoice = await this.invoiceService.completeSale(this.paymentMethod);
    this.discountAmount = 0;
    this.showMobileCart = false;
    this.toast.success('تم إتمام البيع بنجاح');

    // Generate ZATCA-compliant QR code
    setTimeout(async () => {
      const qrEl = document.getElementById('qrCode');
      if (qrEl && this.lastInvoice) {
        const s = this.settings();
        const qrBase64 = encodeZatcaQr({
          sellerName: s.shopName,
          vatNumber: s.taxId,
          timestamp: formatZatcaTimestamp(this.lastInvoice.createdAt),
          invoiceTotal: formatZatcaAmount(this.lastInvoice.total),
          vatTotal: formatZatcaAmount(this.lastInvoice.taxAmount),
        });

        try {
          const url = await QRCode.toDataURL(qrBase64, { width: 150, margin: 1 });
          qrEl.innerHTML = `<img src="${url}" width="150" height="150">`;
        } catch { /* ignore */ }
      }
    }, 100);

    // Print after short delay
    setTimeout(() => { window.print(); }, 300);
  }
}
