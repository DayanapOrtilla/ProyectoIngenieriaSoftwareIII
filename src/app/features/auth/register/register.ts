import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink }        from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector:    'app-register',
  standalone:  true,
  imports:     [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  private router = inject(Router);
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);

  form = this.fb.group({
    documentId: ['', [Validators.required]],
    firstName:  ['', [Validators.required]],
    lastName:   ['', [Validators.required]],
    phone:      ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
    gender:     ['', [Validators.required]],
    email:      ['', [Validators.required, Validators.email]],
    password:   ['', [Validators.required, Validators.minLength(8)]],
    confirm:    ['', [Validators.required]],
  }, { validators: this.passwordMatch });

  loading  = signal(false);
  errorMsg = signal<string | null>(null);

  // Validador personalizado: Valor de contraseña y confirmación deben coincidir
  private passwordMatch(group: AbstractControl) {
    const pass    = group.get('password')?.value;
    const confirm = group.get('confirm')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMsg.set(null);

    try {
    // TODO: reemplazar con llamada real al backend
      // await this.patientsSvc.register(this.form.value);

      // Tras registro, inicia sesión automáticamente con el email y contraseña
      // En producción el backend devolverá el token directamente en el registro
      await this.auth.login({
        email:    this.form.value.email!,
        password: this.form.value.password!,
      });

      // Tras registro exitoso → asistente de agendamiento (HU-2.2)
      this.router.navigate(['/appointments/book']);

    } catch {
      this.errorMsg.set('Ocurrió un error al crear la cuenta. Intenta de nuevo.');
    } finally {
      this.loading.set(false);
    }
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }

  get passwordMismatch(): boolean {
    return !!(
      this.form.hasError('mismatch') &&
      this.form.get('confirm')?.touched
    );
  }
}