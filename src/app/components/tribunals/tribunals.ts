import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslationService } from '../../services/translation.service';
import { AlumnosService } from '../../services/alumnos.service';
import { DefensasService } from '../../services/defensas.service';
import { AuthService } from '../../services/auth.service';
import { AulasService } from '../../services/aulas.service';
import { Aula } from '../../models/aula.model';
import { DefensasHorariosService } from '../../services/defensas-horarios.service';
import { HorariosDialogComponent } from './horarios-dialog.component';
import { NotificacionHorariosService, NotificarHorariosRequest } from '../../services/notificacion-horarios.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import * as XLSX from 'xlsx';
import { DeleteConfirmationDialogComponent } from './delete-confirmation-dialog.component';
import { EstadoDefensa } from '../../models/defensa.model';

@Component({
  selector: 'app-tribunals',
  standalone: true,
  imports: [CommonModule, FormsModule, MatTableModule, MatPaginatorModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, MatSortModule, MatIconModule, MatButtonModule, MatChipsModule, MatSelectModule, MatTooltipModule, MatSnackBarModule, MatDialogModule, TranslatePipe],
  templateUrl: './tribunals.html',
  styleUrl: './tribunals.scss'
})
export class TribunalsComponent implements OnInit {
  private translationService = inject(TranslationService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private alumnosService = inject(AlumnosService);
  private defensasService = inject(DefensasService);
  private authService = inject(AuthService);
  private aulasService = inject(AulasService);
  private defensasHorariosService = inject(DefensasHorariosService);
  private notificacionHorariosService = inject(NotificacionHorariosService);
  private cdr = inject(ChangeDetectorRef);
  displayedColumns = ['student','dni','title','specialty','director','codirector','president','vocal','replacement','field','language','date','time','place','horarios','notificar','status','actions'];
  data: any[] = [];
  filteredData: any[] = [];
  pageSize = 10;
  pageIndex = 0;
  fromDate?: Date;
  toDate?: Date;
  filterText: string = '';
  sortActive: string = '';
  sortDirection: 'asc' | 'desc' | '' = '';
  statusOptions = ['Aprobada', 'Pendiente', 'Rechazada'];
  editingStatus: { [key: string]: boolean } = {};
  aulas: Aula[] = [];
  editingPlace: { [key: string]: boolean } = {};

  // Getter para verificar si el usuario es administrador
  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  // Verificar si hay filtros activos
  hasActiveFilters(): boolean {
    return !!(this.fromDate || this.toDate || (this.filterText && this.filterText.trim() !== ''));
  }

  // Limpiar todos los filtros
  clearFilters(): void {
    this.fromDate = undefined;
    this.toDate = undefined;
    this.filterText = '';
    this.applyFilters();
    console.log('TribunalsComponent: Filtros limpiados');
  }

  ngOnInit(): void {
    console.log('TribunalsComponent: ngOnInit ejecutado');
    this.loadDefensas();
    this.loadAulas();
  }

  loadDefensas(): void {
    console.log('TribunalsComponent: Cargando defensas desde la API...');
    console.log('TribunalsComponent: DefensasService disponible:', !!this.defensasService);
    
    // Preparar filtros por defecto para obtener todas las defensas
    const filters = {
      page: 1,
      limit: 1000 // Obtener todas las defensas
    };
    
    this.defensasService.getDefensas(filters).subscribe({
      next: (response: any) => {
        console.log('TribunalsComponent: Respuesta completa recibida:', response);
        console.log('TribunalsComponent: response.success:', response?.success);
        console.log('TribunalsComponent: response.data:', response?.data);
        console.log('TribunalsComponent: Tipo de response.data:', typeof response?.data);
        console.log('TribunalsComponent: Array length:', Array.isArray(response?.data) ? response.data.length : 'No es array');
        
        if (response && response.success && response.data && Array.isArray(response.data)) {
          console.log('TribunalsComponent: Convirtiendo defensas a formato de tabla...');
          this.data = this.convertDefensasToTableFormat(response.data);
          console.log('TribunalsComponent: Datos convertidos:', this.data);
          this.applyFilters();
          this.snackBar.open(`Cargadas ${this.data.length} defensas`, 'Cerrar', { duration: 2000 });
        } else {
          console.warn('TribunalsComponent: Respuesta sin datos válidos:', response);
          this.data = [];
          this.applyFilters();
          this.snackBar.open('No hay defensas registradas', 'Cerrar', { duration: 2000 });
        }
      },
      error: (error) => {
        console.error('TribunalsComponent: Error cargando defensas:', error);
        console.error('TribunalsComponent: Error details:', error.message, error.status);
        this.snackBar.open('Error al cargar las defensas', 'Cerrar', { duration: 3000 });
        // Fallback a datos vacíos si hay error
        this.data = [];
        this.applyFilters();
      }
    });
  }

  loadAulas(): void {
    console.log('TribunalsComponent: Cargando aulas...');
    this.aulasService.getAllAulas().subscribe({
      next: (response) => {
        if (response.success && response.dataList) {
          this.aulas = response.dataList;
          console.log('TribunalsComponent: Aulas cargadas:', this.aulas.length);
        } else {
          console.warn('TribunalsComponent: No se pudieron cargar las aulas');
          this.aulas = [];
        }
      },
      error: (error) => {
        console.error('TribunalsComponent: Error cargando aulas:', error);
        this.aulas = [];
      }
    });
  }

  convertDefensasToTableFormat(defensas: any[]): any[] {
    return defensas.map((defensa) => {
      // Mapear datos de la defensa al formato de la tabla
      const estudiante = defensa.estudiante || {};
      const director = defensa.directorTribunal || {};
      const codirector = defensa.codirectorTribunal || {};
      const vocal = defensa.vocalTribunal || {};
      const suplente = defensa.suplente || {};
      
      return {
        id: defensa.id,
        student: `${estudiante.nombre || ''} ${estudiante.apellidos || ''}`.trim() || 'Sin nombre',
        dni: estudiante.dni || 'Sin DNI',
        title: defensa.titulo || 'Sin título',
        specialty: defensa.especialidad || this.getSpecialtyFromId(defensa.idEspecialidad),
        director: `${director.nombre || ''} ${director.apellidos || ''}`.trim() || '-',
        codirector: codirector.nombre ? `${codirector.nombre} ${codirector.apellidos || ''}`.trim() : '-',
        president: defensa.presidente ? `${defensa.presidente.nombre || ''} ${defensa.presidente.apellidos || ''}`.trim() : '-',
        vocal: vocal.nombre ? `${vocal.nombre} ${vocal.apellidos || ''}`.trim() : '-',
        replacement: suplente.nombre ? `${suplente.nombre} ${suplente.apellidos || ''}`.trim() : '-',
        field: this.getFieldFromEspecialidad(defensa.idEspecialidad),
        language: this.getLanguageCode(defensa.idioma),
        date: defensa.fechaDefensa ? this.formatDate(defensa.fechaDefensa) : '',
        time: defensa.horaDefensa ? this.formatTime(defensa.horaDefensa) : '',
        place: defensa.lugarDefensa || defensa.lugar || 'Por asignar',
        status: this.mapStatus(defensa.estado),
        // Datos adicionales
        curso: defensa.curso,
        grado: defensa.grado,
        especialidad: defensa.especialidad,
        idioma: defensa.idioma,
        comentarios: defensa.comentariosDireccion,
        especialidadesVocal: defensa.especialidadesVocal,
        especialidadesSuplente: defensa.especialidadesSuplente,
        created: defensa.created,
        horariosCount: defensa.horariosCount || 0,
        horariosSeleccionados: defensa.horariosSeleccionados || '',
        // Emails de los profesores para las notificaciones
        codirectorEmail: codirector.email || '',
        vocalEmail: vocal.email || '',
        replacementEmail: suplente.email || ''
      };
    });
  }

  getSpecialtyFromId(idEspecialidad: number): string {
    switch (idEspecialidad) {
      case 1: return 'Ing. Comp.';
      case 2: return 'Ing. Software';
      case 3: return 'Computación';
      default: return 'Sin especialidad';
    }
  }

  getFieldFromEspecialidad(idEspecialidad: number): string {
    switch (idEspecialidad) {
      case 1: return 'Sistemas';
      case 2: return 'Software';
      case 3: return 'Computación';
      default: return 'General';
    }
  }

  getLanguageCode(idioma: string): string {
    switch (idioma?.toLowerCase()) {
      case 'es': return 'ES';
      case 'en': return 'EN';
      case 'eu': return 'EU';
      default: return 'ES';
    }
  }

  formatDate(fecha: string): string {
    if (!fecha) return '';
    const date = new Date(fecha);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }

  formatTime(hora: string): string {
    if (!hora) return '';
    // If hora is already in HH:MM format, return as is
    if (hora.includes(':')) return hora;
    // If it's a time object or different format, convert
    return hora;
  }

  mapStatus(estado: string): string {
    switch (estado?.toLowerCase()) {
      case 'aprobada': return 'Aprobada';
      case 'pendiente': return 'Pendiente';
      case 'rechazada': return 'Rechazada';
      case 'en_proceso': return 'En Proceso';
      default: return 'Pendiente';
    }
  }


  generateFakeData(count: number): any[] {
    const list: any[] = [];
    for (let i = 0; i < count; i++) {
      const day = (i % 28) + 1;
      const month = ((i % 12) + 1).toString().padStart(2, '0');
      const dateStr = `2025-${month}-${day.toString().padStart(2,'0')}`;
      list.push({
        student: `Estudiante ${i+1}`,
        dni: `1234567${i % 10}A`,
        title: `Título TFG ${i+1}`,
        specialty: ['Computación','Ing. Software','Ing. Comp.'][i % 3],
        director: `Dr. Director ${i+1}`,
        codirector: i % 2 === 0 ? `Dra. Codirectora ${i+1}` : '-',
        president: `Presidente ${i+1}`,
        vocal: `Vocal ${i+1}`,
        replacement: `Suplente ${i+1}`,
        field: ['IA','Sistemas','Redes'][i % 3],
        language: ['ES','EN','EU'][i % 3],
        date: i % 7 === 0 ? '' : dateStr, // Some records without date
        time: i % 7 === 0 ? '' : `${(9 + (i % 8)).toString().padStart(2,'0')}:00`,
        place: i % 7 === 0 ? 'Por asignar' : `Aula ${100 + i}`,
        status: ['Aprobada', 'Pendiente', 'Rechazada'][i % 3],
      });
    }
    return list;
  }

  applyFilters(): void {
    console.log('TribunalsComponent: Aplicando filtros...');
    console.log('TribunalsComponent: fromDate:', this.fromDate);
    console.log('TribunalsComponent: toDate:', this.toDate);
    console.log('TribunalsComponent: filterText:', this.filterText);
    
    const inRange = (createdDate: string | Date) => {
      if (!createdDate) return true; // Si no hay fecha de creación, incluir el registro
      
      const date = new Date(createdDate);
      if (isNaN(date.getTime())) return true; // Si la fecha no es válida, incluir el registro
      
      // Ajustar las fechas para comparación (solo fecha, sin hora)
      const fromDate = this.fromDate ? new Date(this.fromDate.getFullYear(), this.fromDate.getMonth(), this.fromDate.getDate()) : null;
      const toDate = this.toDate ? new Date(this.toDate.getFullYear(), this.toDate.getMonth(), this.toDate.getDate(), 23, 59, 59) : null;
      const recordDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      
      console.log('TribunalsComponent: Comparando fecha:', {
        createdDate,
        recordDate: recordDate.toISOString(),
        fromDate: fromDate?.toISOString(),
        toDate: toDate?.toISOString()
      });
      
      if (fromDate && recordDate < fromDate) return false;
      if (toDate && recordDate > toDate) return false;
      return true;
    };
    
    const text = (this.filterText || '').toLowerCase().trim();
    const textMatch = (r: any) =>
      !text || [r.student, r.dni, r.title, r.specialty, r.director, r.codirector, r.president, r.vocal, r.place, r.status]
        .map((v: any) => String(v ?? '').toLowerCase())
        .some((s: string) => s.includes(text));

    let result = this.data.filter(r => inRange(r.created) && textMatch(r));

    if (this.sortActive && this.sortDirection) {
      const dir = this.sortDirection === 'asc' ? 1 : -1;
      result = result.slice().sort((a: any, b: any) => {
        const av = a[this.sortActive];
        const bv = b[this.sortActive];
        if (av == null && bv == null) return 0;
        if (av == null) return -1 * dir;
        if (bv == null) return 1 * dir;
        return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
      });
    }

    this.filteredData = result;
    // Forzar la detección de cambios para actualizar la tabla
    this.cdr.detectChanges();
    console.log('TribunalsComponent: Filtros aplicados. Resultados:', {
      totalData: this.data.length,
      filteredData: this.filteredData.length,
      fromDate: this.fromDate,
      toDate: this.toDate
    });
  }

  onPageChange(event: any): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  onSortChange(sort: Sort): void {
    this.sortActive = sort.active;
    this.sortDirection = sort.direction;
    this.applyFilters();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Aprobada': return 'accent';
      case 'Pendiente': return 'warn';
      case 'Rechazada': return 'primary';
      default: return 'basic';
    }
  }

  onStatusChange(row: any, newStatus: string): void {
    if (row.id) {
      console.log('TribunalsComponent: Cambiando estado de defensa:', {
        id: row.id,
        newStatus: newStatus
      });
      
      this.defensasService.updateEstado(row.id, newStatus).subscribe({
        next: (response) => {
          console.log('TribunalsComponent: Respuesta del servidor:', response);
          // El backend devuelve { message: "..." } en lugar de { success: true }
          if (response && (response.success || response.message)) {
            // Actualizar el estado en los datos locales
            const dataIndex = this.data.findIndex(item => item.id === row.id);
            if (dataIndex !== -1) {
              this.data[dataIndex].status = newStatus;
              // También actualizar el objeto row directamente para el dropdown
              row.status = newStatus;
              this.applyFilters();
              // Forzar la detección de cambios para actualizar la vista
              this.cdr.detectChanges();
            }
            this.snackBar.open(`Estado cambiado a: ${newStatus}`, 'Cerrar', { duration: 2000 });
          } else {
            this.snackBar.open('Error al actualizar el estado', 'Cerrar', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error actualizando estado:', error);
          this.snackBar.open('Error al actualizar el estado', 'Cerrar', { duration: 3000 });
        }
      });
    } else {
      // Fallback para datos sin ID (no debería pasar con datos reales)
      const dataIndex = this.data.findIndex(item => 
        item.student === row.student && 
        item.dni === row.dni && 
        item.date === row.date
      );
      
      if (dataIndex !== -1) {
        this.data[dataIndex].status = newStatus;
        // También actualizar el objeto row directamente para el dropdown
        row.status = newStatus;
        this.applyFilters();
        // Forzar la detección de cambios para actualizar la vista
        this.cdr.detectChanges();
        this.snackBar.open(`Estado cambiado a: ${newStatus}`, 'Cerrar', { duration: 2000 });
      }
    }
    
    // Close the dropdown
    this.editingStatus[this.getRowKey(row)] = false;
  }

  getRowKey(row: any): string {
    return row.id ? `id-${row.id}` : `${row.student}-${row.dni}-${row.date}`;
  }

  toggleStatusEdit(row: any): void {
    const key = this.getRowKey(row);
    this.editingStatus[key] = !this.editingStatus[key];
    
    // Auto-focus the select when it opens
    if (this.editingStatus[key]) {
      setTimeout(() => {
        const selectElement = document.querySelector(`[data-row-key="${key}"] .mat-mdc-select-trigger`) as HTMLElement;
        if (selectElement) {
          selectElement.click();
        }
      }, 100);
    }
  }

  isEditingStatus(row: any): boolean {
    return this.editingStatus[this.getRowKey(row)] || false;
  }

  onPlaceChange(row: any, newPlace: string): void {
    if (row.id) {
      console.log('TribunalsComponent: Cambiando lugar de defensa:', {
        id: row.id,
        newPlace: newPlace
      });
      
      this.defensasService.updateLugar(row.id, newPlace).subscribe({
        next: (response) => {
          console.log('TribunalsComponent: Respuesta del servidor:', response);
          if (response && (response.success || response.message)) {
            // Actualizar el lugar en los datos locales
            const dataIndex = this.data.findIndex(item => item.id === row.id);
            if (dataIndex !== -1) {
              this.data[dataIndex].place = newPlace;
              row.place = newPlace;
              this.applyFilters();
              this.cdr.detectChanges();
            }
            this.snackBar.open(`Lugar cambiado a: ${newPlace || 'Sin asignar'}`, 'Cerrar', { duration: 2000 });
          } else {
            this.snackBar.open('Error al actualizar el lugar', 'Cerrar', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error actualizando lugar:', error);
          this.snackBar.open('Error al actualizar el lugar', 'Cerrar', { duration: 3000 });
        }
      });
    } else {
      // Fallback para datos sin ID (actualización local)
      const dataIndex = this.data.findIndex(item => 
        item.student === row.student && 
        item.dni === row.dni && 
        item.date === row.date
      );
      
      if (dataIndex !== -1) {
        this.data[dataIndex].place = newPlace;
        row.place = newPlace;
        this.applyFilters();
        this.cdr.detectChanges();
        this.snackBar.open(`Lugar cambiado a: ${newPlace || 'Sin asignar'}`, 'Cerrar', { duration: 2000 });
      }
    }
    
    // Close the dropdown
    this.editingPlace[this.getRowKey(row)] = false;
  }

  togglePlaceEdit(row: any): void {
    const key = this.getRowKey(row);
    this.editingPlace[key] = !this.editingPlace[key];
    
    // Auto-focus the select when it opens
    if (this.editingPlace[key]) {
      setTimeout(() => {
        const selectElement = document.querySelector(`[data-row-key="${key}"] .mat-mdc-select-trigger`) as HTMLElement;
        if (selectElement) {
          selectElement.click();
        }
      }, 100);
    }
  }

  isEditingPlace(row: any): boolean {
    return this.editingPlace[this.getRowKey(row)] || false;
  }

  hasDate(row: any): boolean {
    return row.date && row.date.trim() !== '';
  }

  goToSchedule(row: any): void {
    // Guardar los datos de la defensa en el servicio o localStorage
    const defenseData = {
      student: row.student,
      dni: row.dni,
      title: row.title,
      specialty: row.specialty,
      director: row.director,
      codirector: row.codirector,
      president: row.president,
      vocal: row.vocal,
      replacement: row.replacement,
      field: row.field,
      language: row.language,
      status: row.status
    };
    
    // Guardar en localStorage para que el scheduler pueda acceder
    localStorage.setItem('currentDefense', JSON.stringify(defenseData));
    
    this.router.navigate(['/scheduler']);
    this.snackBar.open(`Planificando defensa: ${row.student}`, 'Cerrar', { duration: 2000 });
  }

  deleteDefense(row: any): void {
    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: this.translationService.getTranslation('cases.confirmDelete'),
        message: this.translationService.getTranslation('cases.deleteDefenseMessage'),
        details: this.translationService.getTranslation('cases.deleteDefenseDetails'),
        defenseInfo: `${row.student} - ${row.title}`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && row.id) {
        // Eliminar la defensa usando el servicio
        this.defensasService.deleteDefensa(row.id).subscribe({
          next: (response) => {
            console.log('TribunalsComponent: Respuesta del servidor:', response);
            if (response && (response.success || response.message)) {
              // Eliminar el registro de los datos locales
              const originalIndex = this.data.findIndex(item => item.id === row.id);
              
              if (originalIndex > -1) {
                this.data.splice(originalIndex, 1);
                
                // Reaplicar filtros para actualizar la vista filtrada
                this.applyFilters();
                
                // Ajustar el índice de página si es necesario
                const totalPages = Math.ceil(this.filteredData.length / this.pageSize);
                if (this.pageIndex >= totalPages && totalPages > 0) {
                  this.pageIndex = totalPages - 1;
                }
              }
              
              this.snackBar.open(
                `${this.translationService.getTranslation('cases.delete')}: ${row.student}`, 
                'Cerrar', 
                { duration: 3000 }
              );
            } else {
              this.snackBar.open(
                'Error al eliminar la defensa',
                'Cerrar',
                { duration: 3000 }
              );
            }
          },
          error: (error) => {
            console.error('Error eliminando defensa:', error);
            this.snackBar.open(
              'Error al eliminar la defensa',
              'Cerrar',
              { duration: 3000 }
            );
          }
        });
      }
    });
  }

  exportToExcel(): void {
    const t = (k: string) => this.translationService.getTranslation(k);
    const headers = [
      t('tribunals.student'), t('tribunals.dni'), t('tribunals.titleCol'), t('tribunals.specialty'),
      t('tribunals.director'), t('tribunals.codirector'), t('tribunals.president'), t('tribunals.vocal'),
      t('tribunals.replacement'), t('tribunals.field'), t('tribunals.language'), t('tribunals.date'), t('tribunals.time'), t('tribunals.place'), t('tribunals.status')
    ];
    
    // Convert data to objects with translated headers
    const exportData = this.filteredData.map(row => ({
      [t('tribunals.student')]: row.student,
      [t('tribunals.dni')]: row.dni,
      [t('tribunals.titleCol')]: row.title,
      [t('tribunals.specialty')]: row.specialty,
      [t('tribunals.director')]: row.director,
      [t('tribunals.codirector')]: row.codirector,
      [t('tribunals.president')]: row.president,
      [t('tribunals.vocal')]: row.vocal,
      [t('tribunals.replacement')]: row.replacement,
      [t('tribunals.field')]: row.field,
      [t('tribunals.language')]: row.language,
      [t('tribunals.date')]: row.date,
      [t('tribunals.time')]: row.time,
      [t('tribunals.place')]: row.place,
      [t('tribunals.status')]: row.status,
    }));

    try {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Style headers with background color
      const headerRange = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;
        
        ws[cellAddress].s = {
          fill: { fgColor: { rgb: "4472C4" } },
          font: { color: { rgb: "FFFFFF" }, bold: true },
          alignment: { horizontal: "center", vertical: "center" }
        };
      }
      
      // Set column widths
      const colWidths = [
        { wch: 15 }, { wch: 12 }, { wch: 25 }, { wch: 15 },
        { wch: 20 }, { wch: 20 }, { wch: 18 }, { wch: 15 },
        { wch: 15 }, { wch: 12 }, { wch: 8 }, { wch: 12 },
        { wch: 8 }, { wch: 12 }, { wch: 12 }
      ];
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Defensas');
      XLSX.writeFile(wb, 'defensas.xlsx');
      this.snackBar.open('Archivo Excel exportado correctamente', 'Cerrar', { duration: 3000 });
    } catch (error) {
      this.snackBar.open('Error al exportar el archivo Excel', 'Cerrar', { duration: 3000 });
    }
  }

  deleteAllDefensas(): void {
    const dialogRef = this.dialog.open(DeleteConfirmationDialogComponent, {
      width: '500px',
      data: {
        title: this.translationService.getTranslation('tribunals.deleteAllConfirm'),
        message: this.translationService.getTranslation('tribunals.deleteAllMessage'),
        details: this.translationService.getTranslation('tribunals.deleteAllDetails'),
        defenseInfo: `${this.data.length} defensas`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.defensasService.deleteAllDefensas().subscribe({
          next: (response) => {
            if (response.success) {
              // Limpiar todos los datos locales
              this.data = [];
              this.filteredData = [];
              this.pageIndex = 0;
              
              this.snackBar.open(
                this.translationService.getTranslation('tribunals.deleteAllSuccess'),
                'Cerrar', 
                { duration: 3000 }
              );
            } else {
              this.snackBar.open(
                this.translationService.getTranslation('tribunals.deleteAllError'),
                'Cerrar',
                { duration: 3000 }
              );
            }
          },
          error: (error) => {
            console.error('Error eliminando todas las defensas:', error);
            this.snackBar.open(
              this.translationService.getTranslation('tribunals.deleteAllError'),
              'Cerrar',
              { duration: 3000 }
            );
          }
        });
      }
    });
  }

  openHorariosDialog(row: any): void {
    console.log('=== ABRIENDO DIÁLOGO DE HORARIOS ===');
    console.log('Row data:', row);
    console.log('Horarios seleccionados:', row.horariosSeleccionados);
    
    const dialogRef = this.dialog.open(HorariosDialogComponent, {
      width: '800px',
      maxHeight: 'none',
      data: {
        idDefensa: row.id,
        studentName: row.student,
        title: row.title,
        horariosSeleccionados: row.horariosSeleccionados || ''
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Recargar los datos para actualizar el contador de horarios
        this.loadDefensas();
      }
    });
  }

  notificarHorarios(row: any): void {
    console.log('=== NOTIFICAR HORARIOS - CLICK DETECTADO ===');
    console.log('Row data:', row);
    console.log('Row ID:', row.id);
    console.log('Horarios count:', row.horariosCount);
    console.log('Horarios seleccionados:', row.horariosSeleccionados);
    console.log('Emails disponibles:', {
      codirector: row.codirectorEmail,
      vocal: row.vocalEmail,
      replacement: row.replacementEmail
    });
    
    // Verificar que el servicio esté disponible
    console.log('NotificacionHorariosService disponible:', !!this.notificacionHorariosService);
    
    // Verificar que la defensa tenga horarios configurados
    if (!row.horariosCount || row.horariosCount === 0) {
      console.log('No hay horarios configurados, mostrando mensaje de error');
      this.snackBar.open('Debe configurar horarios antes de enviar la notificación', 'Cerrar', { duration: 3000 });
      return;
    }

    // Verificar que haya al menos un email disponible
    const emailsDisponibles = [row.codirectorEmail, row.vocalEmail, row.replacementEmail].filter(email => email && email.trim() !== '');
    if (emailsDisponibles.length === 0) {
      console.log('No hay emails disponibles para enviar notificación');
      this.snackBar.open('No hay emails de profesores disponibles para enviar la notificación', 'Cerrar', { duration: 3000 });
      return;
    }

    // Crear la solicitud de notificación
    const request: NotificarHorariosRequest = {
      idDefensa: row.id,
      tituloDefensa: row.title,
      nombreEstudiante: row.student,
      emailCodirector: row.codirectorEmail || '',
      emailVocal: row.vocalEmail || '',
      emailReemplazo: row.replacementEmail || ''
    };

    console.log('Enviando solicitud de notificación:', request);

    // Mostrar mensaje de carga
    this.snackBar.open('Enviando notificación...', 'Cerrar', { duration: 2000 });

    // Enviar la notificación
    this.notificacionHorariosService.notificarHorarios(request).subscribe({
      next: (response) => {
        console.log('Respuesta de notificación:', response);
        if (response.success) {
          const destinatarios = response.destinatarios?.length || emailsDisponibles.length;
          this.snackBar.open(
            `Notificación enviada correctamente a ${destinatarios} destinatarios`, 
            'Cerrar', 
            { duration: 4000 }
          );
        } else {
          this.snackBar.open(`Error al enviar la notificación: ${response.message || 'Error desconocido'}`, 'Cerrar', { duration: 4000 });
        }
      },
      error: (error) => {
        console.error('Error enviando notificación:', error);
        this.snackBar.open(`Error al enviar la notificación: ${error.message || 'Error de conexión'}`, 'Cerrar', { duration: 4000 });
      }
    });
  }
}
