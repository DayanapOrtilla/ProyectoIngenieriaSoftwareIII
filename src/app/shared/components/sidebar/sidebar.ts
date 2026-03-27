import { Component, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive }  from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UiService } from '../../../core/services/ui.service';
import type { UserRole } from '../../../core/models/user';

interface NavItem {
  path:  string;
  label: string;
  icon:  string;
  roles: UserRole[];  // roles que pueden ver este ítem
}

const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard',                  label: 'Inicio',         icon: 'bi-speedometer2',  roles: ['ADMINISTRADOR', 'AGENDADOR', 'MEDICO', 'TERAPISTA', 'PACIENTE'] },
  { path: '/appointments',                 label: 'Citas',           icon: 'bi-calendar-check',  roles: ['ADMINISTRADOR', 'AGENDADOR', 'MEDICO', 'TERAPISTA'] },
  { path: '/appointments/book',             label: 'Agendar cita',   icon: 'bi-calendar-plus',   roles: ['PACIENTE'] },
  { path: '/patients',                      label: 'Pacientes',       icon: 'bi-people',          roles: ['ADMINISTRADOR', 'AGENDADOR'] },
  { path: '/professionals',                 label: 'Profesionales',   icon: 'bi-person-badge',    roles: ['ADMINISTRADOR'] },
  { path: '/professionals/availability',    label: 'Disponibilidad',  icon: 'bi-clock',           roles: ['ADMINISTRADOR'] },
];

@Component({
  selector:    'app-sidebar',
  standalone:  true,
  imports:     [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class SidebarComponent {
  private auth = inject(AuthService);
  protected ui = inject(UiService);

  // Computed: filtra ítems según el rol actual
  protected navItems = computed(() => {
    const role = this.auth.userRole();
    if (!role) return [];
    return NAV_ITEMS.filter(item => item.roles.includes(role));
  });

  protected get sidebarClasses(): string {
    // En móvil: overlay fijo, visible solo si sidebarOpen es true
    // En desktop: estático, siempre visible
    return this.ui.sidebarOpen()
      ? 'position-fixed top-0 start-0 h-100 d-flex'   // móvil abierto
      : 'd-none d-lg-flex position-relative h-100';     // móvil cerrado / desktop siempre
  }
}
