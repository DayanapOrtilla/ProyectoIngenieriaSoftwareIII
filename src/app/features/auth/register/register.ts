import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink }        from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';

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

  // Validador personalizado: contraseña y confirmación deben coincidir
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

    // TODO: reemplazar con llamada real al backend
    // await this.authService.register(this.form.value);
    await new Promise(r => setTimeout(r, 800)); // simula latencia

    this.loading.set(false);
    // Tras registro exitoso → asistente de agendamiento (HU-2.2)
    this.router.navigate(['/appointments/book']);
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