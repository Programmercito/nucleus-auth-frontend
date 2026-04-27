import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  siteCode: string | null = null;
  redirectUrl: string | null = null;
  registerAllowed = false;

  registerForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', Validators.required],
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
      this.registerAllowed = true;
      this.error.set(null);
      window.sessionStorage.setItem('site_code', this.siteCode);
      if (this.redirectUrl) {
        window.sessionStorage.setItem('redirect_url', this.redirectUrl);
      }
    } else {
      this.registerAllowed = false;
      this.error.set('Site code is required in query parameter ?site_code=<value>');
    }
  }

  onSubmit() {
    if (!this.siteCode) {
      this.error.set('Site code is required in the URL or sessionStorage.');
      return;
    }

    if (!this.registerForm.valid) {
      this.error.set('Complete todos los campos válidos antes de continuar.');
      return;
    }

    if (this.registerForm.value.password !== this.registerForm.value.password_confirmation) {
      this.error.set('Passwords do not match');
      return;
    }

    const payload = {
      ...this.registerForm.getRawValue(),
      site_code: this.siteCode,
    };

    this.authService.register(payload).subscribe({
      next: () => {
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
      },
      error: (err: any) => {
        this.error.set(err.error?.message || 'Registration failed');
        console.error('Registration failed', err);
      }
    });
  }
}
