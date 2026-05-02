import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-redirect',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './redirect.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedirectComponent implements OnInit {
  private router = inject(Router);

  ngOnInit() {
    const redirectUrl = sessionStorage.getItem('redirect_url');
    const token = sessionStorage.getItem('token');

    if (!redirectUrl || redirectUrl.trim().length === 0) {
      this.router.navigate(['/']);
      return;
    }

    sessionStorage.removeItem('redirect_url');
    sessionStorage.removeItem('token');

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = redirectUrl.trim();

    const tokenInput = document.createElement('input');
    tokenInput.type = 'hidden';
    tokenInput.name = 'token';
    tokenInput.value = token ?? '';
    form.appendChild(tokenInput);

    document.body.appendChild(form);
    form.submit();
  }
}
