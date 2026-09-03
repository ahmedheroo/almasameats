import { Injectable, signal, computed } from '@angular/core';
import { User } from '../models';

const STORAGE_KEY = 'pos_users';
const AUTH_KEY = 'pos_current_user';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _currentUser = signal<User | null>(this.loadUser());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly isAdmin = computed(() => this._currentUser()?.role === 'admin');

  private loadUser(): User | null {
    try {
      const data = localStorage.getItem(AUTH_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  private getUsers(): User[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }

  async login(username: string, password: string): Promise<{ success: boolean; message: string }> {
    const hashed = await hashPassword(password);
    const users = this.getUsers();
    const user = users.find(u => u.username === username && u.password === hashed && u.active);

    if (!user) {
      return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    }

    this._currentUser.set(user);
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    return { success: true, message: 'تم تسجيل الدخول بنجاح' };
  }

  logout(): void {
    this._currentUser.set(null);
    localStorage.removeItem(AUTH_KEY);
  }

  getUsersList(): User[] {
    return this.getUsers().filter(u => u.active);
  }

  getAllUsers(): User[] {
    return this.getUsers();
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'password'> & { password?: string }): Promise<User> {
    const users = this.getUsers();

    if (users.some(u => u.username === userData.username)) {
      throw new Error('اسم المستخدم موجود بالفعل');
    }

    const hashed = await hashPassword(userData.password || '123456');
    const newUser: User = {
      ...userData,
      id: this.generateId(),
      password: hashed,
      createdAt: new Date().toISOString(),
      active: true
    };

    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  async updateUser(id: string, data: Partial<User> & { password?: string }): Promise<User> {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);

    if (index === -1) {
      throw new Error('المستخدم غير موجود');
    }

    if (data.password) {
      data.password = await hashPassword(data.password);
    } else {
      delete data.password;
    }

    users[index] = { ...users[index], ...data };
    this.saveUsers(users);

    const current = this._currentUser();
    if (current?.id === id) {
      this._currentUser.set(users[index]);
      localStorage.setItem(AUTH_KEY, JSON.stringify(users[index]));
    }

    return users[index];
  }

  deleteUser(id: string): void {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === id);

    if (index !== -1) {
      users[index].active = false;
      this.saveUsers(users);
    }
  }

  seedDefaultData(): void {
    const users = this.getUsers();
    if (users.length === 0) {
      this.createUser({
        username: 'admin',
        password: '123456',
        displayName: 'المدير',
        role: 'admin',
        active: true
      });
    }
  }
}
