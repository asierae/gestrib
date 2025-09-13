import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class LoginGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): boolean {
    const user = this.authService.getCurrentUser();
    
    // If user is already authenticated with valid ID, redirect to dashboard
    if (user && user.id > 0) {
      this.router.navigate(['/dashboard']);
      return false;
    }
    
    // Allow access to login page
    return true;
  }
}
