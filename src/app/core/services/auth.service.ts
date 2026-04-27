import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface User {
  id: number;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  // Backend API URL from environment config (fallback a localhost si no está configurado)
  private readonly apiUrl = environment.apiUrl;

  // State using signals
  currentUser = signal<User | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  // CSRF cookie and credentials are handled by the CSRF interceptor.
  login(credentials: any): Observable<any> {
    this.isLoading.set(true);
    this.error.set(null);
    return new Observable(observer => {
      const sub = this.http.post(`${this.apiUrl}/login`, credentials, { withCredentials: true }).subscribe({
        next: (res: any) => {
          this.currentUser.set(res.user);
          this.isLoading.set(false);
          observer.next(res);
          observer.complete();
        },
        error: err => {
          this.isLoading.set(false);
          this.error.set(err.error?.message || 'Login failed');
          observer.error(err);
        }
      });
      return () => sub.unsubscribe();
    });
  }

  register(userData: any): Observable<any> {
    this.isLoading.set(true);
    this.error.set(null);
    return new Observable(observer => {
      const sub = this.http.post(`${this.apiUrl}/register`, userData, { withCredentials: true }).subscribe({
        next: (res: any) => {
          this.currentUser.set(res.user);
          this.isLoading.set(false);
          observer.next(res);
          observer.complete();
        },
        error: err => {
          this.isLoading.set(false);
          this.error.set(err.error?.message || 'Registration failed');
          observer.error(err);
        }
      });
      return () => sub.unsubscribe();
    });
  }

  logout(): Observable<any> {
    return new Observable(observer => {
      const sub = this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe({
        next: res => {
          this.currentUser.set(null);
          observer.next(res);
          observer.complete();
        },
        error: err => observer.error(err)
      });
      return () => sub.unsubscribe();
    });
  }

  changePassword(data: any): Observable<any> {
    this.isLoading.set(true);
    this.error.set(null);
    return new Observable(observer => {
      const sub = this.http.post(`${this.apiUrl}/change-password`, data, { withCredentials: true }).subscribe({
        next: res => {
          this.isLoading.set(false);
          observer.next(res);
          observer.complete();
        },
        error: err => {
          this.isLoading.set(false);
          this.error.set(err.error?.message || 'Failed to change password');
          observer.error(err);
        }
      });
      return () => sub.unsubscribe();
    });
  }
}
