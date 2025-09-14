import { Component, OnInit, inject } from '@angular/core';
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
export class SchedulerComponent implements OnInit {
  private snackBar = inject(MatSnackBar);
  private route = inject(ActivatedRoute);
  
  selectedDays: Set<string> = new Set();
  currentMonth: Date = new Date();
  defenseData: any = null;
  monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  
  ngOnInit(): void {
    this.generateCalendar();
    
    // Obtener datos de la defensa desde localStorage
    const defenseDataStr = localStorage.getItem('currentDefense');
    if (defenseDataStr) {
      try {
        this.defenseData = JSON.parse(defenseDataStr);
        // Limpiar localStorage después de obtener los datos
        localStorage.removeItem('currentDefense');
      } catch (e) {
        console.error('Error parsing defense data:', e);
      }
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
    return date.toISOString().split('T')[0];
  }
  
  isCurrentMonth(date: Date): boolean {
    return date.getMonth() === this.currentMonth.getMonth() && 
           date.getFullYear() === this.currentMonth.getFullYear();
  }
  
  isSelected(date: Date): boolean {
    return this.selectedDays.has(this.getDayKey(date));
  }
  
  toggleDay(date: Date): void {
    if (!this.isCurrentMonth(date)) return;
    
    const dayKey = this.getDayKey(date);
    if (this.selectedDays.has(dayKey)) {
      this.selectedDays.delete(dayKey);
    } else {
      this.selectedDays.add(dayKey);
    }
  }
  
  previousMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1);
  }
  
  nextMonth(): void {
    this.currentMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() + 1);
  }
  
  sendAvailability(): void {
    const selectedDates = Array.from(this.selectedDays).sort();
    console.log('Días seleccionados para reunión:', selectedDates);
    
    this.snackBar.open(
      `Disponibilidad enviada: ${selectedDates.length} días seleccionados`, 
      'Cerrar', 
      { duration: 3000 }
    );
  }
  
  getSelectedDaysCount(): number {
    return this.selectedDays.size;
  }
  
  getSelectedDaysArray(): string[] {
    return Array.from(this.selectedDays).sort();
  }
  
  formatSelectedDay(dayKey: string): string {
    const date = new Date(dayKey);
    const day = date.getDate();
    const month = this.monthNames[date.getMonth()];
    const year = date.getFullYear();
    const weekDay = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][date.getDay()];
    return `${weekDay}, ${day} de ${month} ${year}`;
  }
  
  removeSelectedDay(dayKey: string): void {
    this.selectedDays.delete(dayKey);
  }
}
