import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AulasService } from '../../../services/aulas.service';
import { Aula, AulaRequest } from '../../../models/aula.model';
import { TranslationService } from '../../../services/translation.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { AulaDialogComponent } from './aula-dialog.component';

@Component({
  selector: 'app-aulas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatSortModule,
    MatTooltipModule,
    TranslatePipe
  ],
  templateUrl: './aulas.component.html',
  styleUrl: './aulas.component.scss'
})
export class AulasComponent implements OnInit {
  private aulasService = inject(AulasService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private translationService = inject(TranslationService);
  private cdr = inject(ChangeDetectorRef);

  displayedColumns = ['nombre', 'created', 'actions'];
  data: Aula[] = [];
  filteredData: Aula[] = [];
  pageSize = 10;
  pageIndex = 0;
  sortActive: string = '';
  sortDirection: 'asc' | 'desc' | '' = '';

  ngOnInit(): void {
    this.loadAulas();
  }

  loadAulas(): void {
    this.aulasService.getAllAulas().subscribe({
      next: (response) => {
        if (response.success && response.dataList) {
          this.data = response.dataList;
          this.applyFilters();
          this.snackBar.open(`Cargadas ${this.data.length} aulas`, 'Cerrar', { duration: 2000 });
        } else {
          this.snackBar.open('Error al cargar las aulas', 'Cerrar', { duration: 3000 });
        }
      },
      error: (error) => {
        console.error('Error cargando aulas:', error);
        this.snackBar.open('Error al cargar las aulas', 'Cerrar', { duration: 3000 });
      }
    });
  }

  applyFilters(): void {
    let result = [...this.data];

    if (this.sortActive && this.sortDirection) {
      const dir = this.sortDirection === 'asc' ? 1 : -1;
      result = result.sort((a: Aula, b: Aula) => {
        const av = a[this.sortActive as keyof Aula];
        const bv = b[this.sortActive as keyof Aula];
        if (av == null && bv == null) return 0;
        if (av == null) return -1 * dir;
        if (bv == null) return 1 * dir;
        return String(av).localeCompare(String(bv), undefined, { numeric: true }) * dir;
      });
    }

    this.filteredData = result;
    this.cdr.detectChanges();
  }

  onSortChange(sort: Sort): void {
    this.sortActive = sort.active;
    this.sortDirection = sort.direction;
    this.applyFilters();
  }

  onPageChange(event: any): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(AulaDialogComponent, {
      width: '400px',
      data: { mode: 'create' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAulas();
      }
    });
  }

  openEditDialog(aula: Aula): void {
    const dialogRef = this.dialog.open(AulaDialogComponent, {
      width: '400px',
      data: { mode: 'edit', aula: aula }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadAulas();
      }
    });
  }

  deleteAula(aula: Aula): void {
    if (confirm(`¿Está seguro de que desea eliminar el aula "${aula.nombre}"?`)) {
      this.aulasService.deleteAula(aula.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Aula eliminada correctamente', 'Cerrar', { duration: 3000 });
            this.loadAulas();
          } else {
            this.snackBar.open('Error al eliminar el aula', 'Cerrar', { duration: 3000 });
          }
        },
        error: (error) => {
          console.error('Error eliminando aula:', error);
          this.snackBar.open('Error al eliminar el aula', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('es-ES');
  }
}
