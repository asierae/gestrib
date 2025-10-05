import { Component, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AlumnosService, AlumnoRequest } from '../../services/alumnos.service';
import { ProfesoresService } from '../../services/profesores.service';
import { DeleteConfirmationDialogComponent } from '../tribunals/delete-confirmation-dialog.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatTabsModule, 
    MatCardModule, 
    MatButtonModule, 
    MatIconModule, 
    MatSnackBarModule, 
    MatProgressSpinnerModule, 
    MatTableModule, 
    MatPaginatorModule, 
    ScrollingModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatTooltipModule,
    MatDialogModule,
    TranslatePipe
  ],
  templateUrl: './users.html',
  styleUrl: './users.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UsersComponent implements OnInit {
  currentYear = new Date().getFullYear();
  nextYear = this.currentYear + 1;

  // Alumnos data
  alumnos: any[] = [];
  filteredAlumnos: any[] = [];
  displayedColumns: string[] = ['dni', 'nombre', 'apellidos', 'titulacion', 'asignatura', 'creditos', 'media', 'tipoGrado', 'actions'];
  isLoadingAlumnos = signal(false);
  alumnosError?: string;
  searchTerm = '';
  pageSize = 10;
  pageIndex = 0;
  totalAlumnos = 0;

  // Profesores data
  profesores: any[] = [];
  filteredProfesores: any[] = [];
  displayedColumnsProfesores: string[] = ['nombre', 'apellidos', 'email', 'especialidad', 'actions'];
  isLoadingProfesores = signal(false);
  profesoresError?: string;
  searchTermProfesores = '';
  pageSizeProfesores = 10;
  pageIndexProfesores = 0;
  totalProfesores = 0;

  constructor(
    private snackBar: MatSnackBar,
    private alumnosService: AlumnosService,
    private profesoresService: ProfesoresService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Cargar datos de forma secuencial para evitar problemas de rendimiento
    this.loadAlumnos();
    // Cargar profesores después de un pequeño delay para evitar carga simultánea
    setTimeout(() => {
      this.loadProfesores();
    }, 100);
  }

  // Alumnos methods
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
        this.cdr.markForCheck(); // Forzar detección de cambios
      },
      error: (error) => {
        console.error('Error cargando alumnos:', error);
        this.alumnosError = 'Error al cargar los alumnos. Inténtelo de nuevo.';
        this.isLoadingAlumnos.set(false);
        this.cdr.markForCheck();
        this.snackBar.open('❌ Error al cargar los alumnos', 'Cerrar', { 
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onSearchChange(): void {
    this.filterAlumnos();
    this.pageIndex = 0;
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
        this.matchesSearchAlumno(alumno, searchLower)
      );
    }
  }

  private matchesSearchAlumno(alumno: any, searchTerm: string): boolean {
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

  deleteAlumno(alumno: any): void {
    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: 'Confirmar eliminación',
        message: '¿Está seguro de que desea eliminar este alumno?',
        details: 'Esta acción no se puede deshacer.',
        defenseInfo: `${alumno.nombre} ${alumno.apellidos} - ${alumno.dni}`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.alumnosService.deleteAlumnoByDni(alumno.dni).subscribe({
          next: () => {
            // Eliminar de la lista local
            const originalIndex = this.alumnos.findIndex(a => a.dni === alumno.dni);
            if (originalIndex > -1) {
              this.alumnos.splice(originalIndex, 1);
              this.totalAlumnos = this.alumnos.length;
              this.filterAlumnos();
              
              // Ajustar el índice de página si es necesario
              const totalPages = Math.ceil(this.filteredAlumnos.length / this.pageSize);
              if (this.pageIndex >= totalPages && totalPages > 0) {
                this.pageIndex = totalPages - 1;
              }
            }
            
            this.snackBar.open(
              `✅ Alumno eliminado: ${alumno.nombre} ${alumno.apellidos}`, 
              'Cerrar', 
              { 
                duration: 3000,
                panelClass: ['success-snackbar']
              }
            );
          },
          error: (error) => {
            console.error('Error eliminando alumno:', error);
            this.snackBar.open('❌ Error al eliminar el alumno', 'Cerrar', { 
              duration: 4000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  // Profesores methods
  loadProfesores(): void {
    this.isLoadingProfesores.set(true);
    this.profesoresError = undefined;

    this.profesoresService.getProfesores().subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.profesores = data;
          this.totalProfesores = data.length;
          this.filteredProfesores = [...data];
        } else {
          this.profesores = [];
          this.filteredProfesores = [];
          this.totalProfesores = 0;
        }
        this.isLoadingProfesores.set(false);
        this.cdr.markForCheck(); // Forzar detección de cambios
      },
      error: (error) => {
        console.error('Error cargando profesores:', error);
        this.profesoresError = 'Error al cargar los profesores. Inténtelo de nuevo.';
        this.isLoadingProfesores.set(false);
        this.cdr.markForCheck();
        this.snackBar.open('❌ Error al cargar los profesores', 'Cerrar', { 
          duration: 4000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onSearchChangeProfesores(): void {
    this.filterProfesores();
    this.pageIndexProfesores = 0;
  }

  clearSearchProfesores(): void {
    this.searchTermProfesores = '';
    this.filterProfesores();
    this.pageIndexProfesores = 0;
  }

  private filterProfesores(): void {
    if (!this.searchTermProfesores.trim()) {
      this.filteredProfesores = [...this.profesores];
    } else {
      const searchLower = this.searchTermProfesores.toLowerCase().trim();
      this.filteredProfesores = this.profesores.filter(profesor => 
        this.matchesSearchProfesor(profesor, searchLower)
      );
    }
  }

  private matchesSearchProfesor(profesor: any, searchTerm: string): boolean {
    const searchableFields = [
      profesor.nombre,
      profesor.apellidos,
      profesor.email,
      profesor.tipoEspecialidad
    ];

    return searchableFields.some(field => 
      field && field.toString().toLowerCase().includes(searchTerm)
    );
  }

  onPageChangeProfesores(event: PageEvent): void {
    this.pageIndexProfesores = event.pageIndex;
    this.pageSizeProfesores = event.pageSize;
  }

  get paginatedProfesores(): any[] {
    const startIndex = this.pageIndexProfesores * this.pageSizeProfesores;
    const endIndex = startIndex + this.pageSizeProfesores;
    return this.filteredProfesores.slice(startIndex, endIndex);
  }

  trackByProfesorId(index: number, profesor: any): any {
    return profesor.id || index;
  }

  deleteProfesor(profesor: any): void {
    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: 'Confirmar eliminación',
        message: '¿Está seguro de que desea eliminar este profesor?',
        details: 'Esta acción no se puede deshacer.',
        defenseInfo: `${profesor.nombre} ${profesor.apellidos} - ${profesor.email}`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.profesoresService.deleteProfesor(profesor.id).subscribe({
          next: () => {
            // Eliminar de la lista local
            const originalIndex = this.profesores.findIndex(p => p.id === profesor.id);
            if (originalIndex > -1) {
              this.profesores.splice(originalIndex, 1);
              this.totalProfesores = this.profesores.length;
              this.filterProfesores();
              
              // Ajustar el índice de página si es necesario
              const totalPages = Math.ceil(this.filteredProfesores.length / this.pageSizeProfesores);
              if (this.pageIndexProfesores >= totalPages && totalPages > 0) {
                this.pageIndexProfesores = totalPages - 1;
              }
            }
            
            this.snackBar.open(
              `✅ Profesor eliminado: ${profesor.nombre} ${profesor.apellidos}`, 
              'Cerrar', 
              { 
                duration: 3000,
                panelClass: ['success-snackbar']
              }
            );
          },
          error: (error) => {
            console.error('Error eliminando profesor:', error);
            this.snackBar.open('❌ Error al eliminar el profesor', 'Cerrar', { 
              duration: 4000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }
}
