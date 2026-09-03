import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';
import { ToastService } from '../../core/services/toast.service';
import { Settings } from '../../core/models';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings.html',
  styles: [`
    .logo-preview { margin-top: 0.5rem; }
    .logo-preview img { max-width: 150px; max-height: 80px; border-radius: 8px; border: 1px solid #e5e7eb; }
    .logo-error { color: #ef4444; font-size: 0.8rem; margin-top: 0.25rem; }
  `]
})
export class SettingsPage implements OnInit {
  private settingsService = inject(SettingsService);
  private toast = inject(ToastService);

  logoError = false;
  formData: Settings = {
    shopName: '', address: '', phone: '', taxId: '', taxRate: 15, receiptWidth: '80mm', logoUrl: ''
  };

  ngOnInit(): void {
    this.formData = { ...this.settingsService.settings() };
  }

  onSave(): void {
    this.settingsService.updateSettings(this.formData);
    this.toast.success('تم حفظ الإعدادات بنجاح');
  }
}
