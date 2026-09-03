import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toast } from './shared/components/toast/toast';
import { AuthService } from './core/services/auth.service';
import { ProductService } from './core/services/product.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Toast],
  template: '<router-outlet /><app-toast />'
})
export class App implements OnInit {
  private authService = inject(AuthService);
  private productService = inject(ProductService);

  ngOnInit(): void {
    this.authService.seedDefaultData();
    this.productService.seedDefaultProducts();
  }
}
