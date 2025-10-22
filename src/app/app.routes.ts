import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout';
import { AuthGuard } from './guards/auth.guard';
import { LoginGuard } from './guards/login.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(m => m.LoginComponent),
    canActivate: [LoginGuard]
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      {
        path: 'tribunals',
        loadComponent: () => import('./components/tribunals/tribunals').then(m => m.TribunalsComponent)
      },
      {
        path: 'scheduler',
        loadComponent: () => import('./components/scheduler/scheduler').then(m => m.SchedulerComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./components/users/users').then(m => m.UsersComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./components/reports/reports').then(m => m.ReportsComponent)
      },
      {
        path: 'administration',
        loadComponent: () => import('./components/administration/administration').then(m => m.AdministrationComponent)
      },
      {
        path: 'help',
        loadComponent: () => import('./components/help/help').then(m => m.HelpComponent)
      },
      {
        path: 'defensas',
        loadComponent: () => import('./components/defensas/defensas').then(m => m.DefensasComponent)
      },
      {
        path: 'defensa-horarios/:id',
        loadComponent: () => import('./components/defensa-horarios/defensa-horarios').then(m => m.DefensaHorariosComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./components/user-profile/user-profile').then(m => m.UserProfileComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
