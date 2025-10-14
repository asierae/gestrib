import { Component, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { AlumnosService, AlumnoRequest } from '../../services/alumnos.service';
import { ProfesoresService } from '../../services/profesores.service';
import { AuthService } from '../../services/auth.service';
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
  @ViewChild('alumnosPaginator') alumnosPaginator!: MatPaginator;
  @ViewChild('profesoresPaginator') profesoresPaginator!: MatPaginator;
  
  currentYear = new Date().getFullYear();
  nextYear = this.currentYear + 1;

  // Alumnos data
  alumnos: any[] = [];
  alumnosDataSource: MatTableDataSource<any>;
  displayedColumns: string[] = ['dni', 'nombre', 'apellidos', 'titulacion', 'asignatura', 'creditos', 'media', 'tipoGrado', 'actions'];
  isLoadingAlumnos = signal(false);
  alumnosError?: string;
  searchTerm = '';
  pageSize = 10;
  pageIndex = 0;
  totalAlumnos = 0;
  filteredAlumnos: any[] = [];

  // Profesores data
  profesores: any[] = [];
  profesoresDataSource: MatTableDataSource<any>;
  displayedColumnsProfesores: string[] = ['nombre', 'apellidos', 'email', 'especialidad', 'actions'];
  isLoadingProfesores = signal(false);
  profesoresError?: string;
  searchTermProfesores = '';
  pageSizeProfesores = 10;
  pageIndexProfesores = 0;
  totalProfesores = 0;
  filteredProfesores: any[] = [];

  constructor(
    private snackBar: MatSnackBar,
    private alumnosService: AlumnosService,
    private profesoresService: ProfesoresService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private authService: AuthService
  ) {
    // Inicializar los DataSources
    this.alumnosDataSource = new MatTableDataSource<any>([]);
    this.profesoresDataSource = new MatTableDataSource<any>([]);
  }

  ngOnInit(): void {
    // Cargar datos de forma secuencial para evitar problemas de rendimiento
    this.loadAlumnos();
    // Cargar profesores después de un pequeño delay para evitar carga simultánea
    setTimeout(() => {
      this.loadProfesores();
    }, 100);
    
    // Debug: Probar conectividad con el backend
    this.testBackendConnectivity();
  }

  private testBackendConnectivity(): void {
    console.log('UsersComponent: Probando conectividad con el backend...');
    this.profesoresService.debugUserInfo().subscribe({
      next: (userInfo) => {
        console.log('UsersComponent: Backend conectado correctamente:', userInfo);
      },
      error: (error) => {
        console.error('UsersComponent: Error conectando con el backend:', error);
        console.error('UsersComponent: El backend puede no estar funcionando o no se ha reiniciado');
      }
    });
  }

  // Alumnos methods
  loadAlumnos(): void {
    this.isLoadingAlumnos.set(true);
    this.alumnosError = undefined;

    this.alumnosService.getAllAlumnos().subscribe({
      next: (data) => {
        if (Array.isArray(data)) {
          this.alumnos = data;
          this.filteredAlumnos = data;
          this.totalAlumnos = data.length;
          // Configurar el DataSource con paginación
          this.alumnosDataSource = new MatTableDataSource<any>(data);
          // Conectar el paginador al DataSource
          if (this.alumnosPaginator) {
            this.alumnosDataSource.paginator = this.alumnosPaginator;
          }
        } else {
          this.alumnos = [];
          this.filteredAlumnos = [];
          this.alumnosDataSource = new MatTableDataSource<any>([]);
          this.totalAlumnos = 0;
        }
        this.isLoadingAlumnos.set(false);
        this.cdr.detectChanges(); // Forzar detección de cambios
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
      this.filteredAlumnos = this.alumnos;
    } else {
      const searchLower = this.searchTerm.toLowerCase().trim();
      this.filteredAlumnos = this.alumnos.filter(alumno => 
        this.matchesSearchAlumno(alumno, searchLower)
      );
    }
    this.totalAlumnos = this.filteredAlumnos.length;
    this.alumnosDataSource = new MatTableDataSource<any>(this.filteredAlumnos);
    // Conectar el paginador al DataSource
    if (this.alumnosPaginator) {
      this.alumnosDataSource.paginator = this.alumnosPaginator;
    }
    this.pageIndex = 0; // Reset a la primera página
    this.cdr.detectChanges(); // Forzar detección de cambios
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

  trackByAlumnoId(index: number, alumno: any): any {
    return alumno?.id || alumno?.dni || index;
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
          this.filteredProfesores = data;
          this.totalProfesores = data.length;
          this.profesoresDataSource = new MatTableDataSource<any>(data);
          // Conectar el paginador al DataSource
          if (this.profesoresPaginator) {
            this.profesoresDataSource.paginator = this.profesoresPaginator;
          }
        } else {
          this.profesores = [];
          this.filteredProfesores = [];
          this.profesoresDataSource = new MatTableDataSource<any>([]);
          this.totalProfesores = 0;
        }
        this.isLoadingProfesores.set(false);
      },
      error: (error) => {
        console.error('Error cargando profesores:', error);
        this.profesoresError = 'Error al cargar los profesores. Inténtelo de nuevo.';
        this.isLoadingProfesores.set(false);
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
      this.filteredProfesores = this.profesores;
    } else {
      const searchLower = this.searchTermProfesores.toLowerCase().trim();
      this.filteredProfesores = this.profesores.filter(profesor => 
        this.matchesSearchProfesor(profesor, searchLower)
      );
    }
    this.totalProfesores = this.filteredProfesores.length;
    this.profesoresDataSource = new MatTableDataSource<any>(this.filteredProfesores);
    // Conectar el paginador al DataSource
    if (this.profesoresPaginator) {
      this.profesoresDataSource.paginator = this.profesoresPaginator;
    }
    this.pageIndexProfesores = 0; // Reset a la primera página
    this.cdr.detectChanges(); // Forzar detección de cambios
  }

  private matchesSearchProfesor(profesor: any, searchTerm: string): boolean {
    const searchableFields = [
      profesor.nombre,
      profesor.apellidos,
      profesor.email,
      profesor.especialidadOriginal
    ];

    return searchableFields.some(field => 
      field && field.toString().toLowerCase().includes(searchTerm)
    );
  }

  onPageChangeProfesores(event: PageEvent): void {
    this.pageIndexProfesores = event.pageIndex;
    this.pageSizeProfesores = event.pageSize;
  }

  trackByProfesorId(index: number, profesor: any): any {
    return profesor?.id || profesor?.email || index;
  }

  deleteProfesor(profesor: any): void {
    console.log('deleteProfesor: Profesor a eliminar:', profesor);
    console.log('deleteProfesor: ID del profesor:', profesor.id);
    
    // Debug: Verificar información del usuario actual
    const currentUser = this.authService.currentUser();
    console.log('deleteProfesor: Usuario actual:', currentUser);
    console.log('deleteProfesor: Es administración:', this.authService.isAdministracion());
    console.log('deleteProfesor: Tipo usuario:', currentUser?.tipoUsuario);
    console.log('deleteProfesor: Role:', currentUser?.role);
    
    // Debug: Obtener información del usuario desde el backend
    console.log('deleteProfesor: Llamando al endpoint de debug...');
    this.profesoresService.debugUserInfo().subscribe({
      next: (userInfo) => {
        console.log('deleteProfesor: Info del usuario desde backend:', userInfo);
        console.log('deleteProfesor: Backend respondió correctamente, procediendo con eliminación...');
      },
      error: (error) => {
        console.error('deleteProfesor: Error obteniendo info del usuario:', error);
        console.error('deleteProfesor: El backend no está respondiendo o hay un problema de autenticación');
      }
    });
    
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
        console.log('deleteProfesor: Confirmado, eliminando profesor con ID:', profesor.id);
        this.profesoresService.deleteProfesor(profesor.id).subscribe({
          next: () => {
            // Eliminar de la lista local
            const originalIndex = this.profesores.findIndex(p => p.id === profesor.id);
            if (originalIndex > -1) {
              this.profesores.splice(originalIndex, 1);
              this.totalProfesores = this.profesores.length;
              this.filterProfesores();
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
