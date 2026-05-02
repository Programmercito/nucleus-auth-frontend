import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  currentUser = signal<User | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  login(body: any): Observable<any> {
    return this.http.post(`/api/login`, body, { withCredentials: true });
  }

  register(body: any): Observable<any> {
    return this.http.post(`/api/register`, body, { withCredentials: true });
  }

  logout(): Observable<any> {
    return this.http.post(`/api/logout`, {}, { withCredentials: true });
  }

  changePassword(body: any): Observable<any> {
    return this.http.post(`/api/change-password`, body, { withCredentials: true });
  }

  test(body: any): Observable<any> {
    return this.http.post(`/api`, body, { withCredentials: true });
  }
}
