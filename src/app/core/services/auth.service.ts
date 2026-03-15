import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import type { User, UserRole, LoginCredentials } from '../models/user';

const TOKEN_KEY = 'pa_token';
const USER_KEY  = 'pa_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private _user = signal<User | null>(this._loadUserFromStorage());

  // Señales públicas de solo lectura
  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn  = computed(() => this._user() !== null);
  readonly userRole    = computed(() => this._user()?.role ?? null);

  constructor(private router: Router) {}

  /**
   * Simula el login. 
   * Cuando llegue el backend:
   * reemplazar el cuerpo con: return this.http.post<AuthResponse>(...)
   */
  login(credentials: LoginCredentials): Promise<void> {
    const found = environment.mockUsers.find(
      u => u.email === credentials.email && u.password === credentials.password
    );

    if (!found) {
      return Promise.reject(new Error('Credenciales incorrectas'));
    }

    const user: User = { id: found.id, email: found.email, role: found.role, isActive: found.isActive };
    // Token mock — el backend real enviará el JWT firmado
    const fakeToken = btoa(JSON.stringify({ sub: user.id, role: user.role, exp: Date.now() + 86400000 }));

    localStorage.setItem(TOKEN_KEY, fakeToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this._user.set(user);

    return Promise.resolve();
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  hasRole(...roles: UserRole[]): boolean {
    const role = this.userRole();
    return role !== null && roles.includes(role);
  }

  private _loadUserFromStorage(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}