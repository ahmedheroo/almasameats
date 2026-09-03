import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InvoiceService } from '../../core/services/invoice.service';
import { Invoice } from '../../core/models';
import { ArabicDatePipe } from '../../shared/pipes/date.pipe';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [RouterLink, FormsModule, ArabicDatePipe],
  templateUrl: './invoice-list.html',
  styles: ['.search-section { margin-bottom: 1.5rem; } .search-section input { max-width: 400px; }']
})
export class InvoiceList {
  private invoiceService = inject(InvoiceService);
  searchQuery = '';
  filteredInvoices = signal<Invoice[]>(this.invoiceService.invoices());

  filterInvoices(): void {
    this.filteredInvoices.set(this.invoiceService.searchInvoices(this.searchQuery));
  }
}
