import { Component, OnInit, OnChanges, inject, Input, Output, EventEmitter, ChangeDetectorRef, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-scheduler',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatCardModule, MatIconModule, MatSnackBarModule, TranslatePipe],
  templateUrl: './scheduler.html',
  styleUrl: './scheduler.scss'
})
export class SchedulerComponent implements OnInit, OnChanges {
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  
  @Input() defenseData: any = null;
  @Input() availableSchedules: any[] = [];
  @Input() professorSelections: any[] = [];
  @Output() availabilitySubmitted = new EventEmitter<string>();
  
  selectedSchedule: any = null;
  currentMonth: Date = new Date();
  monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  
  ngOnInit(): void {
    this.configureCalendarMonth();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['availableSchedules'] && this.availableSchedules && this.availableSchedules.length > 0) {
      this.configureCalendarMonth();
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 0);
    }
    
    if (changes['professorSelections']) {
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 0);
    }
    
    if (changes['defenseData']) {
      setTimeout(() => {
        this.cdr.detectChanges();
      }, 0);
    }
  }

  configureCalendarMonth(): void {
    if (this.availableSchedules && this.availableSchedules.length > 0) {
      // Configurar el mes basado en la primera fecha disponible
      const firstSchedule = this.availableSchedules[0];
      const firstDate = new Date(firstSchedule.fecha);
      this.currentMonth = new Date(firstDate.getFullYear(), firstDate.getMonth());
    }
  }
  
  generateCalendar(): Date[] {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert Sunday=0 to Monday=0
    
    const calendar: Date[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendar.push(new Date(year, month, -startingDayOfWeek + i + 1));
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendar.push(new Date(year, month, day));
    }
    
    return calendar;
  }
  
  getDayKey(date: Date): string {
    // Normalizar la fecha a medianoche en hora local para evitar problemas de zona horaria
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const year = normalizedDate.getFullYear();
    const month = String(normalizedDate.getMonth() + 1).padStart(2, '0');
    const day = String(normalizedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentMonth.getMonth() && 
           date.getFullYear() === this.currentMonth.getFullYear();
  }
  
  isSelected(date: Date): boolean {
    if (!this.selectedSchedule) return false;
    return this.getDayKey(date) === this.getDayKey(new Date(this.selectedSchedule.fecha));
  }
  
  isAvailable(date: Date): boolean {
    if (!this.availableSchedules || this.availableSchedules.length === 0) {
      return false;
    }
    
    if (!this.isCurrentMonth(date)) {
      return false;
    }
    
    const dayKey = this.getDayKey(date);
    
    return this.availableSchedules.some(schedule => {
      if (!schedule || !schedule.fecha) {
        return false;
      }
      const scheduleDate = new Date(schedule.fecha);
      const scheduleDayKey = this.getDayKey(scheduleDate);
      return scheduleDayKey === dayKey;
    });
  }
  
  toggleDay(date: Date): void {
    if (!this.isCurrentMonth(date) || !this.isAvailable(date)) return;
    
    const dayKey = this.getDayKey(date);
    const schedule = this.availableSchedules.find(s => 
      this.getDayKey(new Date(s.fecha)) === dayKey
    );
    
    if (schedule) {
      this.selectedSchedule = schedule;
    }
  }
  
  previousMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1);
    this.cdr.detectChanges();
  }
  
  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1);
    this.cdr.detectChanges();
  }
  
  sendAvailability(): void {
    if (!this.selectedSchedule) {
      this.snackBar.open('Debe seleccionar un horario', 'Cerrar', { duration: 2000 });
      return;
    }
    
    // Emitir el evento con el horario seleccionado
    this.availabilitySubmitted.emit(this.selectedSchedule.fecha);
    
    this.snackBar.open(
      `Votación enviada: ${this.formatScheduleDate(this.selectedSchedule)}`, 
      'Cerrar', 
      { duration: 3000 }
    );
  }
  
  selectSchedule(schedule: any): void {
    this.selectedSchedule = schedule;
  }

  formatScheduleDate(schedule: any): string {
    const date = new Date(schedule.fecha);
    const day = date.getDate();
    const month = this.monthNames[date.getMonth()];
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const weekDay = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()];
    return `${weekDay}, ${day} de ${month} ${year} a las ${time}`;
  }

  getProfessorSelectionForSchedule(schedule: any): any[] {
    return this.professorSelections.filter(selection => 
      this.getDayKey(new Date(selection.fechaHora)) === this.getDayKey(new Date(schedule.fecha))
    );
  }
}
