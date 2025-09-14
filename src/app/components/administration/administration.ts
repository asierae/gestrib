import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-administration',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTabsModule, MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule, TranslatePipe],
  templateUrl: './administration.html',
  styleUrl: './administration.scss'
})
export class AdministrationComponent {
  currentYear = new Date().getFullYear();
  nextYear = this.currentYear + 1;

  alumnosFile?: File;
  profesoresFile?: File;

  isSyncingAlumnos = signal(false);
  isSyncingProfesores = signal(false);
  isDragOverAlumnos = signal(false);
  isDragOverProfesores = signal(false);

  constructor(private snackBar: MatSnackBar) {}

  onAlumnosFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.setFile(input.files[0], 'alumnos');
    }
  }

  onProfesoresFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.setFile(input.files[0], 'profesores');
    }
  }

  onDragOver(type: 'alumnos' | 'profesores', event: DragEvent): void {
    event.preventDefault();
    if (type === 'alumnos') this.isDragOverAlumnos.set(true);
    else this.isDragOverProfesores.set(true);
  }

  onDragLeave(type: 'alumnos' | 'profesores', event: DragEvent): void {
    event.preventDefault();
    if (type === 'alumnos') this.isDragOverAlumnos.set(false);
    else this.isDragOverProfesores.set(false);
  }

  onDrop(type: 'alumnos' | 'profesores', event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.setFile(files[0], type);
    }
    if (type === 'alumnos') this.isDragOverAlumnos.set(false);
    else this.isDragOverProfesores.set(false);
  }

  private setFile(file: File, type: 'alumnos' | 'profesores'): void {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      this.snackBar.open('Formato no válido. Debe ser .xlsx', 'Cerrar', { duration: 2500 });
      return;
    }
    if (type === 'alumnos') this.alumnosFile = file; else this.profesoresFile = file;
  }

  openPicker(type: 'alumnos' | 'profesores', inputEl: HTMLInputElement): void {
    inputEl.click();
  }

  syncAlumnos(): void {
    if (!this.alumnosFile) {
      this.snackBar.open('Seleccione un archivo de alumnos (.xlsx)', 'Cerrar', { duration: 2500 });
      return;
    }
    this.isSyncingAlumnos.set(true);
    setTimeout(() => {
      this.isSyncingAlumnos.set(false);
      this.snackBar.open(`Alumnos sincronizados para ${this.currentYear}-${this.nextYear}`, 'Cerrar', { duration: 2500 });
    }, 1200);
  }

  syncProfesores(): void {
    if (!this.profesoresFile) {
      this.snackBar.open('Seleccione un archivo de profesores (.xlsx)', 'Cerrar', { duration: 2500 });
      return;
    }
    this.isSyncingProfesores.set(true);
    setTimeout(() => {
      this.isSyncingProfesores.set(false);
      this.snackBar.open(`Profesores sincronizados para ${this.currentYear}-${this.nextYear}`, 'Cerrar', { duration: 2500 });
    }, 1200);
  }
}
