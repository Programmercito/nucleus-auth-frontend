import { Routes } from '@angular/router';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage)
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'change-password',
    loadComponent: () => import('./change-password/change-password.page').then(m => m.ChangePasswordPage)
  },
  {
    path: 'redirect',
    loadComponent: () => import('./redirect/redirect.component').then(m => m.RedirectComponent)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
