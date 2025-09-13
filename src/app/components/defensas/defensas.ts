import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { startWith, map } from 'rxjs/operators';
import { DefensasService } from '../../services/defensas.service';
import { ExcelService } from '../../services/excel.service';
import { ProfesoresService } from '../../services/profesores.service';
import { TranslationService } from '../../services/translation.service';
import { Defensa, CreateDefensaRequest, TipoEspecialidad, Profesor, EstudianteDisplay } from '../../models/defensa.model';
import { ESPECIALIDAD_OPTIONS } from '../../models/profesor.model';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-defensas',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule,
    TranslatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './defensas.html',
  styleUrl: './defensas.scss'
})
export class DefensasComponent implements OnInit {
  private defensasService = inject(DefensasService);
  private excelService = inject(ExcelService);
  private profesoresService = inject(ProfesoresService);
  private translationService = inject(TranslationService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  
  isLoading = signal(false);
  
  // Formulario reactivo
  defensaForm!: FormGroup;
  
  // Años
  currentYear = new Date().getFullYear();
  nextYear = this.currentYear + 1;
  
  // Datos del formulario
  estudiantes: EstudianteDisplay[] = [];
  profesores: Profesor[] = [];
  filteredEstudiantes: EstudianteDisplay[] = [];
  filteredProfesores: Profesor[] = [];
  especialidades = [
    { value: TipoEspecialidad.INGENIERIA_COMPUTACION, label: 'Ing. Comp.' },
    { value: TipoEspecialidad.INGENIERIA_SOFTWARE, label: 'Ing. Software' },
    { value: TipoEspecialidad.COMPUTACION, label: 'Computación' }
  ];
  
  // Selecciones del formulario
  selectedEstudiante: string = '';
  selectedDirector: string = '';
  selectedVocal: string = '';
  selectedSuplente: string = '';
  
  // Especialidades para checkboxes
  especialidadesVocal: any[] = [];
  especialidadesSuplente: any[] = [];
  selectedVocalEspecialidades: string[] = [];
  selectedSuplenteEspecialidades: string[] = [];
  
  
  ngOnInit(): void {
    // Asegurar que las traducciones se carguen
    console.log('DefensasComponent ngOnInit - Current language:', this.translationService.getCurrentLanguage());
    console.log('DefensasComponent ngOnInit - Translations loaded:', this.translationService.areTranslationsLoaded());
    
    this.translationService.setLanguage(this.translationService.getCurrentLanguage());
    
    this.initializeForm();
    this.setupAutocomplete();
    this.loadEstudiantes();
    this.loadProfesores();
  }
  
  private setupAutocomplete(): void {
    // Configurar autocomplete para estudiantes
    this.defensaForm.get('estudiante')?.valueChanges.pipe(
      startWith(''),
      map(value => this.filterEstudiantes(value))
    ).subscribe(filtered => {
      this.filteredEstudiantes = filtered;
    });
    
    // Configurar autocomplete para profesores
    this.defensaForm.get('directorTribunal')?.valueChanges.pipe(
      startWith(''),
      map(value => this.filterProfesores(value))
    ).subscribe(filtered => {
      this.filteredProfesores = filtered;
    });
    
    this.defensaForm.get('vocalTribunal')?.valueChanges.pipe(
      startWith(''),
      map(value => this.filterProfesores(value))
    ).subscribe(filtered => {
      this.filteredProfesores = filtered;
    });
    
    this.defensaForm.get('suplente')?.valueChanges.pipe(
      startWith(''),
      map(value => this.filterProfesores(value))
    ).subscribe(filtered => {
      this.filteredProfesores = filtered;
    });
  }
  
  private filterEstudiantes(value: string): EstudianteDisplay[] {
    if (!value) {
      return this.estudiantes;
    }
    const filterValue = value.toLowerCase();
    return this.estudiantes.filter(estudiante => 
      estudiante.nombreCompleto.toLowerCase().includes(filterValue)
    );
  }
  
  private filterProfesores(value: string): Profesor[] {
    if (!value) {
      return this.profesores;
    }
    const filterValue = value.toLowerCase();
    return this.profesores.filter(profesor => 
      `${profesor.nombre} ${profesor.apellidos}`.toLowerCase().includes(filterValue)
    );
  }
  
  private initializeForm(): void {
    this.defensaForm = this.fb.group({
      curso: [`${this.currentYear}-${this.nextYear}`, Validators.required],
      especialidad: [TipoEspecialidad.INGENIERIA_COMPUTACION, Validators.required],
      titulo: ['', [Validators.required, Validators.minLength(5)]],
      estudiante: ['', Validators.required],
      directorTribunal: ['', Validators.required],
      vocalTribunal: ['', Validators.required],
      suplente: ['', Validators.required],
      comentariosDireccion: [''],
      especialidadesVocal: [[]],
      especialidadesSuplente: [[]]
    });
  }
  
  loadEstudiantes(): void {
    this.excelService.loadEstudiantes().subscribe({
      next: (estudiantes) => {
        this.estudiantes = estudiantes;
        this.filteredEstudiantes = estudiantes;
      },
      error: (error) => {
        console.error('Error loading estudiantes:', error);
        this.snackBar.open(
          'Error al cargar los estudiantes',
          'Cerrar',
          { duration: 3000 }
        );
      }
    });
  }
  
  loadProfesores(): void {
    this.profesoresService.getProfesores().subscribe({
      next: (profesores) => {
        this.profesores = profesores;
        this.filteredProfesores = profesores;
      },
      error: (error) => {
        console.error('Error loading profesores:', error);
        this.snackBar.open(
          'Error al cargar los profesores',
          'Cerrar',
          { duration: 3000 }
        );
      }
    });
  }
  
  onEspecialidadChange(): void {
    const especialidad = this.defensaForm.get('especialidad')?.value as TipoEspecialidad;
    this.especialidadesVocal = ESPECIALIDAD_OPTIONS[especialidad] || [];
    this.especialidadesSuplente = ESPECIALIDAD_OPTIONS[especialidad] || [];
    this.selectedVocalEspecialidades = [];
    this.selectedSuplenteEspecialidades = [];
    this.defensaForm.patchValue({
      especialidadesVocal: [],
      especialidadesSuplente: []
    });
  }
  
  onEstudianteFieldClick(): void {
    // Limpiar el filtro para mostrar todos los estudiantes
    this.filteredEstudiantes = this.estudiantes;
  }
  
  onDirectorFieldClick(): void {
    // Limpiar el filtro para mostrar todos los profesores
    this.filteredProfesores = this.profesores;
  }
  
  onVocalFieldClick(): void {
    // Limpiar el filtro para mostrar todos los profesores
    this.filteredProfesores = this.profesores;
  }
  
  onSuplenteFieldClick(): void {
    // Limpiar el filtro para mostrar todos los profesores
    this.filteredProfesores = this.profesores;
  }
  
  onEstudianteChange(): void {
    // No necesitamos hacer nada aquí ya que el formulario reactivo maneja el valor
  }
  
  onDirectorChange(): void {
    // No necesitamos hacer nada aquí ya que el formulario reactivo maneja el valor
  }
  
  onVocalChange(): void {
    const vocalNombre = this.defensaForm.get('vocalTribunal')?.value;
    const vocal = this.profesores.find(p => `${p.nombre} ${p.apellidos}` === vocalNombre);
    if (vocal) {
      this.especialidadesVocal = ESPECIALIDAD_OPTIONS[vocal.tipoEspecialidad] || [];
      this.selectedVocalEspecialidades = [];
      this.defensaForm.patchValue({
        especialidadesVocal: []
      });
    }
  }
  
  onSuplenteChange(): void {
    const suplenteNombre = this.defensaForm.get('suplente')?.value;
    const suplente = this.profesores.find(p => `${p.nombre} ${p.apellidos}` === suplenteNombre);
    if (suplente) {
      this.especialidadesSuplente = ESPECIALIDAD_OPTIONS[suplente.tipoEspecialidad] || [];
      this.selectedSuplenteEspecialidades = [];
      this.defensaForm.patchValue({
        especialidadesSuplente: []
      });
    }
  }
  
  onVocalEspecialidadChange(event: any): void {
    const value = event.source.value;
    if (event.checked) {
      if (!this.selectedVocalEspecialidades.includes(value)) {
        this.selectedVocalEspecialidades.push(value);
      }
    } else {
      this.selectedVocalEspecialidades = this.selectedVocalEspecialidades.filter(v => v !== value);
    }
    this.defensaForm.patchValue({
      especialidadesVocal: this.selectedVocalEspecialidades
    });
  }
  
  onSuplenteEspecialidadChange(event: any): void {
    const value = event.source.value;
    if (event.checked) {
      if (!this.selectedSuplenteEspecialidades.includes(value)) {
        this.selectedSuplenteEspecialidades.push(value);
      }
    } else {
      this.selectedSuplenteEspecialidades = this.selectedSuplenteEspecialidades.filter(v => v !== value);
    }
    this.defensaForm.patchValue({
      especialidadesSuplente: this.selectedSuplenteEspecialidades
    });
  }
  
  
  createDefensa(): void {
    if (this.defensaForm.invalid) {
      this.defensaForm.markAllAsTouched();
      this.snackBar.open(
        this.translationService.getTranslation('defensas.error.required'),
        this.translationService.getTranslation('common.close'),
        { duration: 3000 }
      );
      return;
    }
    
    this.isLoading.set(true);
    
    const formValue = this.defensaForm.value;
    const createRequest: CreateDefensaRequest = {
      curso: formValue.curso,
      especialidad: formValue.especialidad,
      titulo: formValue.titulo,
      estudiante: this.estudiantes.find(e => e.nombreCompleto === formValue.estudiante)!,
      directorTribunal: this.profesores.find(p => `${p.nombre} ${p.apellidos}` === formValue.directorTribunal)!,
      vocalTribunal: this.profesores.find(p => `${p.nombre} ${p.apellidos}` === formValue.vocalTribunal)!,
      suplente: this.profesores.find(p => `${p.nombre} ${p.apellidos}` === formValue.suplente)!,
      comentariosDireccion: formValue.comentariosDireccion,
      especialidadesVocal: formValue.especialidadesVocal,
      especialidadesSuplente: formValue.especialidadesSuplente
    };
    
    this.defensasService.createDefensa(createRequest).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.snackBar.open(
            this.translationService.getTranslation('defensas.success.created'),
            this.translationService.getTranslation('common.close'),
            { duration: 3000 }
          );
          this.resetForm();
        } else {
          this.snackBar.open(
            response.message || this.translationService.getTranslation('defensas.error.create'),
            this.translationService.getTranslation('common.close'),
            { duration: 3000 }
          );
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.snackBar.open(
          `Error: ${error.message}`,
          this.translationService.getTranslation('common.close'),
          { duration: 3000 }
        );
        console.error('Error creating defensa:', error);
      }
    });
  }
  
  
  private resetForm(): void {
    this.defensaForm.reset({
      curso: `${this.currentYear}-${this.nextYear}`,
      especialidad: TipoEspecialidad.INGENIERIA_COMPUTACION,
      titulo: '',
      estudiante: '',
      directorTribunal: '',
      vocalTribunal: '',
      suplente: '',
      comentariosDireccion: '',
      especialidadesVocal: [],
      especialidadesSuplente: []
    });
    
    this.selectedEstudiante = '';
    this.selectedDirector = '';
    this.selectedVocal = '';
    this.selectedSuplente = '';
    this.selectedVocalEspecialidades = [];
    this.selectedSuplenteEspecialidades = [];
    this.especialidadesVocal = [];
    this.especialidadesSuplente = [];
  }
}
