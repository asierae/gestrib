import { Pipe, PipeTransform, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { TranslationService } from '../services/translation.service';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private translationService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);
  private translationsSubscription?: Subscription;
  private languageSubscription?: Subscription;

  constructor() {
    this.translationsSubscription = this.translationService.getTranslations().subscribe(() => {
      this.cdr.markForCheck();
    });
    this.languageSubscription = this.translationService.getLanguageChanges().subscribe(() => {
      this.cdr.markForCheck();
    });
  }

  transform(key: string): string {
    if (!key) {
      return '';
    }
    
    const translation = this.translationService.getTranslation(key);
    console.log(`TranslatePipe: ${key} -> ${translation}`);
    return translation;
  }

  ngOnDestroy(): void {
    if (this.translationsSubscription) {
      this.translationsSubscription.unsubscribe();
    }
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }
}
