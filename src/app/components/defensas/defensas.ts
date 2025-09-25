import { Component, inject, signal, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { Subscription } from 'rxjs';
import jsPDF from 'jspdf';
import { DefensasService } from '../../services/defensas.service';
import { ExcelService } from '../../services/excel.service';
import { ProfesoresService } from '../../services/profesores.service';
import { TranslationService } from '../../services/translation.service';
import { Defensa, CreateDefensaRequest, TipoEspecialidad, TipoGrado, Profesor, EstudianteDisplay } from '../../models/defensa.model';
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
export class DefensasComponent implements OnInit, OnDestroy {
  private defensasService = inject(DefensasService);
  private excelService = inject(ExcelService);
  private profesoresService = inject(ProfesoresService);
  private translationService = inject(TranslationService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  
  private translationsSubscription?: Subscription;
  private languageSubscription?: Subscription;
  
  isLoading = signal(false);
  isExporting = signal(false);
  private logoDataUrlCache: string | null = null;
  
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
  filteredDirectores: Profesor[] = [];
  filteredCodirectores: Profesor[] = [];
  filteredVocales: Profesor[] = [];
  filteredSuplentes: Profesor[] = [];
  
  // Opciones de grados
  grados = [
    { value: TipoGrado.INGENIERIA_INFORMATICA, label: 'Grado en Ingeniería Informática' },
    { value: TipoGrado.INTELIGENCIA_ARTIFICIAL, label: 'Grado en Inteligencia Artificial' }
  ];
  
  // Opciones de especialidades (solo para Ingeniería Informática)
  especialidades = [
    { value: TipoEspecialidad.INGENIERIA_SOFTWARE, label: 'Ing. Software' },
    { value: TipoEspecialidad.INGENIERIA_COMPUTACION, label: 'Ing. Comp.' },
    { value: TipoEspecialidad.COMPUTACION, label: 'Computación' }
  ];
  
  // Áreas de conocimiento fijas para Inteligencia Artificial
  areasConocimientoIA = [
    { id: 'nlp', label: 'Lengoai naturalaren prozesamendua / Procesado de lenguaje natural' },
    { id: 'robotics', label: 'Robotika / Robótica' },
    { id: 'ml', label: 'Ikasketa automatikoa / Aprendizaje automático' },
    { id: 'data_analysis', label: 'Datu analisi eta bistaraketa / Análisis y visualización de datos' },
    { id: 'computer_vision', label: 'Ikusmen artifiziala / Visión artificial' },
    { id: 'optimization', label: 'Optimizazioa // Optimización' },
    { id: 'big_data', label: 'Big Data (Datuen kudeaketa / Gestión de datos)' },
    { id: 'ai_systems', label: 'AAko Sistemen garapena // Desarrollo de sistemas de IA' },
    { id: 'ai_infrastructure', label: 'AArako azpiegiturak / Infraestructuras para IA' },
    { id: 'quantum', label: 'Quantum Computing (Konputazio kuantikoa / Computación cuántica)' }
  ];
  
  // Selecciones del formulario
  selectedEstudiante: string = '';
  selectedDirector: string = '';
  selectedCodirector: string = '';
  selectedVocal: string = '';
  selectedSuplente: string = '';
  
  // Control de visibilidad
  mostrarEspecialidades = false;
  
  // Especialidades para checkboxes
  especialidadesVocal: any[] = [];
  especialidadesSuplente: any[] = [];
  selectedVocalEspecialidades: string[] = [];
  selectedSuplenteEspecialidades: string[] = [];
  
  
  ngOnInit(): void {
    console.log('DefensasComponent ngOnInit - Current language:', this.translationService.getCurrentLanguage());
    
    // Suscribirse a cambios de traducciones
    this.translationsSubscription = this.translationService.getTranslations().subscribe((translations) => {
      console.log('DefensasComponent - Translations loaded:', translations);
      this.cdr.markForCheck();
    });
    
    // Suscribirse a cambios de idioma
    this.languageSubscription = this.translationService.getLanguageChanges().subscribe(() => {
      console.log('DefensasComponent - Language changed');
      this.cdr.markForCheck();
    });
    
    // Asegurar que las traducciones estén cargadas
    if (!this.translationService.areTranslationsLoaded()) {
      console.log('DefensasComponent - Forcing translation load');
      this.translationService.setLanguage(this.translationService.getCurrentLanguage());
    }
    
    this.initializeForm();
    this.setupAutocomplete();
    this.loadEstudiantes();
    this.loadProfesores();
    
    // Configurar visibilidad inicial de especialidades
    this.mostrarEspecialidades = true; // Por defecto mostrar especialidades (GII)
  }
  
  ngOnDestroy(): void {
    if (this.translationsSubscription) {
      this.translationsSubscription.unsubscribe();
    }
    if (this.languageSubscription) {
      this.languageSubscription.unsubscribe();
    }
  }
  
  private setupAutocomplete(): void {
    // Configurar autocomplete para estudiantes
    this.defensaForm.get('estudiante')?.valueChanges.pipe(
      startWith(''),
      map(value => this.filterEstudiantes(value))
    ).subscribe(filtered => {
      console.log('DefensasComponent: Autocomplete - filteredEstudiantes actualizado:', filtered);
      this.filteredEstudiantes = filtered;
    });
    
    // Configurar autocomplete para director
    this.defensaForm.get('directorTribunal')?.valueChanges.pipe(
      startWith(''),
      map(value => this.filterProfesores(value))
    ).subscribe(filtered => {
      this.filteredDirectores = filtered;
    });
    
    // Configurar autocomplete para codirector
    this.defensaForm.get('codirectorTribunal')?.valueChanges.pipe(
      startWith(''),
      map(value => this.filterProfesores(value))
    ).subscribe(filtered => {
      this.filteredCodirectores = filtered;
    });
    
    // Configurar autocomplete para vocal
    this.defensaForm.get('vocalTribunal')?.valueChanges.pipe(
      startWith(''),
      map(value => this.filterProfesores(value))
    ).subscribe(filtered => {
      this.filteredVocales = filtered;
    });
    
    // Configurar autocomplete para suplente
    this.defensaForm.get('suplente')?.valueChanges.pipe(
      startWith(''),
      map(value => this.filterProfesores(value))
    ).subscribe(filtered => {
      this.filteredSuplentes = filtered;
    });
  }
  
  private filterEstudiantes(value: any): EstudianteDisplay[] {
    if (!value || typeof value !== 'string') {
      return this.estudiantes;
    }
    const filterValue = value.toLowerCase();
    return this.estudiantes.filter(estudiante => {
      const nombreCompleto = estudiante?.nombreCompleto || '';
      return nombreCompleto.toLowerCase().includes(filterValue);
    });
  }
  
  private filterProfesores(value: any): Profesor[] {
    if (!value || typeof value !== 'string') {
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
      grado: [TipoGrado.INGENIERIA_INFORMATICA, Validators.required],
      especialidad: [TipoEspecialidad.INGENIERIA_COMPUTACION], // Sin validador required aquí
      titulo: ['', [Validators.required, Validators.minLength(5)]],
      estudiante: [null, Validators.required], // Cambiar a null para objetos
      directorTribunal: ['', Validators.required],
      codirectorTribunal: [''], // Opcional
      vocalTribunal: ['', Validators.required],
      suplente: ['', Validators.required],
      comentariosDireccion: [''],
      especialidadesVocal: [[]],
      especialidadesSuplente: [[]]
    });
    
    // Configurar especialidades iniciales para GII
    this.mostrarEspecialidades = true;
    this.updateAreasConocimiento();
  }
  
  loadEstudiantes(): void {
    this.excelService.loadEstudiantes().subscribe({
      next: (estudiantes) => {
        this.estudiantes = estudiantes;
        this.filteredEstudiantes = [...estudiantes];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading estudiantes:', error);
        this.snackBar.open(
          'Error al cargar los estudiantes desde la base de datos',
          'Cerrar',
          { duration: 3000 }
        );
        // Cargar datos mock como fallback
        this.loadEstudiantesMock();
      }
    });
  }

  private loadEstudiantesMock(): void {
    // Datos de ejemplo como fallback
    this.estudiantes = [
      {
        nombreCompleto: 'Juan Pérez García',
        nombre: 'Juan',
        apellido1: 'Pérez',
        apellido2: 'García',
        email: 'juan.perez@estudiante.ehu.eus',
        dni: '12345678A',
        titulacion: 'Grado en Ingeniería Informática',
        asignatura: 'Trabajo Fin de Grado',
        creditosSup: 240,
        mediaExpediente: 8.5
      } as EstudianteDisplay,
      {
        nombreCompleto: 'María López Fernández',
        nombre: 'María',
        apellido1: 'López',
        apellido2: 'Fernández',
        email: 'maria.lopez@estudiante.ehu.eus',
        dni: '87654321B',
        titulacion: 'Grado en Inteligencia Artificial',
        asignatura: 'Trabajo Fin de Grado',
        creditosSup: 240,
        mediaExpediente: 9.2
      } as EstudianteDisplay,
      {
        nombreCompleto: 'Carlos Ruiz Martínez',
        nombre: 'Carlos',
        apellido1: 'Ruiz',
        apellido2: 'Martínez',
        email: 'carlos.ruiz@estudiante.ehu.eus',
        dni: '11223344C',
        titulacion: 'Grado en Ingeniería Informática',
        asignatura: 'Trabajo Fin de Grado',
        creditosSup: 240,
        mediaExpediente: 7.8
      } as EstudianteDisplay
    ];
    this.filteredEstudiantes = [...this.estudiantes];
    this.cdr.detectChanges();
  }
  
  loadProfesores(): void {
    this.profesoresService.getProfesores().subscribe({
      next: (profesores) => {
        this.profesores = profesores;
        this.filteredDirectores = [...profesores];
        this.filteredCodirectores = [...profesores];
        this.filteredVocales = [...profesores];
        this.filteredSuplentes = [...profesores];
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
  
  onGradoChange(): void {
    const grado = this.defensaForm.get('grado')?.value as TipoGrado;
    const especialidadControl = this.defensaForm.get('especialidad');
    
    // Solo mostrar especialidades si es Ingeniería Informática
    this.mostrarEspecialidades = grado === TipoGrado.INGENIERIA_INFORMATICA;
    
    if (grado === TipoGrado.INTELIGENCIA_ARTIFICIAL) {
      // Para IA: quitar validador required para especialidad
      especialidadControl?.clearValidators();
      especialidadControl?.updateValueAndValidity();
      
      this.defensaForm.patchValue({
        especialidad: null
      });
      
      // Actualizar áreas de conocimiento para IA
      this.updateAreasConocimiento();
    } else if (grado === TipoGrado.INGENIERIA_INFORMATICA) {
      // Para Informática: agregar validador required y establecer especialidad por defecto
      especialidadControl?.setValidators([Validators.required]);
      especialidadControl?.updateValueAndValidity();
      
      this.defensaForm.patchValue({
        especialidad: TipoEspecialidad.INGENIERIA_COMPUTACION
      });
      
      // Actualizar áreas de conocimiento para GII
      this.updateAreasConocimiento();
    }
  }

  onEspecialidadChange(): void {
    // Actualizar las áreas de conocimiento según la especialidad elegida
    this.updateAreasConocimiento();
  }
  
  onEstudianteFieldClick(): void {
    // Inicializar la lista filtrada con todos los estudiantes
    this.filteredEstudiantes = [...this.estudiantes];
    this.cdr.detectChanges();
  }
  
  onDirectorFieldClick(): void {
    // Inicializar la lista filtrada con todos los profesores
    this.filteredDirectores = [...this.profesores];
  }
  
  onCodirectorFieldClick(): void {
    // Inicializar la lista filtrada con todos los profesores
    this.filteredCodirectores = [...this.profesores];
  }
  
  onVocalFieldClick(): void {
    // Inicializar la lista filtrada con todos los profesores
    this.filteredVocales = [...this.profesores];
  }
  
  onSuplenteFieldClick(): void {
    // Inicializar la lista filtrada con todos los profesores
    this.filteredSuplentes = [...this.profesores];
  }
  
  onEstudianteChange(): void {
    // No necesitamos hacer nada aquí ya que el formulario reactivo maneja el valor
  }

  // Función para mostrar el nombre completo del estudiante en el autocomplete
  displayEstudianteFn(estudiante: EstudianteDisplay): string {
    return estudiante && estudiante.nombreCompleto ? estudiante.nombreCompleto : '';
  }

  // Función trackBy para optimizar el rendimiento del *ngFor
  trackByEstudiante(index: number, estudiante: EstudianteDisplay): string {
    return (estudiante as any)?.dni || estudiante?.nombreCompleto || index.toString();
  }
  
  onDirectorChange(): void {
    // No necesitamos hacer nada aquí ya que el formulario reactivo maneja el valor
  }

  onCodirectorChange(): void {
    // No necesitamos hacer nada aquí ya que el formulario reactivo maneja el valor
  }
  
  onVocalChange(): void {
    // Las áreas de conocimiento del vocal se determinan por el grado y especialidad, no por el profesor
    this.updateAreasConocimiento();
  }
  
  onSuplenteChange(): void {
    // Las áreas de conocimiento del suplente se determinan por el grado y especialidad, no por el profesor
    this.updateAreasConocimiento();
  }
  
  private updateAreasConocimiento(): void {
    const grado = this.defensaForm.get('grado')?.value as TipoGrado;
    const especialidad = this.defensaForm.get('especialidad')?.value as TipoEspecialidad;
    
    if (grado === TipoGrado.INTELIGENCIA_ARTIFICIAL) {
      // Para IA: siempre las mismas áreas de conocimiento
      this.especialidadesVocal = this.areasConocimientoIA;
      this.especialidadesSuplente = this.areasConocimientoIA;
    } else if (grado === TipoGrado.INGENIERIA_INFORMATICA && especialidad) {
      // Para GII: áreas según la especialidad elegida
      this.especialidadesVocal = ESPECIALIDAD_OPTIONS[especialidad] || [];
      this.especialidadesSuplente = ESPECIALIDAD_OPTIONS[especialidad] || [];
    }
    
    // Limpiar selecciones previas
    this.selectedVocalEspecialidades = [];
    this.selectedSuplenteEspecialidades = [];
    this.defensaForm.patchValue({
      especialidadesVocal: [],
      especialidadesSuplente: []
    });
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
    
    // Convertir IDs a objetos completos para el formulario
    const especialidadesCompletas = this.selectedVocalEspecialidades.map(id => 
      this.especialidadesVocal.find(esp => esp.id === id) || { id, label: id }
    );
    
    this.defensaForm.patchValue({
      especialidadesVocal: especialidadesCompletas
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
    
    // Convertir IDs a objetos completos para el formulario
    const especialidadesCompletas = this.selectedSuplenteEspecialidades.map(id => 
      this.especialidadesSuplente.find(esp => esp.id === id) || { id, label: id }
    );
    
    this.defensaForm.patchValue({
      especialidadesSuplente: especialidadesCompletas
    });
  }
  
  
  createDefensa(): void {
    // Validación especial para especialidad solo si es GII
    const grado = this.defensaForm.get('grado')?.value;
    const especialidad = this.defensaForm.get('especialidad')?.value;
    
    if (grado === TipoGrado.INGENIERIA_INFORMATICA && !especialidad) {
      this.defensaForm.get('especialidad')?.setErrors({ required: true });
    }
    
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
      grado: formValue.grado,
      especialidad: formValue.especialidad,
      titulo: formValue.titulo,
      estudiante: formValue.estudiante, // Ahora es el objeto completo
      directorTribunal: this.profesores.find(p => `${p.nombre} ${p.apellidos}` === formValue.directorTribunal)!,
      codirectorTribunal: formValue.codirectorTribunal ? this.profesores.find(p => `${p.nombre} ${p.apellidos}` === formValue.codirectorTribunal) : undefined,
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
      grado: TipoGrado.INGENIERIA_INFORMATICA,
      especialidad: TipoEspecialidad.INGENIERIA_COMPUTACION,
      titulo: '',
      estudiante: null, // Cambiar a null para objetos
      directorTribunal: '',
      codirectorTribunal: '',
      vocalTribunal: '',
      suplente: '',
      comentariosDireccion: '',
      especialidadesVocal: [],
      especialidadesSuplente: []
    });
    
    // Restaurar validador required para especialidad (GII por defecto)
    const especialidadControl = this.defensaForm.get('especialidad');
    especialidadControl?.setValidators([Validators.required]);
    especialidadControl?.updateValueAndValidity();
    
    this.selectedEstudiante = '';
    this.selectedDirector = '';
    this.selectedCodirector = '';
    this.selectedVocal = '';
    this.selectedSuplente = '';
    this.selectedVocalEspecialidades = [];
    this.selectedSuplenteEspecialidades = [];
    
    // Inicializar listas filtradas con todos los datos
    this.filteredEstudiantes = [...this.estudiantes];
    this.filteredDirectores = [...this.profesores];
    this.filteredCodirectores = [...this.profesores];
    this.filteredVocales = [...this.profesores];
    this.filteredSuplentes = [...this.profesores];
    
    // Restaurar configuración inicial para GII
    this.mostrarEspecialidades = true;
    this.updateAreasConocimiento();
  }
  
  async exportToPDF(): Promise<void> {
    this.isExporting.set(true);
    
    try {
      if (this.defensaForm.invalid) {
        this.defensaForm.markAllAsTouched();
        this.snackBar.open(
          this.translationService.getTranslation('defensas.error.required'),
          this.translationService.getTranslation('common.close'),
          { duration: 3000 }
        );
        this.isExporting.set(false);
        return;
      }
      
      const formValue = this.defensaForm.value;
      console.log('Form values for PDF:', formValue);
      
      const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
      
      // Configuración del PDF
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 40;
      const maxY = pageHeight - margin;
      let yPosition = margin;

      // Obtener logo como DataURL para evitar problemas de CORS/blob
      const getLogoDataUrl = async (): Promise<string | null> => {
        if (this.logoDataUrlCache) return this.logoDataUrlCache;
        try {
          const resp = await fetch('/assets/img/logo_pdf.png');
          if (!resp.ok) return null;
          const blob = await resp.blob();
          const reader = new FileReader();
          const dataUrl: string = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          this.logoDataUrlCache = dataUrl;
          return dataUrl;
        } catch (e) {
          console.warn('No se pudo cargar el logo como DataURL', e);
          return null;
        }
      };

      const logoDataUrl = await getLogoDataUrl();

      const drawHeader = () => {
        const pw = pdf.internal.pageSize.getWidth();
        const lh = 60;
        if (logoDataUrl) {
          const lw = 180; // ancho fijo para consistencia visual
          const lx = (pw - lw) / 2;
          pdf.addImage(logoDataUrl, 'PNG', lx, margin - 10, lw, lh);
          yPosition = margin + lh + 10;
        } else {
          yPosition = margin + 40;
        }
        pdf.setLineWidth(0.5);
        pdf.line(margin, yPosition, pw - margin, yPosition);
        yPosition += 20;
      };

      const checkPageBreak = (requiredSpace: number = 20) => {
        const currentMaxY = pdf.internal.pageSize.getHeight() - margin;
        if (yPosition + requiredSpace > currentMaxY) {
          pdf.addPage();
          yPosition = margin;
          drawHeader();
          return true;
        }
        return false;
      };

      // Encabezado inicial
      drawHeader();
      
      // Continuar con el resto del PDF
      this.generatePDFWithTextHeader(pdf, formValue, yPosition, pageWidth, maxY, margin, checkPageBreak);
      
      // Guardar el PDF
      const estudianteText = formValue.estudiante ? 
        (formValue.estudiante.nombreCompleto || `${formValue.estudiante.nombre} ${formValue.estudiante.apellido1}`).replace(/\s+/g, '_') : 
        'estudiante';
      const fileName = `defensa_${formValue.curso}_${estudianteText}.pdf`;
      pdf.save(fileName);
      
      this.snackBar.open(
        'PDF exportado exitosamente',
        'Cerrar',
        { duration: 3000 }
      );
    } catch (e) {
      console.error('Error exportando PDF', e);
      this.snackBar.open('Error exportando PDF', 'Cerrar', { duration: 3000 });
    } finally {
      this.isExporting.set(false);
    }
  }
  
  private generatePDFWithTextHeader(pdf: jsPDF, formValue: any, yPosition: number, pageWidth: number, maxY: number, margin: number, checkPageBreak: Function): void {
    // Logo/Imagen superior (simulado con texto)
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('UNIVERSIDAD DEL PAÍS VASCO', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('EUSKAL HERRIKO UNIBERTSITATEA', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;
    
    pdf.setFontSize(10);
    pdf.text('Escuela de Ingeniería de Gipuzkoa', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 25;
    
    this.continuePDFGeneration(pdf, formValue, yPosition, pageWidth, maxY, margin, checkPageBreak);
  }
  
  private continuePDFGeneration(pdf: jsPDF, formValue: any, yPosition: number, pageWidth: number, maxY: number, margin: number, checkPageBreak: Function): void {
    
    // Cabecera ya dibujada en cada página
    yPosition += 0;

    // Helper para escribir líneas envueltas con saltos de página seguros
    const writeWrappedLines = (lines: string[], x: number, lineHeight: number = 16) => {
      for (const line of lines) {
        checkPageBreak(lineHeight);
        pdf.text(line, x, yPosition);
        yPosition += lineHeight;
      }
    };
    
    // Título del documento según el grado
    checkPageBreak(70);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    
    const grado = formValue.grado;
    let title = '';
    let subtitle = '';
    
    if (grado === TipoGrado.INGENIERIA_INFORMATICA) {
      title = 'Informatika Ingeniaritzako Gradua / Grado en Ingeniería Informática';
      subtitle = 'Lanaren defentsa-oniritzia / VºBº a la defensa del trabajo';
    } else if (grado === TipoGrado.INTELIGENCIA_ARTIFICIAL) {
      title = 'Adimen Artifizialeko Gradua / Grado en Inteligencia Artificial';
      subtitle = 'Lanaren defentsa-oniritzia / VºBº a la defensa del trabajo';
    } else {
      // Fallback por si no hay grado seleccionado
      title = this.translationService.getTranslation('defensas.pdf.title') || 'ACTA DE TRIBUNAL DE DEFENSA DE TRABAJO FIN DE GRADO';
    }
    
    // Título principal
    const titleLines = pdf.splitTextToSize(title, pageWidth - 2 * margin);
    pdf.text(titleLines, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += titleLines.length * 16 + 15;
    
    // Subtítulo (solo si hay grado seleccionado)
    if (subtitle) {
      checkPageBreak(35);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const subtitleLines = pdf.splitTextToSize(subtitle, pageWidth - 2 * margin);
      pdf.text(subtitleLines, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += subtitleLines.length * 12 + 20;
    }
    
    // Información del curso
    checkPageBreak(35);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${this.translationService.getTranslation('defensas.pdf.academicYear') || 'Curso Académico'}: ${formValue.curso}`, margin, yPosition);
    yPosition += 28;
    
    // Información de la especialidad (solo si es GII)
    if (formValue.grado === TipoGrado.INGENIERIA_INFORMATICA && formValue.especialidad) {
      checkPageBreak(25);
      pdf.setFontSize(11);
      const especialidadText = this.getEspecialidadText(formValue.especialidad);
      pdf.text(`${this.translationService.getTranslation('defensas.pdf.specialty') || 'Especialidad'}: ${especialidadText}`, margin, yPosition);
      yPosition += 25;
    }
    
    // Título del trabajo
    checkPageBreak(60);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${this.translationService.getTranslation('defensas.pdf.workTitle') || 'TÍTULO DEL TRABAJO:'}`, margin, yPosition);
    yPosition += 16;
    pdf.setFont('helvetica', 'normal');
    const tituloLines = pdf.splitTextToSize(formValue.titulo, pageWidth - 2 * margin);
    writeWrappedLines(tituloLines, margin, 18);
    yPosition += 4;
    
    // Información del estudiante
    checkPageBreak(25);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${this.translationService.getTranslation('defensas.pdf.student') || 'ESTUDIANTE:'}`, margin, yPosition);
    yPosition += 14;
    pdf.setFont('helvetica', 'normal');
    const estudianteText = formValue.estudiante ? formValue.estudiante.nombreCompleto || `${formValue.estudiante.nombre} ${formValue.estudiante.apellido1} ${formValue.estudiante.apellido2}`.trim() : 'No especificado';
    pdf.text(estudianteText, margin, yPosition);
    yPosition += 26;
    
    // Información del tribunal
    checkPageBreak(60);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${this.translationService.getTranslation('defensas.pdf.committee') || 'COMPOSICIÓN DEL TRIBUNAL:'}`, margin, yPosition);
    yPosition += 16;
    
    checkPageBreak(30);
    pdf.setFont('helvetica', 'normal');
    writeWrappedLines(pdf.splitTextToSize(`${this.translationService.getTranslation('defensas.pdf.director') || 'Director del Tribunal'}: ${formValue.directorTribunal}`, pageWidth - 2 * margin), margin, 16);
    
    // Co-director (solo si está seleccionado)
    if (formValue.codirectorTribunal) {
      checkPageBreak(25);
      writeWrappedLines(pdf.splitTextToSize(`Co-director del Tribunal: ${formValue.codirectorTribunal}`, pageWidth - 2 * margin), margin, 16);
    }
    
    checkPageBreak(25);
    writeWrappedLines(pdf.splitTextToSize(`${this.translationService.getTranslation('defensas.pdf.vocal') || 'Vocal del Tribunal'}: ${formValue.vocalTribunal}`, pageWidth - 2 * margin), margin, 16);
    
    checkPageBreak(25);
    writeWrappedLines(pdf.splitTextToSize(`${this.translationService.getTranslation('defensas.pdf.supplement') || 'Suplente'}: ${formValue.suplente}`, pageWidth - 2 * margin), margin, 16);
    yPosition += 10;
    
    
    // Áreas de conocimiento del vocal (para ambos grados si hay especialidades)
    if (formValue.especialidadesVocal && formValue.especialidadesVocal.length > 0) {
      checkPageBreak(50);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Áreas de conocimiento del vocal:', margin, yPosition);
      yPosition += 16;
      
      pdf.setFont('helvetica', 'normal');
      formValue.especialidadesVocal.forEach((especialidad: any) => {
        const especialidadText = typeof especialidad === 'string' ? especialidad : especialidad.label || especialidad;
        const lines = pdf.splitTextToSize(`• ${especialidadText}`, pageWidth - 2 * margin - 10);
        lines.forEach((line: string) => { checkPageBreak(16); pdf.text(line, margin + 10, yPosition); yPosition += 16; });
      });
      yPosition += 12;
    }
    
    // Áreas de conocimiento del suplente (para ambos grados si hay especialidades)
    if (formValue.especialidadesSuplente && formValue.especialidadesSuplente.length > 0) {
      checkPageBreak(50);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Áreas de conocimiento del suplente:', margin, yPosition);
      yPosition += 16;
      
      pdf.setFont('helvetica', 'normal');
      formValue.especialidadesSuplente.forEach((especialidad: any) => {
        const especialidadText = typeof especialidad === 'string' ? especialidad : especialidad.label || especialidad;
        const lines = pdf.splitTextToSize(`• ${especialidadText}`, pageWidth - 2 * margin - 10);
        lines.forEach((line: string) => { checkPageBreak(16); pdf.text(line, margin + 10, yPosition); yPosition += 16; });
      });
      yPosition += 12;
    }
    
    // Comentarios de la dirección (si hay)
    if (formValue.comentariosDireccion) {
      checkPageBreak(60);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${this.translationService.getTranslation('defensas.pdf.directionComments') || 'COMENTARIOS DE LA DIRECCIÓN:'}`, margin, yPosition);
      yPosition += 16;
      
      pdf.setFont('helvetica', 'normal');
      const comments = formValue.comentariosDireccion;
      const splitComments = pdf.splitTextToSize(comments, pageWidth - 2 * margin);
      writeWrappedLines(splitComments, margin, 18);
      yPosition += 8;
    }
    
    // Información adicional del acta
    checkPageBreak(60);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${this.translationService.getTranslation('defensas.pdf.recordInfo') || 'INFORMACIÓN DEL ACTA:'}`, margin, yPosition);
    yPosition += 18;
    
    checkPageBreak(35);
    pdf.setFont('helvetica', 'normal');
    writeWrappedLines(pdf.splitTextToSize(`• ${this.translationService.getTranslation('defensas.pdf.recordPoint1') || 'Este acta certifica la composición del tribunal para la defensa del trabajo'}`, pageWidth - 2 * margin), margin, 16);
    
    checkPageBreak(30);
    writeWrappedLines(pdf.splitTextToSize(`• ${this.translationService.getTranslation('defensas.pdf.recordPoint2') || 'El tribunal se compromete a seguir las normativas académicas vigentes'}`, pageWidth - 2 * margin), margin, 16);
    
    checkPageBreak(30);
    writeWrappedLines(pdf.splitTextToSize(`• ${this.translationService.getTranslation('defensas.pdf.recordPoint3') || 'La evaluación se realizará según los criterios establecidos por la universidad'}`, pageWidth - 2 * margin), margin, 16);
    yPosition += 8;
    
    // Firma - Asegurar que hay espacio suficiente
    checkPageBreak(140);
    
    // Línea separadora antes de las firmas
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 20;
    
    checkPageBreak(40);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${this.translationService.getTranslation('defensas.pdf.signatures') || 'FIRMAS:'}`, margin, yPosition);
    yPosition += 20;
    
    checkPageBreak(40);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${this.translationService.getTranslation('defensas.pdf.director') || 'Director del Tribunal'}:`, margin, yPosition);
    pdf.text(`${this.translationService.getTranslation('defensas.pdf.vocal') || 'Vocal del Tribunal'}:`, pageWidth / 2, yPosition);
    yPosition += 24;
    
    checkPageBreak(30);
    pdf.text('_________________', margin, yPosition);
    pdf.text('_________________', pageWidth / 2, yPosition);
    yPosition += 16;
    
    checkPageBreak(30);
    pdf.text(formValue.directorTribunal, margin, yPosition);
    pdf.text(formValue.vocalTribunal, pageWidth / 2, yPosition);
    yPosition += 20;
    
    // Fecha eliminada según petición
    
    // Guardado y snackbar movidos al try/finally del método
  }
  
  private getEspecialidadText(especialidad: TipoEspecialidad): string {
    const especialidadMap: { [key in TipoEspecialidad]: string } = {
      [TipoEspecialidad.INGENIERIA_COMPUTACION]: 'Ingeniería en Computación',
      [TipoEspecialidad.INGENIERIA_SOFTWARE]: 'Ingeniería del Software',
      [TipoEspecialidad.COMPUTACION]: 'Computación'
    };
    return especialidadMap[especialidad] || especialidad;
  }
}
