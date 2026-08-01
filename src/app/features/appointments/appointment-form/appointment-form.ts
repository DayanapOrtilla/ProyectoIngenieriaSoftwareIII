import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { of, Subject, Subscription } from 'rxjs';
import {
  AppointmentsService,
  CreateAppointmentDTO,
} from '../../../core/services/appointments.service';
import { PatientsService, CreatePatientDto } from '../../../core/services/patients.service';
import { AuthService } from '../../../core/services/auth.service';
import type { Professional } from '../../../core/models/professional';
import type { Specialty } from '../../../core/models/professional';
import type { Patient } from '../../../core/models/patient';
import { SpecialtyLabelPipe } from '../../../shared/pipes/specialty-label-pipe';
import {
  debounceTime,
  distinctUntilChanged,
  switchMap,
  catchError,
  finalize,
} from 'rxjs/operators';

const SPECIALTY_DESCRIPTIONS: Record<Specialty, string> = {
  QUIROPRAXIA: 'Ajuste y alineación de columna vertebral',
  FISIOTERAPIA: 'Rehabilitación fí­sica y muscular',
  TERAPIA_NEURAL: 'Tratamiento del sistema nervioso',
};

@Component({
  selector: 'app-appointment-form',
  standalone: true,
  imports: [SpecialtyLabelPipe, FormsModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './appointment-form.html',
})
export class AppointmentFormComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private svc = inject(AppointmentsService);
  private patientsSvc = inject(PatientsService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private subs = new Subscription();

  protected isSchedulerMode = signal(false);
  protected currentStep = 1;
  protected totalSteps = 3;
  protected booking: Partial<CreateAppointmentDTO> = {};
  protected confirmed = false;
  protected loading = false;
  protected errorMsg: string | null = null;

  protected searchTerm = '';
  protected searchResults: Patient[] = [];
  protected selectedPatient: Patient | null = null;
  protected showNewPatientForm = false;
  protected searchLoading = false;

  private searchSubject = new Subject<string>();

  protected patientForm = this.fb.group({
    documentId: ['', [Validators.required]],
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    gender: ['', [Validators.required]],
    email: ['', [Validators.email]],
  });

  protected specialties = signal<Specialty[]>([]);
  protected professionals = signal<Professional[]>([]);
  protected specialtyDescriptions = SPECIALTY_DESCRIPTIONS;
  protected availableSlots: string[] = [];

  protected get minDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  protected get maxDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 28);
    return d.toISOString().split('T')[0];
  }

  protected get canGoStep2(): boolean {
    if (this.isSchedulerMode()) {
      return (
        this.selectedPatient !== null &&
        this.booking.specialty !== null &&
        this.booking.professional !== null
      );
    }
    return this.booking.specialty !== null && this.booking.professional !== null;
  }

  protected get canGoStep3(): boolean {
    return this.booking.date !== null && this.booking.time !== null;
  }

  ngOnInit(): void {
    this.isSchedulerMode.set(this.route.snapshot.data['mode'] === 'scheduler');
    this.loadSpecialties();

    this.subs.add(
      this.searchSubject
        .pipe(
          debounceTime(300),
          distinctUntilChanged(),
          switchMap((term) => {
            if (term.trim().length < 3) {
              this.searchLoading = false;
              return of([]);
            }
            this.searchLoading = true;
            return this.patientsSvc.search(term).pipe(
              catchError(() => of([])),
              finalize(() => (this.searchLoading = false)),
            );
          }),
        )
        .subscribe((data) => {
          this.searchResults = data || [];
          this.searchLoading = false;
        }),
    );
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  protected onSearchChange(term: string): void {
    this.searchTerm = term;
    this.selectedPatient = null;

    if (term.trim().length < 3) {
      this.searchResults = [];
      this.searchLoading = false;
      this.cdr.detectChanges();
      return;
    }

    this.searchLoading = true;
    this.cdr.detectChanges();

    const sub = this.patientsSvc.search(term).subscribe({
      next: (data) => {
        this.searchResults = data || [];
        this.searchLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.searchResults = [];
        this.searchLoading = false;
        this.cdr.detectChanges();
      },
    });
    this.subs.add(sub);
  }

  protected selectPatient(patient: Patient): void {
    this.selectedPatient = patient;
    this.searchResults = [];
    this.searchTerm = `${patient.firstName} ${patient.lastName}`;
    this.showNewPatientForm = false;
  }

  protected clearPatient(): void {
    this.selectedPatient = null;
    this.searchTerm = '';
    this.searchResults = [];
    this.showNewPatientForm = false;
  }

  protected toggleNewPatientForm(): void {
    this.showNewPatientForm = !this.showNewPatientForm;
    this.selectedPatient = null;
    if (this.showNewPatientForm) {
      this.patientForm.reset();
    }
  }

  protected saveNewPatient(): void {
    if (this.patientForm.invalid) {
      this.patientForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    const sub = this.patientsSvc.create(this.patientForm.value as CreatePatientDto).subscribe({
      next: (patient) => {
        this.selectedPatient = patient;
        this.showNewPatientForm = false;
        this.searchTerm = `${patient.firstName} ${patient.lastName}`;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
    this.subs.add(sub);
  }

  private loadSpecialties(): void {
    const sub = this.svc.getAvailableSpecialties().subscribe({
      next: (data) => {
        this.specialties.set(data);
      },
    });
    this.subs.add(sub);
  }

  protected selectSpecialty(specialty: Specialty): void {
    if (this.booking.specialty !== specialty) {
      this.booking.professional = undefined;
      this.booking.date = undefined;
      this.booking.time = undefined;
      this.professionals.set([]);
      this.availableSlots = [];
    }
    this.booking.specialty = specialty;
    this.loading = true;
    const sub = this.svc.getProfessionalsBySpecialty(specialty).subscribe({
      next: (data) => {
        this.professionals.set(data);
        this.booking.professional = data.length > 0 ? data[0] : undefined;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
    this.subs.add(sub);
  }

  protected selectProfessional(prof: Professional): void {
    this.booking.professional = prof;
    this.booking.time = undefined;
    this.availableSlots = [];
    if (this.booking.date) {
      this.onDateChange(this.booking.date);
    }
  }

  protected onDateChange(date: string): void {
    this.booking.date = date;
    this.booking.time = undefined;
    this.availableSlots = [];
    if (!date || !this.booking.professional) {
      this.cdr.detectChanges();
      return;
    }
    this.loading = true;
    this.cdr.detectChanges();
    const sub = this.svc.getAvailableSlots(this.booking.professional.id, date).subscribe({
      next: (slots) => {
        this.availableSlots = slots || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
    this.subs.add(sub);
  }

  protected selectSlot(slot: string): void {
    this.booking.time = slot;
  }

  protected confirm(): void {
    const dateValue = this.booking.date;
    const timeValue = this.booking.time;
    const professionalId = this.booking.professional?.id;

    if (!dateValue || !timeValue || !professionalId) {
      this.errorMsg = 'Faltan datos obligatorios para confirmar la cita.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.errorMsg = null;
    this.cdr.detectChanges();

    if (this.isSchedulerMode()) {
      const patientId = this.selectedPatient?.id;
      if (!patientId) {
        this.loading = false;
        this.errorMsg = 'Debe seleccionar un paciente.';
        this.cdr.detectChanges();
        return;
      }
      this.submitAppointment(dateValue, timeValue, professionalId, patientId);
    } else {
      const sub = this.patientsSvc.findByUser().subscribe({
        next: (patient: any) => {
          if (!patient?.id) {
            this.loading = false;
            this.errorMsg = 'No se encontró el perfil de paciente asociado a tu cuenta.';
            this.cdr.detectChanges();
            return;
          }

          this.submitAppointment(dateValue, timeValue, professionalId, patient.id);
        },
        error: () => {
          this.loading = false;
          this.errorMsg = 'No se encontrÃ³ el perfil de paciente asociado a tu cuenta.';
          this.cdr.detectChanges();
        },
      });
      this.subs.add(sub);
    }
  }

  private submitAppointment(
    date: string,
    time: string,
    professionalId: string,
    patientId: string,
  ): void {
    const appointmentPayload = {
      date: new Date(date + 'T12:00:00'),
      time,
      status: 'CONFIRMADA',
      professionalId,
      patientId,
    };
    const sub = this.svc.confirmAppointment(appointmentPayload as any).subscribe({
      next: () => {
        this.loading = false;
        this.confirmed = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        const errorData = err.error?.message;
        this.errorMsg = Array.isArray(errorData)
          ? errorData[0]
          : errorData || 'Error al confirmar la cita';
        this.cdr.detectChanges();
      },
    });
    this.subs.add(sub);
  }

  protected goToStep(step: number): void {
    this.errorMsg = null;
    this.currentStep = step;
    if (step === 2 && this.booking.date && this.booking.professional) {
      this.onDateChange(this.booking.date);
    }
    this.cdr.detectChanges();
  }

  protected goBack(): void {
    this.router.navigate(['/appointments']);
  }

  protected goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  protected isSelectedSpecialty(s: Specialty): boolean {
    return this.booking.specialty === s;
  }

  protected isSelectedProfessional(p: Professional): boolean {
    return this.booking.professional?.id === p.id;
  }

  protected isSelectedSlot(slot: string): boolean {
    return this.booking.time === slot;
  }

  protected formatDate(date: string): string {
    return new Date(date + 'T00:00:00').toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  protected isInvalid(field: string): boolean {
    const ctrl = this.patientForm.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }
}
