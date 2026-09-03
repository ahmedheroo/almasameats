import { Component, signal, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { Toast } from '../../shared/components/toast/toast';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Toast],
  templateUrl: './layout.html',
  styleUrl: './layout.scss'
})
export class Layout {
  authService = inject(AuthService);
  cartService = inject(CartService);
  private router = inject(Router);
  sidebarCollapsed = signal(false);

  allNavItems = [
    { icon: 'fas fa-home', label: '\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629', route: '/dashboard', exact: true, adminOnly: true },
    { icon: 'fas fa-cash-register', label: '\u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u064A\u0639', route: '/pos', exact: false, adminOnly: false },
    { icon: 'fas fa-box-open', label: '\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A', route: '/products', exact: false, adminOnly: true },
    { icon: 'fas fa-file-invoice-dollar', label: '\u0627\u0644\u0641\u0648\u0627\u062A\u064A\u0631', route: '/invoices', exact: false, adminOnly: true },
    { icon: 'fas fa-users', label: '\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u0648\u0646', route: '/users', exact: false, adminOnly: true },
    { icon: 'fas fa-cog', label: '\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A', route: '/settings', exact: false, adminOnly: true },
  ];

  allMobileNavItems = [
    { icon: 'fas fa-home', label: '\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629', route: '/dashboard', exact: true, adminOnly: true },
    { icon: 'fas fa-cash-register', label: '\u0627\u0644\u0628\u064A\u0639', route: '/pos', exact: false, adminOnly: false },
    { icon: 'fas fa-box-open', label: '\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A', route: '/products', exact: false, adminOnly: true },
    { icon: 'fas fa-file-invoice-dollar', label: '\u0627\u0644\u0641\u0648\u0627\u062A\u064A\u0631', route: '/invoices', exact: false, adminOnly: true },
    { icon: 'fas fa-cog', label: '\u0625\u0639\u062F\u0627\u062F\u0627\u062A', route: '/settings', exact: false, adminOnly: true },
  ];

  navItems = computed(() => {
    if (this.authService.isAdmin()) {
      return this.allNavItems;
    }
    return this.allNavItems.filter(item => !item.adminOnly);
  });

  mobileNavItems = computed(() => {
    if (this.authService.isAdmin()) {
      return this.allMobileNavItems;
    }
    return this.allMobileNavItems.filter(item => !item.adminOnly);
  });

  toggleSidebar(): void { this.sidebarCollapsed.update(v => !v); }
  logout(): void { this.authService.logout(); this.router.navigate(['/login']); }
}
