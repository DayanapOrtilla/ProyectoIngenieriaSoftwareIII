import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding }    from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors }         from '@angular/common/http';
import { provideAnimationsAsync }                      from '@angular/platform-browser/animations/async';
import { routes }           from './app.routes';
import { jwtInterceptor }   from './core/interceptors/jwt-interceptor';
import { errorInterceptor } from './core/interceptors/error-interceptor';

// Interfaces
import { ProfessionalRepository } from './core/repositories/professionals/professional.repository';
import { PatientRepository }      from './core/repositories/patients/patient.repository';
import { AppointmentRepository }  from './core/repositories/appointments/appointment.repository';
import { AvailabilityRepository } from './core/repositories/availability/availability.repository';

// Implementaciones mock (Se cambia en producción)
import { MockProfessionalRepository } from './core/repositories/professionals/mock-professional.repository';
import { MockPatientRepository }      from './core/repositories/patients/mock-patient.repository';
import { MockAppointmentRepository }  from './core/repositories/appointments/mock-appointment.repository';
import { MockAvailabilityRepository } from './core/repositories/availability/mock-availability.repository';
import { HttpProfessionalRepository } from './core/repositories/professionals/http-professional.repository';
import { HttpPatientRepository } from './core/repositories/patients/http-patient.repository';
import { HttpAppointmentRepository } from './core/repositories/appointments/http-appointment.repository';
import { HttpAvailabilityRepository } from './core/repositories/availability/http-availability.repository';


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withFetch(),
      withInterceptors([jwtInterceptor, errorInterceptor])
    ),
    provideAnimationsAsync(),

    // ── Repositorios ─────────────────────────────────────────
    // Para conectar el backend real: reemplaza Mock por Http
    { provide: ProfessionalRepository, useClass: HttpProfessionalRepository },
    { provide: PatientRepository,      useClass: HttpPatientRepository      },
    { provide: AppointmentRepository,  useClass: HttpAppointmentRepository  },
    { provide: AvailabilityRepository, useClass: HttpAvailabilityRepository},
  ],
};

