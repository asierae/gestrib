import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Language } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguage = signal<Language>(Language.ES);
  private translations = signal<any>({});
  private translationsSubject = new BehaviorSubject<any>({});
  private languageChangeSubject = new BehaviorSubject<Language>(Language.ES);

  constructor(private http: HttpClient) {
    // Load translations immediately
    this.loadTranslations(this.currentLanguage());
    
    // Also try to load after a short delay to ensure the app is ready
    setTimeout(() => {
      if (Object.keys(this.translations()).length === 0) {
        console.log('Retrying translation load...');
        this.loadTranslations(this.currentLanguage());
      }
    }, 100);
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage();
  }

  getTranslations(): Observable<any> {
    return this.translationsSubject.asObservable();
  }

  getLanguageChanges(): Observable<Language> {
    return this.languageChangeSubject.asObservable();
  }

  areTranslationsLoaded(): boolean {
    const translations = this.translations();
    return translations && Object.keys(translations).length > 0;
  }

  getTranslation(key: string): string {
    const keys = key.split('.');
    let value: any = this.translations();
    
    // If no translations loaded yet, try to load them
    if (!value || Object.keys(value).length === 0) {
      console.log('No translations loaded, attempting to load...');
      this.loadTranslations(this.currentLanguage());
      return key; // Return key temporarily
    }
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.log(`Translation not found for key: ${key} at ${k}`);
        return key; // Return key if translation not found
      }
    }
    
    return typeof value === 'string' ? value : key;
  }

  setLanguage(language: Language): void {
    console.log(`Setting language to: ${language}`);
    this.currentLanguage.set(language);
    this.languageChangeSubject.next(language);
    this.loadTranslations(language);
    
    // Force change detection by updating the signal again
    setTimeout(() => {
      this.currentLanguage.set(language);
      // Also trigger translations subject to notify all subscribers
      this.translationsSubject.next(this.translations());
    }, 0);
  }

  private loadTranslations(language: Language): void {
    console.log(`Loading translations for language: ${language}`);
    this.http.get(`/assets/i18n/${language}.json`).subscribe({
      next: (translations) => {
        console.log(`Successfully loaded translations for ${language}:`, translations);
        this.translations.set(translations);
        this.translationsSubject.next(translations);
      },
      error: (error) => {
        console.error(`Error loading translations for ${language}:`, error);
        console.error('Full error details:', error);
        
        // Try to load fallback translations
        if (language !== Language.ES) {
          console.log('Falling back to Spanish translations...');
          this.loadTranslations(Language.ES);
        } else {
          // If even Spanish fails, create a minimal fallback
          console.log('Creating fallback translations...');
          const fallbackTranslations = {
            common: {
              dashboard: "Panel de Control",
              login: "Iniciar Sesión",
              logout: "Cerrar Sesión"
            },
            navigation: {
              dashboard: "Panel de Control",
              tribunals: "Tribunales",
              cases: "Casos",
              users: "Usuarios",
              reports: "Informes",
              administration: "Administración",
              help: "Ayuda"
            }
          };
          this.translations.set(fallbackTranslations);
          this.translationsSubject.next(fallbackTranslations);
        }
      }
    });
  }
}
