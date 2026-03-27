import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef, signal } from '@angular/core';
import { RouterLink }              from '@angular/router';
import { Subscription }            from 'rxjs';
import { ProfessionalsService }    from '../../../core/services/professionals.service';
import type { Professional }       from '../../../core/models/professional';
import { SpecialtyLabelPipe }      from '../../../shared/pipes/specialty-label-pipe';
import { FormsModule } from '@angular/forms';

@Component({
  selector:    'app-professional-list',
  standalone:  true,
  imports:     [RouterLink, SpecialtyLabelPipe, FormsModule],
  templateUrl: './professional-list.html',
  styleUrl: './professional-list.css',
})
export class ProfessionalListComponent implements OnInit, OnDestroy {
  private svc  = inject(ProfessionalsService);
  private subs = new Subscription();

  protected professionals = signal<Professional[]> ([]);
  protected loading = false;

  // Filtros
  protected filterType: string = '';
  protected filterActive: string = '';

  protected get filtered(): Professional[] {
    return this.professionals().filter(p => {
      const byType   = !this.filterType   || p.type === this.filterType;
      const byActive = !this.filterActive || String(p.isActive) === this.filterActive;
      return byType && byActive;
    });
  }

  protected get totalActive(): number {
    return this.professionals().filter(p => p.isActive).length;
  }

  protected get totalInactive(): number {
    return this.professionals().filter(p => !p.isActive).length;
  }

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private load(): void {
    this.loading = true;
    const sub = this.svc.getAll().subscribe({
      next:  (data) => { 
        this.professionals.set(data); 
        this.loading = false;
      },
      error: ()     => { this.loading = false; }
    });
    this.subs.add(sub);
  }

  protected toggleActive(prof: Professional): void {
    const sub = this.svc.toggleActive(prof.id, !prof.isActive).subscribe({
      next: () => { this.load(); }
    });
    this.subs.add(sub);
  }
}