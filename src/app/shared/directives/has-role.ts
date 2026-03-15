import { Directive, Input, TemplateRef, ViewContainerRef, inject, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import type { UserRole } from '../../core/models/user';

/**
 * Uso en template:
 * <button *hasRole="['ADMIN', 'AGENDADOR']">Nuevo paciente</button>
 *
 * Si el usuario no tiene el rol, el elemento no se renderiza en el DOM.
 */
@Directive({
  selector:   '[hasRole]',
  standalone: true,
})
export class HasRoleDirective implements OnInit {
  @Input('hasRole') roles: UserRole[] = [];

  private auth    = inject(AuthService);
  private tmpl    = inject(TemplateRef);
  private viewRef = inject(ViewContainerRef);

  ngOnInit(): void {
    if (this.auth.hasRole(...this.roles)) {
      this.viewRef.createEmbeddedView(this.tmpl);
    } else {
      this.viewRef.clear();
    }
  }
}