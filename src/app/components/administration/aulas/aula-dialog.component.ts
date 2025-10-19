import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AulasService } from '../../../services/aulas.service';
import { Aula, AulaRequest } from '../../../models/aula.model';
import { TranslationService } from '../../../services/translation.service';
import { TranslatePipe } from '../../../pipes/translate.pipe';

export interface AulaDialogData {
  mode: 'create' | 'edit';
  aula?: Aula;
}

@Component({
  selector: 'app-aula-dialog',
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
    TranslatePipe
  ],
  templateUrl: './aula-dialog.component.html',
  styleUrl: './aula-dialog.component.scss'
})
export class AulaDialogComponent implements OnInit {
  private aulasService = inject(AulasService);
  private snackBar = inject(MatSnackBar);
  private translationService = inject(TranslationService);
  private fb = inject(FormBuilder);

  aulaForm: FormGroup;
  isSubmitting = false;

  constructor(
    public dialogRef: MatDialogRef<AulaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AulaDialogData
  ) {
    this.aulaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(100)]]
    });
  }

  ngOnInit(): void {
    if (this.data.mode === 'edit' && this.data.aula) {
      this.aulaForm.patchValue({
        nombre: this.data.aula.nombre
      });
    }
  }

  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  get title(): string {
    return this.isEditMode ? 'Editar Aula' : 'Nueva Aula';
  }

  onSubmit(): void {
    if (this.aulaForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const aulaRequest: AulaRequest = {
        nombre: this.aulaForm.value.nombre.trim()
      };

      const operation = this.isEditMode 
        ? this.aulasService.updateAula(this.data.aula!.id, aulaRequest)
        : this.aulasService.createAula(aulaRequest);

      operation.subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response.success) {
            this.snackBar.open(
              this.isEditMode ? 'Aula actualizada correctamente' : 'Aula creada correctamente',
              'Cerrar',
              { duration: 3000 }
            );
            this.dialogRef.close(true);
          } else {
            this.snackBar.open(
              response.message || 'Error al procesar la solicitud',
              'Cerrar',
              { duration: 3000 }
            );
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error:', error);
          this.snackBar.open(
            'Error al procesar la solicitud',
            'Cerrar',
            { duration: 3000 }
          );
        }
      });
    } else {
      this.aulaForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
