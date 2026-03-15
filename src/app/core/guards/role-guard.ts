import { inject }                         from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService }                    from '../services/auth.service';
import type { UserRole }                  from '../models/user';

/**
 * Uso en rutas:
 * {
 *   path: 'professionals',
 *   canActivate: [authGuard, roleGuard],
 *   data: { roles: ['ADMIN'] },
 *   ...
 * }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as UserRole[] | undefined;

  // Si la ruta no define roles, cualquier usuario autenticado puede entrar
  if (!allowedRoles || allowedRoles.length === 0) return true;

  if (auth.hasRole(...allowedRoles)) return true;

  // Rol insuficiente → redirige al dashboard sin mensaje de error expuesto
  return router.createUrlTree(['/dashboard']);
};