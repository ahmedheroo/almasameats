import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { User } from '../../core/models';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [RouterLink, ConfirmDialog],
  templateUrl: './user-list.html',
  styles: []
})
export class UserList {
  private authService = inject(AuthService);
  private toast = inject(ToastService);
  users = signal<User[]>(this.authService.getAllUsers());
  showDeleteDialog = signal(false);
  userToDelete: User | null = null;

  confirmDelete(user: User): void {
    this.userToDelete = user;
    this.showDeleteDialog.set(true);
  }

  onDelete(): void {
    if (this.userToDelete) {
      this.authService.deleteUser(this.userToDelete.id);
      this.toast.success('تم حذف المستخدم');
      this.users.set(this.authService.getAllUsers());
    }
    this.showDeleteDialog.set(false);
  }
}
