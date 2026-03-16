import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './register.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', Validators.required],
    site_code: [''],
  });

  isLoading = this.authService.isLoading;
  error = this.authService.error;

  onSubmit() {
    if (this.registerForm.valid) {
      if (this.registerForm.value.password !== this.registerForm.value.password_confirmation) {
         this.authService.error.set("Passwords do not match");
         return;
      }

      this.authService.getCSRFToken().subscribe({
        next: () => {
          this.authService.register(this.registerForm.getRawValue()).subscribe({
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
