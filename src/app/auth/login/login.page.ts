import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './login.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    site_code: ['', Validators.required],
  });

  isLoading = this.authService.isLoading;
  error = this.authService.error;

  onSubmit() {
    if (this.loginForm.valid) {
      this.authService.getCSRFToken().subscribe({
        next: () => {
          this.authService.login(this.loginForm.getRawValue()).subscribe({
            next: () => {
              this.router.navigate(['/']); 
            }
          });
        },
        error: (err: unknown) => {
          console.error('Failed to get CSRF token', err);
        }
      });
    }
  }
}
