import { Routes }    from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [

  // ── Rutas públicas (sin layout ni guards) ───────────
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login')
      .then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register')
      .then(m => m.RegisterComponent),
  },

  // ── Rutas protegidas (con layout) ───────────────────
  {
    path: '',
    loadComponent: () => import('./shared/layout/main-layout/main-layout')
      .then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard')
          .then(m => m.DashboardComponent),
      },

      // Citas — Agendador, Admin, Médico, Terapista
      {
        path: 'appointments',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'AGENDADOR', 'MEDICO', 'TERAPISTA'] },
        loadComponent: () => import('./features/appointments/appointment-list/appointment-list')
          .then(m => m.AppointmentListComponent),
      },
      {
        path: 'appointments/new',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'AGENDADOR'], mode: 'scheduler' },
        loadComponent: () => import('./features/appointments/appointment-form/appointment-form')
          .then(m => m.AppointmentFormComponent),
      },
      {
        path: 'appointments/book',
        canActivate: [roleGuard],
        data: { roles: ['PACIENTE'], mode: 'patient'  },
        loadComponent: () => import('./features/appointments/appointment-form/appointment-form')
          .then(m => m.AppointmentFormComponent),
      },

      // Pacientes — Admin, Agendador
      {
        path: 'patients',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'AGENDADOR'] },
        loadComponent: () => import('./features/patients/patient-list/patient-list')
          .then(m => m.PatientListComponent),
      },
      {
        path: 'patients/new',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'AGENDADOR']},
        loadComponent: () => import('./features/patients/patient-form/patient-form')
          .then(m => m.PatientFormComponent),
      },
      {
        path: 'patients/:id/edit',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN', 'AGENDADOR']},
        loadComponent: () => import('./features/patients/patient-form/patient-form')
          .then(m => m.PatientFormComponent),
      },

      // Profesionales — solo Admin
      {
      path: 'professionals',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () => import('./features/professionals/professional-list/professional-list')
          .then(m => m.ProfessionalListComponent),
      },
      {
        path: 'professionals/new',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () => import('./features/professionals/professional-form/professional-form')
          .then(m => m.ProfessionalFormComponent),
      },
      {
        path: 'professionals/:id/edit',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () => import('./features/professionals/professional-form/professional-form')
          .then(m => m.ProfessionalFormComponent),
      },
      {
        path: 'professionals/:id/availability',
        canActivate: [roleGuard],
        data: { roles: ['ADMIN'] },
        loadComponent: () => import('./features/professionals/availability/availability')
          .then(m => m.AvailabilityComponent),
      },
    ],
  },

  // Fallback
  { path: '**', redirectTo: '' },
];