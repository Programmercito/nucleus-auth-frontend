import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './change-password.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordPage {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  changePasswordForm = this.fb.nonNullable.group({
    current_password: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', Validators.required],
  });

  isLoading = this.authService.isLoading;
  error = this.authService.error;
  successMessage: string | null = null;

  onSubmit() {
    this.successMessage = null;
    this.authService.error.set(null);

    if (this.changePasswordForm.valid) {
      if (this.changePasswordForm.value.password !== this.changePasswordForm.value.password_confirmation) {
         this.authService.error.set("New passwords do not match");
         return;
      }

      this.authService.changePassword(this.changePasswordForm.getRawValue()).subscribe({
        next: () => {
          this.successMessage = "Password changed successfully!";
          this.changePasswordForm.reset();
        }
      });
    }
  }
}
