import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription }    from 'rxjs';
import { PatientsService } from '../../../core/services/patients.service';
import type { CreatePatientDto } from '../../../core/services/patients.service';

@Component({
  selector: 'app-patient-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './patient-form.html',
  styleUrl: './patient-form.css',
})
export class PatientFormComponent implements OnInit, OnDestroy {
  private svc    = inject(PatientsService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private fb     = inject(FormBuilder);
  private subs   = new Subscription();

  protected isEditMode = signal(false);
  protected loading    = signal(false);
  protected errorMsg   = signal<string | null>(null);
  private   editingId: string | null = null;

  form = this.fb.group({
    document: ['', [Validators.required]],
    firstName:  ['', [Validators.required]],
    lastName:   ['', [Validators.required]],
    birthdate: [''],
    phone:      ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    gender:     ['', [Validators.required]],
    email:      ['', [Validators.email]],
    isActive:   [true],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.editingId = id;
      this.loadPatient(id);
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private loadPatient(id: string): void {
    this.loading.set(true);
  const sub = this.svc.getById(id).subscribe({
    next: (patient) => {
      if (patient) {
        // Creamos una copia para no alterar el objeto original
        this.form.patchValue({
          ...patient,
          // Si hay fecha, la convertimos a "YYYY-MM-DD". Si no, enviamos null.
          birthdate: patient.birthdate 
            ? new Date(patient.birthdate).toISOString().split('T')[0] 
            : null,
          email: patient.email ? patient.email : null
        });
      }
      this.loading.set(false);
    },
    error: () => { 
      this.loading.set(false); 
      // Aquí podrías añadir un mensaje de error tipo Toast
    }
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

    const dto = this.form.value as CreatePatientDto;

    const request = this.isEditMode() && this.editingId
      ? this.svc.update(this.editingId, dto)
      : this.svc.create(dto);

    const sub = request.subscribe({
      next:  () => {
        this.loading.set(false);
        this.router.navigate(['/patients']);
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
