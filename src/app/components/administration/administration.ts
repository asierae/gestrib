import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AlumnosService, AlumnoRequest } from '../../services/alumnos.service';
import { ProfesoresService, ProfesorRequest } from '../../services/profesores.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-administration',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTabsModule, MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule, MatTableModule, MatPaginatorModule, ScrollingModule, MatFormFieldModule, MatInputModule, TranslatePipe],
  templateUrl: './administration.html',
  styleUrl: './administration.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
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
  
  // Estados para preview de datos
  profesoresPreview = signal<ProfesorRequest[]>([]);
  showProfesoresPreview = signal(false);
  isProcessingProfesoresFile = signal(false);

  constructor(
    private snackBar: MatSnackBar,
    private alumnosService: AlumnosService,
    private profesoresService: ProfesoresService
  ) {}



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

  private async setFile(file: File, type: 'alumnos' | 'profesores'): Promise<void> {
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      this.snackBar.open('Formato no válido. Debe ser .xlsx', 'Cerrar', { duration: 2500 });
      return;
    }
    
    if (type === 'alumnos') {
      this.alumnosFile = file;
    } else {
      this.profesoresFile = file;
      // Procesar inmediatamente el archivo de profesores para mostrar preview
      await this.processProfesoresFile(file);
    }
  }

  openPicker(type: 'alumnos' | 'profesores', inputEl: HTMLInputElement): void {
    inputEl.click();
  }

  private async processProfesoresFile(file: File): Promise<void> {
    this.isProcessingProfesoresFile.set(true);
    
    try {
      // Leer el archivo Excel
      const excelData = await this.readExcelFile(file);
      console.log('Datos del Excel de profesores leídos para preview:', excelData);
      
      // Procesar los datos
      console.log('AdministrationComponent: Procesando datos de Excel...');
      const profesoresData = this.profesoresService.processExcelData(excelData);
      console.log('AdministrationComponent: Datos procesados para preview:', profesoresData);
      console.log('AdministrationComponent: Total profesores procesados:', profesoresData.length);
      
      // Mostrar preview
      this.profesoresPreview.set(profesoresData);
      this.showProfesoresPreview.set(true);
      
      if (profesoresData.length === 0) {
        console.error('AdministrationComponent: No se encontraron profesores válidos');
        console.error('AdministrationComponent: Datos del Excel:', excelData);
        console.error('AdministrationComponent: Primera fila:', excelData[0]);
        console.error('AdministrationComponent: Columnas encontradas:', Object.keys(excelData[0] || {}));
        
        const columnas = Object.keys(excelData[0] || {});
        this.snackBar.open(
          `No se encontraron profesores válidos. Columnas encontradas: ${columnas.join(', ')}. Se necesitan: Nombre, Apellidos, Direc. Mail UPV, Nombre unidad org.`, 
          'Cerrar', 
          { duration: 10000 }
        );
        this.showProfesoresPreview.set(false);
      } else {
        console.log('AdministrationComponent: Profesores encontrados, mostrando preview');
        this.snackBar.open(`Archivo cargado: ${profesoresData.length} profesores encontrados`, 'Cerrar', { duration: 3000 });
      }
      
    } catch (error) {
      console.error('Error procesando archivo de profesores:', error);
      this.snackBar.open('Error al procesar el archivo: ' + (error as any)?.message || 'Error desconocido', 'Cerrar', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      this.showProfesoresPreview.set(false);
    } finally {
      this.isProcessingProfesoresFile.set(false);
    }
  }

  async syncAlumnos(): Promise<void> {
    if (!this.alumnosFile) {
      this.snackBar.open('Seleccione un archivo de alumnos (.xlsx)', 'Cerrar', { duration: 2500 });
      return;
    }

    this.isSyncingAlumnos.set(true);
    
    try {
      // Leer el archivo Excel
      const excelData = await this.readExcelFile(this.alumnosFile);
      console.log('Datos del Excel leídos:', excelData);
      console.log('Primera fila del Excel:', excelData[0]);
      console.log('Nombres de columnas:', Object.keys(excelData[0] || {}));
      
      // Procesar los datos
      const alumnosData = this.alumnosService.processExcelData(excelData);
      console.log('Datos procesados:', alumnosData);
      console.log('Total de alumnos procesados:', alumnosData.length);
      
      if (alumnosData.length === 0) {
        this.snackBar.open('No se encontraron datos válidos en el archivo', 'Cerrar', { duration: 3000 });
        this.isSyncingAlumnos.set(false);
        return;
      }

      // Validar los datos
      const validation = this.alumnosService.validateAlumnosData(alumnosData);
      if (!validation.valid) {
        // Mostrar solo los primeros 5 errores para no saturar la pantalla
        const errorPreview = validation.errors.slice(0, 5);
        const errorMessage = errorPreview.length < validation.errors.length 
          ? `${errorPreview.join(', ')}... (y ${validation.errors.length - errorPreview.length} errores más)`
          : errorPreview.join(', ');
        
        this.snackBar.open(
          `❌ Errores de validación encontrados: ${errorMessage}`, 
          'Cerrar', 
          { 
            duration: 8000,
            panelClass: ['error-snackbar']
          }
        );
        
        // Log todos los errores en consola para debugging
        console.error('Errores de validación completos:', validation.errors);
        this.isSyncingAlumnos.set(false);
        return;
      }

      // Enviar a la API
      console.log('Enviando datos a la API:', alumnosData);
      const response = await this.alumnosService.createBulkAlumnos(alumnosData).toPromise();
      console.log('Respuesta de la API:', response);
      
      if (response) {
        this.snackBar.open(
          `✅ Sincronización realizada correctamente: ${response.alumnosProcesados} alumnos procesados de ${response.totalProcesados} total`, 
          'Cerrar', 
          { 
            duration: 6000,
            panelClass: ['success-snackbar']
          }
        );
        
        // Limpiar el archivo después del éxito
        this.alumnosFile = undefined;
        // Resetear el input file
        const fileInput = document.getElementById('alumnos-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        this.snackBar.open('❌ Error en la sincronización: No se recibió respuesta del servidor', 'Cerrar', { 
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
      
    } catch (error) {
      console.error('Error sincronizando alumnos:', error);
      this.snackBar.open('❌ Error en la sincronización: ' + (error as any)?.message || 'Error desconocido', 'Cerrar', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isSyncingAlumnos.set(false);
    }
  }

  private async readExcelFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Error leyendo el archivo'));
      reader.readAsBinaryString(file);
    });
  }

  async syncProfesores(): Promise<void> {
    const profesoresData = this.profesoresPreview();
    
    if (profesoresData.length === 0) {
      this.snackBar.open('No hay profesores para sincronizar', 'Cerrar', { duration: 2500 });
      return;
    }

    this.isSyncingProfesores.set(true);
    
    try {
      // Validar los datos
      const validation = this.profesoresService.validateProfesoresData(profesoresData);
      if (!validation.valid) {
        // Mostrar solo los primeros 5 errores para no saturar la pantalla
        const errorPreview = validation.errors.slice(0, 5);
        const errorMessage = errorPreview.length < validation.errors.length 
          ? `${errorPreview.join(', ')}... (y ${validation.errors.length - errorPreview.length} errores más)`
          : errorPreview.join(', ');
        
        this.snackBar.open(
          `❌ Errores de validación encontrados: ${errorMessage}`, 
          'Cerrar', 
          { 
            duration: 8000,
            panelClass: ['error-snackbar']
          }
        );
        
        // Log todos los errores en consola para debugging
        console.error('Errores de validación completos:', validation.errors);
        this.isSyncingProfesores.set(false);
        return;
      }

      // Enviar a la API
      console.log('Enviando datos de profesores a la API:', profesoresData);
      const response = await this.profesoresService.createBulkProfesores(profesoresData).toPromise();
      console.log('Respuesta de la API:', response);
      
      if (response) {
        this.snackBar.open(
          `✅ Sincronización realizada correctamente: ${response.profesoresProcesados} profesores procesados de ${response.totalProcesados} total`, 
          'Cerrar', 
          { 
            duration: 6000,
            panelClass: ['success-snackbar']
          }
        );
        
        // Limpiar después del éxito
        this.clearProfesoresData();
      } else {
        this.snackBar.open('❌ Error en la sincronización: No se recibió respuesta del servidor', 'Cerrar', { 
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
      
    } catch (error) {
      console.error('Error sincronizando profesores:', error);
      this.snackBar.open('❌ Error en la sincronización: ' + (error as any)?.message || 'Error desconocido', 'Cerrar', { 
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isSyncingProfesores.set(false);
    }
  }

  clearProfesoresData(): void {
    this.profesoresFile = undefined;
    this.profesoresPreview.set([]);
    this.showProfesoresPreview.set(false);
    
    // Resetear el input file
    const fileInput = document.getElementById('profesores-file-input') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  trackByProfesor(index: number, profesor: ProfesorRequest): string {
    return `${profesor.email}-${profesor.dni}`;
  }

  getEspecialidadLabel(tipoEspecialidad: string): string {
    switch (tipoEspecialidad) {
      case 'ingenieria_computacion':
        return 'Ing. Computación';
      case 'ingenieria_software':
        return 'Ing. Software';
      case 'computacion':
        return 'Computación';
      default:
        return 'Sin especificar';
    }
  }
}
