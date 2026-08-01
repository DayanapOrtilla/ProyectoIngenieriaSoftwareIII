import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  ProfessionalsService,
  CreateProfessionalDto,
} from '../../../core/services/professionals.service';
import { AvailabilityComponent } from '../availability/availability';

@Component({
  selector: 'app-professional-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AvailabilityComponent],
  templateUrl: './professional-form.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './professional-form.css',
})
export class ProfessionalFormComponent implements OnInit, OnDestroy {
  private svc = inject(ProfessionalsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private fb = inject(FormBuilder);
  private subs = new Subscription();

  protected activeTab = signal<'profile' | 'schedule'>('profile');
  protected isEditMode = signal(false);
  protected loading = signal(false);
  protected errorMsg = signal<string | null>(null);
  protected editingId: string | null = null;

  protected showAvailability = signal(false);

  form = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    type: ['', [Validators.required]],
    specialty: ['', [Validators.required]],
    intervalMinutes: [30, [Validators.required, Validators.min(1)]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    confirm: [''],
    isActive: [true],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isEditMode.set(true);
      this.editingId = id;

      this.form.get('password')?.clearValidators();
      this.form.get('confirm')?.clearValidators();
      this.form.clearValidators();
      this.form.get('password')?.updateValueAndValidity();
      this.form.get('confirm')?.updateValueAndValidity();
      this.form.updateValueAndValidity();

      this.loadProfessional(id);
    } else {
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      this.form.get('confirm')?.setValidators([Validators.required]);
      this.form.setValidators(this.passwordMatch);
      this.form.get('password')?.updateValueAndValidity();
      this.form.get('confirm')?.updateValueAndValidity();
      this.form.updateValueAndValidity();
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  private passwordMatch(group: AbstractControl) {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirm')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  private loadProfessional(id: string): void {
    this.loading.set(true);

    const sub = this.svc.getById(id).subscribe({
      next: (prof) => {
        if (prof) {
          this.editingId = prof.id;

          this.form.patchValue({
            firstName: prof.firstName,
            lastName: prof.lastName,
            type: prof.type,
            specialty: prof.specialty,
            intervalMinutes: prof.intervalMinutes,
            email: prof.email,
            isActive: prof.isActive,
            password: '',
            confirm: '',
          });
        }

        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.errorMsg.set('No se pudo cargar el profesional.');
      },
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

    const dto: any = { ...this.form.value };

    delete dto.confirm;

    if (this.isEditMode()) {
      delete dto.password;
    }

    const request =
      this.isEditMode() && this.editingId
        ? this.svc.update(this.editingId, dto)
        : this.svc.create(dto as CreateProfessionalDto);

    this.subs.add(
      request.subscribe({
        next: (res: any) => {
          this.loading.set(false);

          if (!this.isEditMode()) {
            this.editingId = res.id;
            this.isEditMode.set(true);
            this.activeTab.set('schedule');
          } else {
            this.router.navigate(['/professionals']);
          }
        },
        error: () => {
          this.loading.set(false);
          this.errorMsg.set('Ocurrió un error al guardar.');
        },
      }),
    );
  }

  protected toggleAvailability(): void {
    this.showAvailability.update((v) => !v);
  }

  protected isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  get passwordMismatch(): boolean {
    return !!(this.form.hasError('mismatch') && this.form.get('confirm')?.touched);
  }
}
