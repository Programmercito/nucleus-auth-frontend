import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
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
  successMessage = signal<string | null>(null);

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

    if (params.get('registered') === '1') {
      this.successMessage.set('Account created successfully. Please sign in.');
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

    this.authService.login(payload).subscribe({
      next: (data) => {
        let url= data.sso_url;
        if (this.redirectUrl) {
          url += `&redirect=${encodeURIComponent(this.redirectUrl)}`;
        }
        sessionStorage.setItem('redirect_url', url);
        sessionStorage.setItem('token', data.jwt);
        this.router.navigate(['/auth/redirect']);
      },
      error: (err: any) => {
        this.error.set(err.error?.message || 'Login failed');
        console.error('Login failed', err);
      }
    });
  }
}
