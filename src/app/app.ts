import { Component, inject, OnInit, signal, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Language } from './models/user.model';
import { TranslationService } from './services/translation.service';
import { AuthService } from './services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('gestrib');
  private translationService = inject(TranslationService);
  private authService = inject(AuthService);
  private userLoadedSubscription?: Subscription;
  
  ngOnInit(): void {
    // Suscribirse a cuando el usuario esté completamente cargado
    this.userLoadedSubscription = this.authService.userLoaded$.subscribe(userLoaded => {
      if (userLoaded) {
        console.log('App: Usuario cargado, configurando idioma...');
        this.initializeLanguage();
      } else {
        console.log('App: No hay usuario, usando idioma por defecto...');
        this.translationService.setLanguage(Language.ES);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.userLoadedSubscription) {
      this.userLoadedSubscription.unsubscribe();
    }
  }

  private initializeLanguage(): void {
    // Obtener el usuario actual
    const currentUser = this.authService.currentUser();
    
    if (currentUser && currentUser.idIdioma) {
      // Si hay usuario autenticado, usar su idioma preferido
      const language = this.idIdiomaToLanguage(currentUser.idIdioma);
      console.log(`App: Configurando idioma del usuario: ${currentUser.idIdioma} -> ${language}`);
      this.translationService.setLanguage(language);
    } else {
      // Si no hay usuario, usar idioma por defecto
      console.log('App: No hay usuario autenticado, usando idioma por defecto: ES');
      this.translationService.setLanguage(Language.ES);
    }
  }

  /**
   * Convierte idIdioma numérico a Language enum
   */
  private idIdiomaToLanguage(idIdioma: number): Language {
    switch (idIdioma) {
      case 1: return Language.ES;
      case 2: return Language.EN;
      case 3: return Language.EU;
      default: return Language.ES;
    }
  }
}
