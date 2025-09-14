import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { Language } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  private currentLanguage = signal<Language>(Language.ES);
  private translations = signal<any>({});
  private translationsSubject = new BehaviorSubject<any>(null);
  private languageChangeSubject = new BehaviorSubject<Language>(Language.ES);

  constructor(private http: HttpClient) {
    // Load translations after a short delay to avoid circular dependencies
    setTimeout(() => {
      this.loadTranslations(this.currentLanguage());
    }, 0);
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage();
  }

  getTranslations(): Observable<any> {
    return this.translationsSubject.asObservable().pipe(
      filter(translations => translations !== null)
    );
  }

  getLanguageChanges(): Observable<Language> {
    return this.languageChangeSubject.asObservable();
  }

  areTranslationsLoaded(): boolean {
    const translations = this.translations();
    return translations && Object.keys(translations).length > 0;
  }


  getTranslation(key: string): string {
    if (!key) {
      return '';
    }
    
    const keys = key.split('.');
    let value: any = this.translations();
    
    // If no translations loaded yet, try to load them
    if (!value || Object.keys(value).length === 0) {
      console.log(`No translations loaded for key: ${key}, attempting to load...`);
      this.loadTranslations(this.currentLanguage());
      return key; // Return key temporarily
    }
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.log(`Translation not found for key: ${key} at ${k}. Available keys:`, Object.keys(value || {}));
        return key; // Return key if translation not found
      }
    }
    
    const result = typeof value === 'string' ? value : key;
    console.log(`Translation result for ${key}: ${result}`);
    return result;
  }

  setLanguage(language: Language): void {
    console.log(`Setting language to: ${language}`);
    this.currentLanguage.set(language);
    this.languageChangeSubject.next(language);
    this.loadTranslations(language);
  }

  private loadTranslations(language: Language): void {
    console.log(`Loading translations for language: ${language}`);
    this.http.get(`/assets/i18n/${language}.json`).subscribe({
      next: (translations) => {
        console.log(`Successfully loaded translations for ${language}:`, translations);
        console.log(`defensas.title in loaded translations:`, (translations as any)?.defensas?.title);
        this.translations.set(translations);
        this.translationsSubject.next(translations);
      },
      error: (error) => {
        console.error(`Error loading translations for ${language}:`, error);
        console.error('Full error details:', error);
        console.error('URL attempted:', `/assets/i18n/${language}.json`);
        
        // Solo intentar español si no es español
        if (language !== Language.ES) {
          console.log('Falling back to Spanish translations...');
          this.loadTranslations(Language.ES);
        } else {
          console.error('Failed to load even Spanish translations. Check if files exist in assets/i18n/');
        }
      }
    });
  }
}
