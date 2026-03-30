import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { catchError, of, switchMap } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './login.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  redirectUrl: string | null = null;
  siteCode: string | null = null;
  loginAllowed = false;

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  isLoading = this.authService.isLoading;
  error = this.authService.error;

  ngOnInit() {
    const params = this.route.snapshot.queryParamMap;
    const querySiteCode = params.get('site_code') || params.get('site');
    const storedSiteCode = window.sessionStorage.getItem('site_code');
    const queryRedirect = params.get('redirect_url') || params.get('redirectUrl') || params.get('redirect') || params.get('url');
    const storedRedirect = window.sessionStorage.getItem('redirect_url');

    this.siteCode = querySiteCode || storedSiteCode;
    this.redirectUrl = (queryRedirect && queryRedirect.trim().length > 0) ? queryRedirect.trim() : storedRedirect;

    if (this.siteCode) {
      this.loginAllowed = true;
      this.error.set(null);
      window.sessionStorage.setItem('site_code', this.siteCode);
      if (this.redirectUrl) {
        window.sessionStorage.setItem('redirect_url', this.redirectUrl);
      }
    } else {
      this.loginAllowed = false;
      this.error.set('Site code is required in query parameter ?site_code=<value>');
    }
  }

  onSubmit() {
    if (!this.loginForm.valid || !this.siteCode) {
      this.error.set('Please complete all required fields and provide a valid site_code in the query string.');
      return;
    }

    const payload = {
      ...this.loginForm.getRawValue(),
      site_code: this.siteCode,
    };

    this.authService.getCSRFToken().pipe(
      catchError((err: any) => {
        const errorMessage = err?.status === 0
          ? 'Cannot connect to backend. Make sure API server is running at http://localhost:8000'
          : 'Failed to get CSRF token';
        this.error.set(errorMessage);
        console.error(errorMessage, err);
        return of(null);
      }),
      switchMap(() => this.authService.login(payload).pipe(
        catchError((err: any) => {
          this.error.set(err.error?.message || 'Login failed');
          console.error('Login failed', err);
          return of(null);
        })
      ))
    ).subscribe(result => {
      if (!result) return;
      if (this.redirectUrl) {
        const incoming = this.redirectUrl.trim();
        if (incoming.startsWith('http://') || incoming.startsWith('https://')) {
          window.location.href = incoming;
        } else {
          this.router.navigateByUrl(incoming);
        }
      } else {
        this.router.navigate(['/']);
      }
    });
  }
}
