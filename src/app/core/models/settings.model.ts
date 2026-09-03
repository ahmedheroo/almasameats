export enum PaymentMethod {
  CASH = 'نقدي',
  CARD = 'بطاقة بنكية'
}

export interface Settings {
  shopName: string;
  address: string;
  phone: string;
  taxId: string;
  taxRate: number;
  receiptWidth: '58mm' | '80mm';
  logoUrl: string;
}

export const DEFAULT_SETTINGS: Settings = {
  shopName: 'مسالخ الماسة المضيئة للحوم',
  address: 'الرياض - المملكة العربية السعودية',
  phone: '0500468430',
  taxId: '311940157300003',
  taxRate: 15,
  receiptWidth: '80mm',
  logoUrl: ''
};
