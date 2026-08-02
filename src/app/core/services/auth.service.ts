import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import type { AuthResponse, User, UserRole } from '../models/user';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { Gender } from '../models/patient';
import { url } from 'inspector';
import Keycloak from 'keycloak-js';

const TOKEN_KEY = 'pa_token';
const USER_KEY = 'pa_user';

export interface RegisterPatientDto {
  document: string;
  firstName: string;
  lastName: string;
  birthdate?: Date;
  phone: string;
  gender: Gender;
  email?: string;
  password: string;
  isActive: boolean;
}

export interface LoginCredentials {
  user: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly keycloak = inject(Keycloak);
  private http = inject(HttpClient);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  private initialized = false;

  private _user = signal<User | null>(this._loadUserFromStorage());

  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly userRole = computed(() => this._user()?.role ?? null);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this._user.set(this._loadUserFromStorage());
    }
  }

  async init() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.initialized) {
      return;
    }

    this.initialized = true;

    await this.keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: `${window.location.origin}/assets/silent-check-sso.html`,
    })
  }

  async login(credentials: LoginCredentials): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, credentials)
      );

      const token = response.token ?? response.access_token;

      if (!token) {
        throw new Error('El backend no devolvió token');
      }

      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      }

      this._user.set(response.user);
    } catch (error) {
      console.error('Login error:', error);
      throw new Error('Credenciales incorrectas');
    }
  }

  async register(dto: RegisterPatientDto): Promise<void> {
    await firstValueFrom(
      this.http.post<any>(`${environment.apiUrl}/auth/register`, dto)
    );
    await this.login({ user: dto.document, password: dto.password });
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  getToken() {
    return this.keycloak.token;
  }

  hasRole(...roles: UserRole[]): boolean {
    const role = this.userRole();
    return role !== null && roles.includes(role);
  }

  hasRoleKc(...roles: UserRole[]): boolean {
    const role = this.userRole();
    return role !== null && roles.includes(role);
  }

  isAuthenticated() {
    return this.keycloak.authenticated;
  }

  private _loadUserFromStorage(): User | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}
