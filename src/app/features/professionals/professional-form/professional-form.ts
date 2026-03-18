import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProfessionalsService, CreateProfessionalDto } from '../../../core/services/professionals.service';

@Component({
  selector:    'app-professional-form',
  standalone:  true,
  imports:     [ReactiveFormsModule, RouterLink],
  templateUrl: './professional-form.html',
  styleUrl: './professional-form.css',
})
export class ProfessionalFormComponent implements OnInit, OnDestroy {
  private svc   = inject(ProfessionalsService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private fb     = inject(FormBuilder);
  private subs   = new Subscription();

  protected isEditMode = signal(false);
  protected loading    = signal(false);
  protected errorMsg   = signal<string | null>(null);
  private   editingId: string | null = null;

  form = this.fb.group({
    firstName:       ['', [Validators.required]],
    lastName:        ['', [Validators.required]],
    type:            ['', [Validators.required]],
    specialty:       ['', [Validators.required]],
    intervalMinutes: [30, [Validators.required, Validators.min(1)]],
    email:           ['', [Validators.required, Validators.email]],
    isActive:        [true],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.editingId = id;
      this.loadProfessional(id);
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private loadProfessional(id: string): void {
    this.loading.set(true);
    const sub = this.svc.getById(id).subscribe({
      next: (prof) => {
        if (prof) {
          this.form.patchValue(prof);
        }
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); }
    });
    this.subs.add(sub);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMsg.set(null);

    const dto = this.form.value as CreateProfessionalDto;

    const request = this.isEditMode() && this.editingId
      ? this.svc.update(this.editingId, dto)
      : this.svc.create(dto);

    const sub = request.subscribe({
      next:  () => {
        this.loading.set(false);
        this.router.navigate(['/professionals']);
      },
      error: () => {
        this.loading.set(false);
        this.errorMsg.set('Ocurrió un error al guardar. Intenta de nuevo.');
      }
    });
    this.subs.add(sub);
  }

  protected isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }
}