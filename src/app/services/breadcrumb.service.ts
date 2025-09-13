import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { TranslationService } from './translation.service';
import { Subscription } from 'rxjs';

export interface BreadcrumbItem {
  label: string;
  route: string;
  translateKey: string;
}

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService implements OnDestroy {
  private breadcrumbs = signal<BreadcrumbItem[]>([]);
  private translationService = inject(TranslationService);
  private translationSubscription?: Subscription;
  private currentUrl = '';

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentUrl = event.url;
        this.updateBreadcrumbs(event.url);
      });

    // Subscribe to translation changes
    this.translationSubscription = this.translationService.getTranslations().subscribe(() => {
      if (this.currentUrl) {
        this.updateBreadcrumbs(this.currentUrl);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.translationSubscription) {
      this.translationSubscription.unsubscribe();
    }
  }

  getBreadcrumbs() {
    return this.breadcrumbs.asReadonly();
  }

  private updateBreadcrumbs(url: string): void {
    // Check if translations are loaded
    if (!this.translationService.areTranslationsLoaded()) {
      console.log('Translations not loaded yet, retrying in 100ms...');
      setTimeout(() => this.updateBreadcrumbs(url), 100);
      return;
    }

    const breadcrumbItems: BreadcrumbItem[] = [];
    
    // Always start with home
    const homeKey = 'breadcrumbs.home';
    const homeTranslation = this.translationService.getTranslation(homeKey);
    breadcrumbItems.push({
      label: homeTranslation !== homeKey ? homeTranslation : 'Inicio',
      route: '/',
      translateKey: homeKey
    });

    // Parse URL and create breadcrumbs
    const urlSegments = url.split('/').filter(segment => segment);
    
    if (urlSegments.length === 0) {
      // Root path - just show home
      this.breadcrumbs.set(breadcrumbItems);
      return;
    }

    // Map URL segments to breadcrumb items
    urlSegments.forEach((segment, index) => {
      const route = '/' + urlSegments.slice(0, index + 1).join('/');
      const translateKey = this.getTranslateKeyForSegment(segment);
      const translatedLabel = this.translationService.getTranslation(translateKey);
      
      breadcrumbItems.push({
        label: translatedLabel !== translateKey ? translatedLabel : this.getLabelForSegment(segment),
        route: route,
        translateKey: translateKey
      });
    });

    this.breadcrumbs.set(breadcrumbItems);
  }

  private getTranslateKeyForSegment(segment: string): string {
    const segmentMap: { [key: string]: string } = {
      'dashboard': 'breadcrumbs.dashboard',
      'tribunals': 'breadcrumbs.tribunals',
      'cases': 'breadcrumbs.cases',
      'users': 'breadcrumbs.users',
      'reports': 'breadcrumbs.reports',
      'administration': 'breadcrumbs.administration',
      'help': 'breadcrumbs.help',
      'defensas': 'breadcrumbs.defensas',
      'login': 'breadcrumbs.login',
      'profile': 'breadcrumbs.profile',
      'settings': 'breadcrumbs.settings'
    };

    return segmentMap[segment] || `breadcrumbs.${segment}`;
  }

  private getLabelForSegment(segment: string): string {
    const labelMap: { [key: string]: string } = {
      'dashboard': 'Panel de Control',
      'tribunals': 'Tribunales',
      'cases': 'Casos',
      'users': 'Usuarios',
      'reports': 'Informes',
      'administration': 'Administración',
      'help': 'Ayuda',
      'defensas': 'Defensas',
      'login': 'Iniciar Sesión',
      'profile': 'Perfil',
      'settings': 'Configuración'
    };

    return labelMap[segment] || segment;
  }

  setBreadcrumbs(breadcrumbs: BreadcrumbItem[]): void {
    this.breadcrumbs.set(breadcrumbs);
  }

  addBreadcrumb(breadcrumb: BreadcrumbItem): void {
    const currentBreadcrumbs = this.breadcrumbs();
    this.breadcrumbs.set([...currentBreadcrumbs, breadcrumb]);
  }

  clearBreadcrumbs(): void {
    this.breadcrumbs.set([]);
  }

  updateTranslations(): void {
    // Re-update breadcrumbs with new translations
    const currentUrl = this.router.url;
    this.updateBreadcrumbs(currentUrl);
  }
}
