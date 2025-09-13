import { Component, inject } from '@angular/core';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-translation-test',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  template: `
    <div style="padding: 20px; border: 1px solid #ccc; margin: 10px;">
      <h3>Translation Test</h3>
      <p><strong>Current Language:</strong> {{ translationService.getCurrentLanguage() }}</p>
      <p><strong>Translations loaded:</strong> {{ hasTranslations() }}</p>
      <p><strong>Test translations:</strong></p>
      <ul>
        <li>navigation.dashboard: {{ 'navigation.dashboard' | translate }}</li>
        <li>navigation.tribunals: {{ 'navigation.tribunals' | translate }}</li>
        <li>common.welcome: {{ 'common.welcome' | translate }}</li>
      </ul>
      <button (click)="loadTranslations()">Reload Translations</button>
    </div>
  `
})
export class TranslationTestComponent {
  translationService = inject(TranslationService);

  hasTranslations(): boolean {
    const translations = this.translationService.getTranslations();
    return Object.keys(translations).length > 0;
  }

  loadTranslations(): void {
    this.translationService.setLanguage(this.translationService.getCurrentLanguage());
  }
}
