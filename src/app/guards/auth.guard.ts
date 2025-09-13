import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(): boolean {
    const user = this.authService.getCurrentUser();
    
    // Check if user exists and has a positive ID
    if (user && user.id > 0) {
      return true;
    }
    
    // If no valid user, redirect to login
    this.router.navigate(['/login']);
    return false;
  }
}
