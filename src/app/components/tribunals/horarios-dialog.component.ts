import { Component, Inject, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { DefensasHorariosService } from '../../services/defensas-horarios.service';
import { DefensaHorario, DefensaHorarioRequest } from '../../models/defensa-horario.model';
import { TranslationService } from '../../services/translation.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

export interface HorariosDialogData {
  idDefensa: number;
  studentName: string;
  title: string;
  horariosSeleccionados?: string; // Horarios ya cargados desde la tabla principal
}

@Component({
  selector: 'app-horarios-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    TranslatePipe
  ],
  templateUrl: './horarios-dialog.component.html',
  styleUrl: './horarios-dialog.component.scss'
})
export class HorariosDialogComponent implements OnInit {
  private defensasHorariosService = inject(DefensasHorariosService);
  private snackBar = inject(MatSnackBar);
  private translationService = inject(TranslationService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  horariosForm: FormGroup;
  selectedDates: Date[] = [];
  existingHorarios: DefensaHorario[] = [];
  isSubmitting = false;
  isFormValid = false;

  constructor(
    public dialogRef: MatDialogRef<HorariosDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: HorariosDialogData
  ) {
    this.horariosForm = this.fb.group({
      selectedDate: [null],
      selectedTime: [null]
    });
  }

  ngOnInit(): void {
    this.loadExistingHorarios();
    
    // Detectar cambios en el formulario y actualizar el estado de validación
    this.horariosForm.valueChanges.subscribe(value => {
      console.log('Form value changed:', value);
      // Usar setTimeout para evitar el error de change detection
      setTimeout(() => {
        this.updateFormValidation();
      }, 0);
    });
    
    // Validación inicial con setTimeout
    setTimeout(() => {
      this.updateFormValidation();
    }, 0);
  }

  loadExistingHorarios(): void {
    console.log('=== CARGANDO HORARIOS EXISTENTES ===');
    console.log('HorariosSeleccionados recibidos:', this.data.horariosSeleccionados);
    
    // Si tenemos horarios ya cargados, usarlos directamente
    if (this.data.horariosSeleccionados && this.data.horariosSeleccionados.trim() !== '') {
      console.log('Usando horarios ya cargados desde la tabla principal');
      this.parseHorariosFromString(this.data.horariosSeleccionados);
    } else {
      console.log('No hay horarios cargados, haciendo llamada a la API');
      // Fallback: llamar a la API si no tenemos horarios cargados
      this.defensasHorariosService.getHorariosByDefensa(this.data.idDefensa).subscribe({
        next: (response) => {
          if (response.success && response.dataList) {
            this.existingHorarios = response.dataList;
            this.selectedDates = response.dataList.map(h => new Date(h.fecha));
          }
        },
        error: (error) => {
          console.error('Error cargando horarios:', error);
          this.snackBar.open('Error al cargar los horarios existentes', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  private parseHorariosFromString(horariosString: string): void {
    console.log('Parseando horarios desde string:', horariosString);
    
    try {
      // Dividir por ';' y convertir cada fecha
      const horariosArray = horariosString.split(';').filter(h => h.trim() !== '');
      console.log('Horarios parseados:', horariosArray);
      
      this.selectedDates = horariosArray.map(horarioStr => {
        // Convertir string de fecha a Date
        const date = new Date(horarioStr.trim());
        console.log('Convirtiendo horario:', horarioStr, '->', date);
        return date;
      }).filter(date => !isNaN(date.getTime())); // Filtrar fechas inválidas
      
      console.log('Fechas finales cargadas:', this.selectedDates);
      
      if (this.selectedDates.length > 0) {
        this.snackBar.open(`${this.selectedDates.length} horarios cargados`, 'Cerrar', { duration: 2000 });
      }
    } catch (error) {
      console.error('Error parseando horarios:', error);
      this.snackBar.open('Error al cargar los horarios', 'Cerrar', { duration: 3000 });
    }
  }

  addDateTime(): void {
    if (!this.isFormValid) {
      this.snackBar.open('Por favor complete todos los campos', 'Cerrar', { duration: 2000 });
      return;
    }

    const selectedDate = this.horariosForm.get('selectedDate')?.value;
    const selectedTime = this.horariosForm.get('selectedTime')?.value;

    console.log('Selected date:', selectedDate);
    console.log('Selected time:', selectedTime);
    console.log('Form valid:', this.isFormValid);

    try {
      const dateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      dateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Verificar si ya existe
      const exists = this.selectedDates.some(d => 
        d.getTime() === dateTime.getTime()
      );

      if (!exists) {
        this.selectedDates.push(dateTime);
        this.selectedDates.sort((a, b) => a.getTime() - b.getTime());
        this.horariosForm.patchValue({ selectedDate: null, selectedTime: null });
        this.snackBar.open('Horario agregado correctamente', 'Cerrar', { duration: 2000 });
      } else {
        this.snackBar.open('Esta fecha y hora ya está seleccionada', 'Cerrar', { duration: 2000 });
      }
    } catch (error) {
      console.error('Error processing date/time:', error);
      this.snackBar.open('Error al procesar la fecha y hora', 'Cerrar', { duration: 2000 });
    }
  }

  removeDateTime(index: number): void {
    this.selectedDates.splice(index, 1);
  }

  updateFormValidation(): void {
    const selectedDate = this.horariosForm.get('selectedDate')?.value;
    const selectedTime = this.horariosForm.get('selectedTime')?.value;
    
    console.log('Updating form validation:', { selectedDate, selectedTime });
    
    const newFormValid = !!(selectedDate && selectedTime);
    
    if (this.isFormValid !== newFormValid) {
      this.isFormValid = newFormValid;
      console.log('Form is valid:', this.isFormValid);
    }
  }

  isFormReady(): boolean {
    return this.isFormValid;
  }

  formatDateTime(date: Date): string {
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  saveHorarios(): void {
    if (this.selectedDates.length === 0) {
      this.snackBar.open('Debe seleccionar al menos una fecha y hora', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isSubmitting = true;
    console.log('=== INICIANDO GUARDADO DE HORARIOS ===');
    console.log('Guardando horarios:', this.selectedDates.length, 'horarios para defensa', this.data.idDefensa);

    // Primero eliminar todos los horarios existentes (si los hay)
    console.log('PASO 1: Eliminando horarios existentes...');
    this.defensasHorariosService.deleteHorariosByDefensa(this.data.idDefensa).subscribe({
      next: (response) => {
        console.log('PASO 1 COMPLETADO: Horarios existentes eliminados:', response);
        console.log('PASO 2: Iniciando creación de nuevos horarios...');
        // Luego crear los nuevos horarios
        this.createNewHorarios();
      },
      error: (error) => {
        console.error('PASO 1 ERROR: Error eliminando horarios existentes:', error);
        // Si no hay horarios existentes, el error es normal, continuar
        if (error.status === 404) {
          console.log('PASO 1 INFO: No había horarios existentes, continuando con la creación');
        }
        console.log('PASO 2: Iniciando creación de nuevos horarios...');
        this.createNewHorarios();
      }
    });
  }

  private createNewHorarios(): void {
    const total = this.selectedDates.length;

    if (total === 0) {
      console.log('PASO 2 COMPLETADO: No hay horarios para crear');
      this.isSubmitting = false;
      this.dialogRef.close(true);
      return;
    }

    console.log('PASO 2: Creando', total, 'nuevos horarios con INSERT');
    console.log('Fechas a crear:', this.selectedDates);

    // Crear todos los horarios de forma secuencial para evitar problemas de concurrencia
    this.createHorariosSequentially(0);
  }

  private createHorariosSequentially(index: number): void {
    if (index >= this.selectedDates.length) {
      // Todos los horarios creados
      console.log('PASO 2 COMPLETADO: Todos los horarios creados con INSERT');
      this.isSubmitting = false;
      this.snackBar.open(`${this.selectedDates.length} horarios guardados correctamente`, 'Cerrar', { duration: 3000 });
      this.dialogRef.close(true);
      return;
    }

    const dateTime = this.selectedDates[index];
    const request: DefensaHorarioRequest = {
      idDefensa: this.data.idDefensa,
      fecha: dateTime
    };

    console.log(`PASO 2.${index + 1}: Llamando a createHorario (INSERT) para horario ${index + 1}/${this.selectedDates.length}:`, dateTime);
    console.log('Request:', request);

    this.defensasHorariosService.createHorario(request).subscribe({
      next: (response) => {
        console.log(`PASO 2.${index + 1} COMPLETADO: Horario ${index + 1} creado con INSERT:`, response);
        // Crear el siguiente horario
        this.createHorariosSequentially(index + 1);
      },
      error: (error) => {
        console.error(`PASO 2.${index + 1} ERROR: Error creando horario ${index + 1} con INSERT:`, error);
        this.snackBar.open(`Error al crear horario ${index + 1}`, 'Cerrar', { duration: 2000 });
        // Continuar con el siguiente horario
        this.createHorariosSequentially(index + 1);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
