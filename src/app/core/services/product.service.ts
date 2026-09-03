import { Injectable, signal } from '@angular/core';
import { Product } from '../models';

const STORAGE_KEY = 'pos_products';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly _products = signal<Product[]>(this.loadProducts());
  readonly products = this._products.asReadonly();

  private loadProducts(): Product[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private save(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._products()));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }

  getActiveProducts(): Product[] {
    return this._products().filter(p => p.active);
  }

  getProductById(id: string): Product | undefined {
    return this._products().find(p => p.id === id);
  }

  searchProducts(query: string): Product[] {
    const q = query.toLowerCase().trim();
    return this.getActiveProducts().filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.barcode.toLowerCase().includes(q)
    );
  }

  findByBarcode(barcode: string): Product | undefined {
    return this.getActiveProducts().find(p => p.barcode === barcode);
  }

  createProduct(data: Omit<Product, 'id' | 'createdAt'>): Product {
    const product: Product = {
      ...data,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };
    this._products.update(list => [...list, product]);
    this.save();
    return product;
  }

  updateProduct(id: string, data: Partial<Product>): Product {
    let updated!: Product;
    this._products.update(list =>
      list.map(p => {
        if (p.id === id) {
          updated = { ...p, ...data };
          return updated;
        }
        return p;
      })
    );
    this.save();
    return updated;
  }

  deleteProduct(id: string): void {
    this._products.update(list => list.filter(p => p.id !== id));
    this.save();
  }

  toggleActive(id: string): void {
    this._products.update(list =>
      list.map(p => p.id === id ? { ...p, active: !p.active } : p)
    );
    this.save();
  }

  getActiveCount(): number {
    return this._products().filter(p => p.active).length;
  }

  seedDefaultProducts(): void {
    if (this._products().length > 0) return;

    const defaults: Omit<Product, 'id' | 'createdAt'>[] = [
      { name: 'حليب طازج', price: 6.50, description: 'حليب طازج كامل الدسم', sku: 'P001', barcode: '6281000000001', imageUrl: '', active: true },
      { name: 'خبز أبيض', price: 3.00, description: 'ربطة خبز أبيض طازج', sku: 'P002', barcode: '6281000000002', imageUrl: '', active: true },
      { name: 'أرز بسمتي', price: 25.00, description: 'أرز بسمتي هندي 5 كجم', sku: 'P003', barcode: '6281000000003', imageUrl: '', active: true },
      { name: 'زيت زيتون', price: 35.00, description: 'زيت زيتون بكر ممتاز 1 لتر', sku: 'P004', barcode: '6281000000004', imageUrl: '', active: true },
      { name: 'سكر أبيض', price: 12.00, description: 'سكر أبيض ناعم 2 كجم', sku: 'P005', barcode: '6281000000005', imageUrl: '', active: true },
      { name: 'شاي أحمر', price: 8.00, description: 'علبة شاي أحمر 100 كيس', sku: 'P006', barcode: '6281000000006', imageUrl: '', active: true },
      { name: 'ماء معدني', price: 1.00, description: 'رزمة ماء معدني 12 حبة', sku: 'P007', barcode: '6281000000007', imageUrl: '', active: true },
      { name: 'جبنة بيضاء', price: 15.00, description: 'جبنة بيضاء طازجة 400 جرام', sku: 'P008', barcode: '6281000000008', imageUrl: '', active: true },
    ];

    defaults.forEach(d => this.createProduct(d));
  }
}
