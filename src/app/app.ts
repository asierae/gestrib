import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Language } from './models/user.model';
import { TranslationService } from './services/translation.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('gestrib');
  private translationService = inject(TranslationService);
  
  ngOnInit(): void {
    // Inicializar el servicio de traducción
    this.translationService.setLanguage(Language.ES);
  }
}
