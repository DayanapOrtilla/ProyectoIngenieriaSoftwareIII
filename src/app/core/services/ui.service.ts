import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UiService {

  // Estado del sidebar — true = abierto, false = cerrado
  // Usamos signal aquí porque UiService es compartido entre
  // header y sidebar, y ambos necesitan reaccionar al cambio
  // sin que uno llame directamente al otro
  sidebarOpen = signal(false);

  toggleSidebar(): void {
    this.sidebarOpen.update(open => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }
}