import { Injectable, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import type { User, UserRole, LoginCredentials } from '../models/user';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

const TOKEN_KEY = 'pa_token';
const USER_KEY  = 'pa_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private _user = signal<User | null>(this._loadUserFromStorage());

  // Señales públicas de solo lectura
  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn  = computed(() => this._user() !== null);
  readonly userRole    = computed(() => this._user()?.role ?? null);

  constructor() {}

  /**
   * Login. 
   * Cuando llegue el backend:
   * reemplazar el cuerpo con: return this.http.post<AuthResponse>(...)
   */
  async login(credentials: LoginCredentials): Promise<void> {
    
    console.log('API URL:', environment.apiUrl);
    console.log('URL completa:', `${environment.apiUrl}/auth/login`);
    // 1. Preparamos el cuerpo con 'user' (que es el documento/id en el backend)
    const loginData = {
      user: credentials.user,
      password: credentials.password
    };

    try {
      // 2. Llamada real al backend
      const response = await firstValueFrom(
        this.http.post<any>(`${environment.apiUrl}/auth/login`, loginData)
      );
      console.log('LOGIN RESPONSE:', response);

      // 3. Extraemos el token y el usuario que envía NestJS
      const { token, user } = response;

      // 4. Persistencia
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      
      // 5. Actualizamos la Signal
      this._user.set(user);

      return Promise.resolve();
    } catch (error: any) {
      console.error('Login Error:', error);
      return Promise.reject(new Error(error.error?.message || 'Error de conexión con el servidor'));
    }
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