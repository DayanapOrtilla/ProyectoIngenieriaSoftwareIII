import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding }    from '@angular/router';
import { provideHttpClient, withInterceptors }         from '@angular/common/http';
import { provideAnimationsAsync }                      from '@angular/platform-browser/animations/async';
import { routes }           from './app.routes';
import { jwtInterceptor }   from './core/interceptors/jwt-interceptor';
import { errorInterceptor } from './core/interceptors/error-interceptor';

// Interfaces
import { ProfessionalRepository } from './core/repositories/professionals/professional.repository';
import { PatientRepository }      from './core/repositories/patients/patient.repository';
import { AppointmentRepository }  from './core/repositories/appointments/appointment.repository';

// Implementaciones mock (Se cambia en producción)
import { MockProfessionalRepository } from './core/repositories/professionals/mock-professional.repository';
import { MockPatientRepository }      from './core/repositories/patients/mock-patient.repository';
import { MockAppointmentRepository }  from './core/repositories/appointments/mock-appointment.repository';


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([jwtInterceptor, errorInterceptor])
    ),
    provideAnimationsAsync(),

    // ── Repositorios ─────────────────────────────────────────
    // Para conectar el backend real: reemplaza Mock por Http
    { provide: ProfessionalRepository, useClass: MockProfessionalRepository },
    { provide: PatientRepository,      useClass: MockPatientRepository      },
    { provide: AppointmentRepository,  useClass: MockAppointmentRepository  },
  ],
};

