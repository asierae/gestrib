import { Component, Input, inject, signal, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { TranslationService } from '../../services/translation.service';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-user-menu-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span>{{ translation() }}</span>
  `
})
export class UserMenuItemComponent implements OnInit, OnDestroy {
  @Input() translateKey: string = '';

  private translationService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);
  private subscriptions = new Subscription();
  translation = signal('');

  ngOnInit(): void {
    this.updateTranslation();
    
    // Subscribe to translation changes
    this.subscriptions.add(
      this.translationService.getTranslations().subscribe(() => {
        this.updateTranslation();
        this.cdr.markForCheck();
      })
    );
    
    // Also subscribe to language changes
    this.subscriptions.add(
      this.translationService.getLanguageChanges().subscribe(() => {
        this.updateTranslation();
        this.cdr.markForCheck();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private updateTranslation(): void {
    if (this.translateKey) {
      const translated = this.translationService.getTranslation(this.translateKey);
      this.translation.set(translated);
    }
  }
}
