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
import { Calendar, CalendarOptions } from '@fullcalendar/core';
import { FullCalendarModule } from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

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
    FullCalendarModule,
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
  calendar: Calendar | null = null;
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    height: 'auto',
    selectable: true,
    selectMirror: true,
    dayMaxEvents: true,
    weekends: true,
    locale: 'es',
    events: [],
    select: (selectInfo) => this.onDateSelect(selectInfo),
    eventClick: (clickInfo) => this.onEventClick(clickInfo)
  };

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
    
    // Cargar datos de la defensa
    this.defensasService.getDefensaById(this.defensaId).subscribe({
      next: (defensa) => {
        this.defensa = defensa;
        this.loadHorariosDisponibles();
      },
      error: (error) => {
        console.error('Error cargando defensa:', error);
        this.snackBar.open('Error al cargar los datos de la defensa', 'Cerrar', { duration: 3000 });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadHorariosDisponibles(): void {
    // Cargar horarios disponibles para esta defensa
    this.defensasHorariosService.getHorariosByDefensa(this.defensaId).subscribe({
      next: (response) => {
        this.horariosDisponibles = response.dataList || [];
        this.loadSeleccionesProfesores();
        this.updateCalendarEvents();
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
        this.updateCalendarEvents();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error cargando selecciones:', error);
        this.snackBar.open('Error al cargar las selecciones de profesores', 'Cerrar', { duration: 3000 });
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateCalendarEvents(): void {
    const events: any[] = [];
    
    // Agregar horarios disponibles
    this.horariosDisponibles.forEach(horario => {
      events.push({
        id: `disponible-${horario.id}`,
        title: 'Horario Disponible',
        start: horario.fecha,
        backgroundColor: '#e3f2fd',
        borderColor: '#2196f3',
        textColor: '#1976d2',
        classNames: ['horario-disponible']
      });
    });

    // Agregar selecciones de profesores
    this.seleccionesProfesores.forEach(seleccion => {
      events.push({
        id: `seleccion-${seleccion.id}`,
        title: `${seleccion.nombreProfesor} - ${seleccion.puesto}`,
        start: seleccion.fechaHora,
        backgroundColor: seleccion.idUsuario === this.authService.currentUser()?.id ? '#c8e6c9' : '#fff3e0',
        borderColor: seleccion.idUsuario === this.authService.currentUser()?.id ? '#4caf50' : '#ff9800',
        textColor: seleccion.idUsuario === this.authService.currentUser()?.id ? '#2e7d32' : '#f57c00',
        classNames: ['horario-seleccionado']
      });
    });

    this.calendarOptions.events = events;
  }

  onDateSelect(selectInfo: any): void {
    const fechaHora = selectInfo.startStr;
    
    // Verificar si es un horario disponible
    const horarioDisponible = this.horariosDisponibles.find(h => 
      h.fecha === fechaHora
    );

    if (!horarioDisponible) {
      this.snackBar.open('Este horario no está disponible para seleccionar', 'Cerrar', { duration: 2000 });
      return;
    }

    // Verificar si ya tiene una selección
    const seleccionExistente = this.seleccionesProfesores.find(s => 
      s.idUsuario === this.authService.currentUser()?.id
    );

    if (seleccionExistente) {
      // Actualizar selección existente
      this.updateSeleccion(seleccionExistente.id, fechaHora);
    } else {
      // Crear nueva selección
      this.createSeleccion(fechaHora);
    }
  }

  onEventClick(clickInfo: any): void {
    const eventId = clickInfo.event.id;
    
    if (eventId.startsWith('seleccion-')) {
      const seleccionId = eventId.replace('seleccion-', '');
      const seleccion = this.seleccionesProfesores.find(s => s.id == seleccionId);
      
      if (seleccion && seleccion.idUsuario === this.authService.currentUser()?.id) {
        // Permitir modificar solo la propia selección
        this.modifySeleccion(seleccion);
      }
    }
  }

  createSeleccion(fechaHora: string): void {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    this.defensasHorariosSeleccionadosService.createSeleccion({
      idDefensa: this.defensaId,
      idUsuario: currentUser.id,
      fechaHora: fechaHora
    }).subscribe({
      next: (response) => {
        this.snackBar.open('Horario seleccionado correctamente', 'Cerrar', { duration: 2000 });
        this.loadSeleccionesProfesores();
      },
      error: (error) => {
        console.error('Error creando selección:', error);
        this.snackBar.open('Error al seleccionar el horario', 'Cerrar', { duration: 3000 });
      }
    });
  }

  updateSeleccion(seleccionId: number, fechaHora: string): void {
    this.defensasHorariosSeleccionadosService.updateSeleccion(seleccionId, {
      fechaHora: fechaHora
    }).subscribe({
      next: (response) => {
        this.snackBar.open('Horario actualizado correctamente', 'Cerrar', { duration: 2000 });
        this.loadSeleccionesProfesores();
      },
      error: (error) => {
        console.error('Error actualizando selección:', error);
        this.snackBar.open('Error al actualizar el horario', 'Cerrar', { duration: 3000 });
      }
    });
  }

  modifySeleccion(seleccion: any): void {
    // Implementar lógica para modificar selección
    console.log('Modificar selección:', seleccion);
  }

  goBack(): void {
    this.router.navigate(['/tribunals']);
  }

  getCurrentUser(): any {
    return this.authService.currentUser();
  }
}
