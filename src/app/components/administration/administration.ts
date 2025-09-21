import { Component, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
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
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-administration',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTabsModule, MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule, MatTableModule, MatPaginatorModule, ScrollingModule, MatFormFieldModule, MatInputModule, TranslatePipe],
  templateUrl: './administration.html',
  styleUrl: './administration.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdministrationComponent implements OnInit {
  currentYear = new Date().getFullYear();
  nextYear = this.currentYear + 1;

  alumnosFile?: File;
  profesoresFile?: File;

  // Alumnos table data
  alumnos: any[] = [];
  filteredAlumnos: any[] = [];
  displayedColumns: string[] = ['dni', 'nombre', 'apellidos', 'titulacion', 'asignatura', 'creditos', 'media', 'tipoGrado'];
  isLoadingAlumnos = signal(false);
  alumnosError?: string;
  
  // Search
  searchTerm = '';
  
  // Pagination
  pageSize = 10;
  pageIndex = 0;
  totalAlumnos = 0;

  isSyncingAlumnos = signal(false);
  isSyncingProfesores = signal(false);
  isDragOverAlumnos = signal(false);
  isDragOverProfesores = signal(false);

  constructor(
    private snackBar: MatSnackBar,
    private alumnosService: AlumnosService
  ) {}

  ngOnInit(): void {
    this.loadAlumnos();
  }

  loadAlumnos(): void {
    this.isLoadingAlumnos.set(true);
    this.alumnosError = undefined;

    this.alumnosService.getAllAlumnos().subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.alumnos = data;
          this.totalAlumnos = data.length;
          this.filteredAlumnos = [...data];
        } else {
          this.alumnos = [];
          this.filteredAlumnos = [];
          this.totalAlumnos = 0;
        }
        this.isLoadingAlumnos.set(false);
      },
      error: (error) => {
        console.error('Error cargando alumnos:', error);
        this.alumnosError = 'Error al cargar los alumnos. Inténtelo de nuevo.';
        this.isLoadingAlumnos.set(false);
        this.snackBar.open('❌ Error al cargar los alumnos', 'Cerrar', { 
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  get paginatedAlumnos(): any[] {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredAlumnos.slice(startIndex, endIndex);
  }

  trackByAlumnoId(index: number, alumno: any): any {
    return alumno.id || index;
  }

  onSearchChange(): void {
    this.filterAlumnos();
    this.pageIndex = 0; // Reset to first page when searching
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filterAlumnos();
    this.pageIndex = 0;
  }

  private filterAlumnos(): void {
    if (!this.searchTerm.trim()) {
      this.filteredAlumnos = [...this.alumnos];
    } else {
      const searchLower = this.searchTerm.toLowerCase().trim();
      this.filteredAlumnos = this.alumnos.filter(alumno => 
        this.matchesSearch(alumno, searchLower)
      );
    }
  }

  private matchesSearch(alumno: any, searchTerm: string): boolean {
    const searchableFields = [
      alumno.dni,
      alumno.nombre,
      alumno.apellidos,
      alumno.titulacion,
      alumno.asignatura,
      alumno.tipoGradoNombre
    ];

    return searchableFields.some(field => 
      field && field.toString().toLowerCase().includes(searchTerm)
    );
  }


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
        
        // Recargar la lista de alumnos
        this.loadAlumnos();
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
