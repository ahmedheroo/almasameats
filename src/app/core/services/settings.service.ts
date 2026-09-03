import { Injectable, signal } from '@angular/core';
import { Settings, DEFAULT_SETTINGS } from '../models';

const STORAGE_KEY = 'pos_settings';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly _settings = signal<Settings>(this.loadSettings());
  readonly settings = this._settings.asReadonly();

  private loadSettings(): Settings {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : { ...DEFAULT_SETTINGS };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  }

  updateSettings(data: Partial<Settings>): void {
    this._settings.update(s => ({ ...s, ...data }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this._settings()));
  }

  getSettings(): Settings {
    return this._settings();
  }
}
