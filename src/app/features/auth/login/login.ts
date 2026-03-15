import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink }        from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';


@Component({
  selector:    'app-login',
  standalone:  true,
  imports:     [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);
  private fb     = inject(FormBuilder);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  loading  = signal(false);
  errorMsg = signal<string | null>(null);

  async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMsg.set(null);

    try {
      const { email, password } = this.form.value;
      await this.auth.login({ email: email!, password: password! });
      this.router.navigate(['/dashboard']);
    } catch {
      this.errorMsg.set('Correo o contraseña incorrectos.');
    } finally {
      this.loading.set(false);
    }
  }

  // Helpers para validación en template
  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!(ctrl?.invalid && ctrl.touched);
  }
}