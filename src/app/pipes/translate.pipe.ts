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
  private subscription?: Subscription;

  transform(key: string): string {
    // Subscribe to translation changes if not already subscribed
    if (!this.subscription) {
      this.subscription = this.translationService.getTranslations().subscribe(() => {
        this.cdr.markForCheck();
      });
      
      // Also subscribe to language changes
      this.translationService.getLanguageChanges().subscribe(() => {
        this.cdr.markForCheck();
      });
    }
    
    const translation = this.translationService.getTranslation(key);
    return translation;
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
