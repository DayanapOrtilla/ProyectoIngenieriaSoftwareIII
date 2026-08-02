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
import { AuthService } from './auth.service';

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
export class UsersService {
  private http = inject(HttpClient);
  private authSvc = inject(AuthService);
  constructor() {
  }

  async register(dto: RegisterPatientDto): Promise<void> {
    await firstValueFrom(
      this.http.post<any>(`${environment.apiUrl}/auth/register`, dto)
    );
    await this.authSvc.login({ user: dto.document, password: dto.password });
  }

  async updateProfile() {

  }

  async changePassword(){

  }

  async forgotPassword() {

  }

}
