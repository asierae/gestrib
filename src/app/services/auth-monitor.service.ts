import { Injectable, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { interval, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthMonitorService implements OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private subscription?: Subscription;

  constructor() {
    // Check authentication status every 30 seconds
    this.subscription = interval(30000).subscribe(() => {
      this.checkAuthStatus();
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private checkAuthStatus(): void {
    const user = this.authService.getCurrentUser();
    
    // If user doesn't exist or has invalid ID, redirect to login
    if (!user || user.id <= 0 || !user.activo) {
      this.authService.logout();
    }
  }
}
