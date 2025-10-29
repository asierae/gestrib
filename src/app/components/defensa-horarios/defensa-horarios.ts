import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslationService } from '../../services/translation.service';
import { DefensasService } from '../../services/defensas.service';
import { DefensasHorariosService } from '../../services/defensas-horarios.service';
import { DefensasHorariosSeleccionadosService } from '../../services/defensas-horarios-seleccionados.service';
import { AuthService } from '../../services/auth.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { SchedulerComponent } from '../scheduler/scheduler';

@Component({
  selector: 'app-defensa-horarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    SchedulerComponent,
    TranslatePipe
  ],
  templateUrl: './defensa-horarios.html',
  styleUrls: ['./defensa-horarios.scss']
})
export class DefensaHorariosComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translationService = inject(TranslationService);
  private defensasService = inject(DefensasService);
  private defensasHorariosService = inject(DefensasHorariosService);
  private defensasHorariosSeleccionadosService = inject(DefensasHorariosSeleccionadosService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private snackBar = inject(MatSnackBar);

  defensaId: number = 0;
  defensa: any = null;
  horariosDisponibles: any[] = [];
  seleccionesProfesores: any[] = [];
  loading = true;

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.defensaId = +params['id'];
      if (this.defensaId) {
        this.loadDefensaData();
      }
    });
  }

  loadDefensaData(): void {
    this.loading = true;
    this.cdr.detectChanges();
    
    console.log(`DefensaHorariosComponent: Cargando defensa con ID: ${this.defensaId}`);
    
    // Cargar datos de la defensa
    this.defensasService.getDefensaById(this.defensaId).subscribe({
      next: (defensa) => {
        console.log('DefensaHorariosComponent: Defensa cargada exitosamente:', defensa);
        this.defensa = defensa;
        setTimeout(() => {
          this.cdr.detectChanges();
          this.loadHorariosDisponibles();
        }, 0);
      },
      error: (error) => {
        console.error('DefensaHorariosComponent: Error cargando defensa:', error);
        
        // Mostrar advertencia pero continuar con la carga de horarios
        if (error.status === 400) {
          this.snackBar.open('Advertencia: No se pudieron cargar los datos completos de la defensa, pero se cargarán los horarios disponibles', 'Cerrar', { duration: 5000 });
        } else if (error.status === 404) {
          this.snackBar.open('Defensa no encontrada', 'Cerrar', { duration: 3000 });
          this.loading = false;
          this.cdr.detectChanges();
          return;
        } else if (error.status === 401) {
          this.snackBar.open('Sesión expirada. Por favor, inicie sesión nuevamente', 'Cerrar', { duration: 3000 });
          this.loading = false;
          this.cdr.detectChanges();
          return;
        }
        
        // Continuar con la carga de horarios incluso si falla la carga de datos de la defensa
        this.loadHorariosDisponibles();
      }
    });
  }

  loadHorariosDisponibles(): void {
    // Cargar horarios disponibles para esta defensa
    this.defensasHorariosService.getHorariosByDefensa(this.defensaId).subscribe({
      next: (response) => {
        this.horariosDisponibles = response.dataList || [];
        // Forzar detección de cambios después de un breve delay para asegurar que Angular procese los cambios
        setTimeout(() => {
          this.cdr.detectChanges();
          this.loadSeleccionesProfesores();
        }, 0);
      },
      error: (error) => {
        console.error('Error cargando horarios:', error);
        this.snackBar.open('Error al cargar los horarios disponibles', 'Cerrar', { duration: 3000 });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }


  loadSeleccionesProfesores(): void {
    // Cargar selecciones de profesores
    this.defensasHorariosSeleccionadosService.getSeleccionesByDefensaId(this.defensaId).subscribe({
      next: (selecciones) => {
        this.seleccionesProfesores = selecciones;
        this.loading = false;
        // Forzar detección de cambios después de un breve delay
        setTimeout(() => {
          this.cdr.detectChanges();
        }, 0);
      },
      error: (error) => {
        console.error('Error cargando selecciones:', error);
        this.snackBar.open('Error al cargar las selecciones de profesores', 'Cerrar', { duration: 3000 });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Maneja la disponibilidad enviada desde el scheduler
   */
  onAvailabilitySubmitted(selectedDate: string): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.snackBar.open('Debe estar autenticado para enviar disponibilidad', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('DefensaHorariosComponent: Fecha seleccionada:', selectedDate);

    // Verificar si ya tiene una selección
    const seleccionExistente = this.seleccionesProfesores.find(s => 
      s.idUsuario === currentUser.id
    );

    if (seleccionExistente) {
      // Actualizar selección existente
      this.updateSeleccion(seleccionExistente.id, selectedDate);
    } else {
      // Crear nueva selección
      this.createSeleccion(selectedDate);
    }
  }

  createSeleccion(fechaHora: string): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser) {
      this.snackBar.open('Debe estar autenticado para enviar la votación', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('DefensaHorariosComponent: Creando selección con datos:', {
      idDefensa: this.defensaId,
      idUsuario: currentUser.id,
      fechaHora: fechaHora
    });

    this.defensasHorariosSeleccionadosService.createSeleccion({
      idDefensa: this.defensaId,
      idUsuario: currentUser.id,
      fechaHora: fechaHora
    }).subscribe({
      next: (response) => {
        console.log('DefensaHorariosComponent: Selección creada exitosamente:', response);
        this.snackBar.open('Votación enviada correctamente', 'Cerrar', { duration: 2000 });
        this.loadSeleccionesProfesores();
      },
      error: (error) => {
        console.error('DefensaHorariosComponent: Error creando selección:', error);
        
        let errorMessage = 'Error al enviar la votación';
        
        if (error.status === 500) {
          errorMessage = 'Error del servidor: Contacte al administrador';
        } else if (error.status === 400) {
          errorMessage = 'Datos incorrectos: Verifique la información enviada';
        } else if (error.status === 401) {
          errorMessage = 'Sesión expirada: Por favor, inicie sesión nuevamente';
        }
        
        this.snackBar.open(errorMessage, 'Cerrar', { duration: 5000 });
      }
    });
  }

  updateSeleccion(seleccionId: number, fechaHora: string): void {
    this.defensasHorariosSeleccionadosService.updateSeleccion(seleccionId, {
      fechaHora: fechaHora
    }).subscribe({
      next: (response) => {
        this.snackBar.open('Disponibilidad actualizada correctamente', 'Cerrar', { duration: 2000 });
        this.loadSeleccionesProfesores();
      },
      error: (error) => {
        console.error('Error actualizando selección:', error);
        this.snackBar.open('Error al actualizar la disponibilidad', 'Cerrar', { duration: 3000 });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/tribunals']);
  }

  getCurrentUser(): any {
    return this.authService.currentUser();
  }

}
