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
import { GoogleTranslateService } from '../../services/google-translate.service';
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
  private googleTranslateService = inject(GoogleTranslateService);
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
  
  // Opciones de idiomas
  idiomas = [
    { value: 'es', label: 'Español' },
    { value: 'eu', label: 'Euskera' },
    { value: 'en', label: 'English' }
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
    // Suscribirse a cambios de traducciones
    this.translationsSubscription = this.translationService.getTranslations().subscribe((translations) => {
      this.cdr.markForCheck();
    });
    
    // Suscribirse a cambios de idioma
    this.languageSubscription = this.translationService.getLanguageChanges().subscribe(() => {
      this.cdr.markForCheck();
    });
    
    // Asegurar que las traducciones estén cargadas
    if (!this.translationService.areTranslationsLoaded()) {
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
    // Primero filtrar por grado seleccionado
    const gradoSeleccionado = this.defensaForm.get('grado')?.value as TipoGrado;
    let estudiantesFiltradosPorGrado = this.estudiantes;
    
    if (gradoSeleccionado) {
      estudiantesFiltradosPorGrado = this.estudiantes.filter(estudiante => {
        const titulacion = (estudiante as any)?.titulacion || '';
        if (gradoSeleccionado === TipoGrado.INGENIERIA_INFORMATICA) {
          return titulacion.toLowerCase().includes('ingeniería informática') || 
                 titulacion.toLowerCase().includes('ingenieria informatica');
        } else if (gradoSeleccionado === TipoGrado.INTELIGENCIA_ARTIFICIAL) {
          return titulacion.toLowerCase().includes('inteligencia artificial');
        }
        return true;
      });
    }
    
    // Luego filtrar por texto de búsqueda
    if (!value || typeof value !== 'string') {
      return estudiantesFiltradosPorGrado;
    }
    const filterValue = value.toLowerCase();
    return estudiantesFiltradosPorGrado.filter(estudiante => {
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
      grado: ['', Validators.required], // Sin valor por defecto
      especialidad: ['', Validators.required], // Sin valor por defecto - usuario debe seleccionar
      titulo: ['', Validators.required],
      idioma: ['', Validators.required], // Sin valor por defecto
      estudiante: [null, Validators.required], // Cambiar a null para objetos
      directorTribunal: ['', Validators.required],
      codirectorTribunal: [''], // Opcional
      vocalTribunal: [''], // Opcional
      suplente: [''], // Opcional
      comentariosDireccion: [''],
      especialidadesVocal: [[]],
      especialidadesSuplente: [[]]
    });
    
    // No mostrar especialidades inicialmente - solo cuando se seleccione GII
    this.mostrarEspecialidades = false;
    this.updateAreasConocimiento();
    this.updateEstudiantesFiltrados();
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
        id: 1,
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
        id: 2,
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
        id: 3,
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
        especialidad: null,
        estudiante: null // Limpiar estudiante seleccionado
      });
      
      // Actualizar áreas de conocimiento solo si hay vocal o suplente
      this.updateAreasConocimiento();
    } else if (grado === TipoGrado.INGENIERIA_INFORMATICA) {
      // Para Informática: agregar validador required pero sin establecer especialidad por defecto
      especialidadControl?.setValidators([Validators.required]);
      especialidadControl?.updateValueAndValidity();
      
      this.defensaForm.patchValue({
        especialidad: null, // Sin valor por defecto - el usuario debe seleccionar
        estudiante: null // Limpiar estudiante seleccionado
      });
      
      // Actualizar áreas de conocimiento solo si hay vocal o suplente
      this.updateAreasConocimiento();
    }
    
    // Actualizar la lista de estudiantes filtrados según el grado
    this.updateEstudiantesFiltrados();
  }

  onEspecialidadChange(): void {
    // Actualizar las áreas de conocimiento solo si hay vocal o suplente seleccionado
    this.updateAreasConocimiento();
  }
  
  onEstudianteFieldClick(): void {
    // Actualizar la lista filtrada según el grado seleccionado
    this.updateEstudiantesFiltrados();
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
    const vocal = this.defensaForm.get('vocalTribunal')?.value;
    const suplente = this.defensaForm.get('suplente')?.value;
    
    // Solo actualizar áreas si hay vocal o suplente seleccionado
    if (!vocal && !suplente) {
      // Si no hay vocal ni suplente, limpiar las áreas
      this.especialidadesVocal = [];
      this.especialidadesSuplente = [];
      this.selectedVocalEspecialidades = [];
      this.selectedSuplenteEspecialidades = [];
      this.defensaForm.patchValue({
        especialidadesVocal: [],
        especialidadesSuplente: []
      });
      return;
    }
    
    // Si hay vocal o suplente, configurar las áreas según grado y especialidad
    if (grado === TipoGrado.INTELIGENCIA_ARTIFICIAL) {
      // Para IA: siempre las mismas áreas de conocimiento
      if (vocal) {
        this.especialidadesVocal = this.areasConocimientoIA;
      } else {
        this.especialidadesVocal = [];
      }
      
      if (suplente) {
        this.especialidadesSuplente = this.areasConocimientoIA;
      } else {
        this.especialidadesSuplente = [];
      }
    } else if (grado === TipoGrado.INGENIERIA_INFORMATICA && especialidad) {
      // Para GII: áreas según la especialidad elegida
      const areas = ESPECIALIDAD_OPTIONS[especialidad] || [];
      if (vocal) {
        this.especialidadesVocal = areas;
      } else {
        this.especialidadesVocal = [];
      }
      
      if (suplente) {
        this.especialidadesSuplente = areas;
      } else {
        this.especialidadesSuplente = [];
      }
    } else {
      // Si no hay grado o especialidad completa, limpiar
      this.especialidadesVocal = [];
      this.especialidadesSuplente = [];
    }
    
    // Limpiar selecciones previas solo si cambió la lista de áreas
    this.selectedVocalEspecialidades = [];
    this.selectedSuplenteEspecialidades = [];
    this.defensaForm.patchValue({
      especialidadesVocal: [],
      especialidadesSuplente: []
    });
  }
  
  private updateEstudiantesFiltrados(): void {
    // Obtener el valor actual del campo estudiante para mantener el filtro de texto
    const valorActualEstudiante = this.defensaForm.get('estudiante')?.value;
    const textoBusqueda = typeof valorActualEstudiante === 'string' ? valorActualEstudiante : '';
    
    // Aplicar el filtro completo (grado + texto)
    this.filteredEstudiantes = this.filterEstudiantes(textoBusqueda);
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
    
    // Mantener solo los IDs como strings para el formulario
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
    
    // Mantener solo los IDs como strings para el formulario
    this.defensaForm.patchValue({
      especialidadesSuplente: this.selectedSuplenteEspecialidades
    });
  }
  
  detectarIdioma(): void {
    const titulo = this.defensaForm.get('titulo')?.value || '';
    
    if (titulo.trim().length < 3) {
      return; // No detectar idioma si el título es muy corto
    }
    
    // Usar Google Translate API para detectar el idioma
    this.googleTranslateService.detectLanguage(titulo).subscribe({
      next: (idiomaDetectado) => {
        this.actualizarIdioma(idiomaDetectado);
      },
      error: (error) => {
        // Fallback a detección por palabras clave
        const idiomaFallback = this.detectarIdiomaPorPalabras(titulo);
        this.actualizarIdioma(idiomaFallback);
      }
    });
  }
  
  private detectarIdiomaPorPalabras(titulo: string): string {
    const texto = titulo.toLowerCase();
    
    // Palabras clave en inglés
    const palabrasIngles = [
      'good', 'morning', 'afternoon', 'evening', 'night', 'hello', 'hi', 'bye', 'thanks', 'thank you',
      'please', 'yes', 'no', 'the', 'and', 'or', 'but', 'with', 'for', 'from', 'to', 'in', 'on', 'at',
      'by', 'of', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'this', 'that',
      'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
      'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'hers', 'ours', 'theirs',
      'system', 'application', 'software', 'hardware', 'database', 'network', 'security', 'analysis',
      'design', 'development', 'implementation', 'testing', 'management', 'algorithm', 'data', 'information',
      'technology', 'computer', 'programming', 'code', 'function', 'method', 'class', 'object', 'variable',
      'array', 'string', 'integer', 'boolean', 'interface', 'abstract', 'static', 'public', 'private',
      'protected', 'final', 'abstract', 'extends', 'implements', 'import', 'package', 'return', 'if', 'else',
      'while', 'for', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw', 'throws'
    ];
    
    // Palabras clave en español
    const palabrasEspanol = [
      'buenos', 'días', 'tardes', 'noches', 'hola', 'adiós', 'gracias', 'por favor', 'sí', 'no',
      'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'en', 'con', 'por', 'para',
      'desde', 'hasta', 'sobre', 'bajo', 'entre', 'durante', 'antes', 'después', 'ahora', 'entonces',
      'es', 'son', 'era', 'eran', 'fue', 'fueron', 'será', 'serán', 'he', 'has', 'ha', 'han', 'había',
      'habías', 'había', 'habíamos', 'habíais', 'habían', 'habré', 'habrás', 'habrá', 'habremos',
      'habréis', 'habrán', 'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'aquel',
      'aquella', 'aquellos', 'aquellas', 'yo', 'tú', 'él', 'ella', 'nosotros', 'nosotras', 'vosotros',
      'vosotras', 'ellos', 'ellas', 'me', 'te', 'lo', 'la', 'nos', 'os', 'los', 'las', 'mi', 'tu',
      'su', 'nuestro', 'nuestra', 'vuestro', 'vuestra', 'suyo', 'suya', 'sistema', 'aplicación',
      'software', 'hardware', 'base', 'datos', 'red', 'seguridad', 'análisis', 'diseño', 'desarrollo',
      'implementación', 'pruebas', 'gestión', 'algoritmo', 'información', 'tecnología', 'computadora',
      'programación', 'código', 'función', 'método', 'clase', 'objeto', 'variable', 'arreglo', 'cadena',
      'entero', 'booleano', 'interfaz', 'abstracto', 'estático', 'público', 'privado', 'protegido',
      'final', 'extiende', 'implementa', 'importa', 'paquete', 'retorna', 'si', 'sino', 'mientras',
      'para', 'cambiar', 'caso', 'romper', 'continuar', 'intentar', 'capturar', 'finalmente', 'lanzar'
    ];
    
    // Palabras clave en euskera
    const palabrasEuskera = [
      'egun', 'on', 'arratsalde', 'on', 'gau', 'on', 'kaixo', 'agur', 'eskerrik', 'asko', 'mesedez',
      'bai', 'ez', 'eta', 'edo', 'baina', 'rekin', 'zergatik', 'nola', 'non', 'noiz', 'zein', 'zenbat',
      'da', 'dira', 'zen', 'ziren', 'izango', 'dira', 'dut', 'duzu', 'du', 'dute', 'dun', 'duzue',
      'nuen', 'zuen', 'zuen', 'genuen', 'zenuten', 'zuten', 'izango', 'dut', 'duzu', 'du', 'dute',
      'dun', 'duzue', 'dira', 'hau', 'hori', 'horiek', 'horiek', 'hura', 'hura', 'horiek', 'horiek',
      'ni', 'zu', 'hura', 'hura', 'gu', 'zuek', 'haiek', 'niri', 'zuri', 'hari', 'guri', 'zuei',
      'haiei', 'nire', 'zure', 'bere', 'gure', 'zuen', 'beren', 'sistema', 'aplikazioa', 'software',
      'hardware', 'datu', 'base', 'sarea', 'segurtasuna', 'analisia', 'diseinua', 'garapena',
      'inplementazioa', 'probak', 'kudeaketa', 'algoritmoa', 'datuak', 'informazioa', 'teknologia',
      'ordenagailua', 'programazioa', 'kodea', 'funtzioa', 'metodoa', 'klasea', 'objektua', 'aldagaia',
      'array', 'katea', 'osokoa', 'boolearra', 'interfazea', 'abstraktua', 'estatikoa', 'publikoa',
      'pribatua', 'babestua', 'finala', 'zabaltzen', 'inplementatzen', 'inportatzen', 'paketea',
      'itzultzen', 'bada', 'bestela', 'bitartean', 'aldaketa', 'kasua', 'hautsi', 'jarraitu', 'saiatu',
      'harrapatu', 'azkenean', 'bota'
    ];
    
    // Contar ocurrencias de cada idioma
    const contadorIngles = palabrasIngles.filter(palabra => texto.includes(palabra)).length;
    const contadorEspanol = palabrasEspanol.filter(palabra => texto.includes(palabra)).length;
    const contadorEuskera = palabrasEuskera.filter(palabra => texto.includes(palabra)).length;
    
    // Si hay al menos 2 palabras de un idioma, considerarlo detectado
    if (contadorIngles >= 2) return 'en';
    if (contadorEspanol >= 2) return 'es';
    if (contadorEuskera >= 2) return 'eu';
    
    return 'es'; // Por defecto español
  }
  
  
  private actualizarIdioma(idiomaDetectado: string): void {
    const idiomaActual = this.defensaForm.get('idioma')?.value;
    if (idiomaDetectado && idiomaDetectado !== idiomaActual) {
      this.defensaForm.patchValue({
        idioma: idiomaDetectado
      });
      this.cdr.detectChanges(); // Forzar detección de cambios
    }
  }
  
  /**
   * Determina si debe mostrar el error para el vocal
   * @returns true si debe mostrar el error
   */
  shouldShowVocalError(): boolean {
    const vocal = this.defensaForm.get('vocalTribunal')?.value;
    return !!(vocal && this.especialidadesVocal.length > 0 && this.selectedVocalEspecialidades.length === 0);
  }

  /**
   * Determina si debe mostrar el error para el suplente
   * @returns true si debe mostrar el error
   */
  shouldShowSuplenteError(): boolean {
    const suplente = this.defensaForm.get('suplente')?.value;
    return !!(suplente && this.especialidadesSuplente.length > 0 && this.selectedSuplenteEspecialidades.length === 0);
  }

  /**
   * Valida que se hayan seleccionado áreas de conocimiento cuando sea necesario
   * @returns true si la validación es correcta, false si hay errores
   */
  private validateAreasConocimiento(): boolean {
    const vocal = this.defensaForm.get('vocalTribunal')?.value;
    const suplente = this.defensaForm.get('suplente')?.value;
    
    // Si hay vocal y se muestran áreas de conocimiento, debe seleccionar al menos una
    if (vocal && this.especialidadesVocal.length > 0 && this.selectedVocalEspecialidades.length === 0) {
      this.snackBar.open(
        'Debe seleccionar al menos un área de conocimiento para el vocal',
        'Cerrar',
        { duration: 4000 }
      );
      return false;
    }
    
    // Si hay suplente y se muestran áreas de conocimiento, debe seleccionar al menos una
    if (suplente && this.especialidadesSuplente.length > 0 && this.selectedSuplenteEspecialidades.length === 0) {
      this.snackBar.open(
        'Debe seleccionar al menos un área de conocimiento para el suplente',
        'Cerrar',
        { duration: 4000 }
      );
      return false;
    }
    
    // Validación adicional: si se muestran áreas de conocimiento, debe haber al menos un vocal o suplente
    if (this.especialidadesVocal.length > 0 || this.especialidadesSuplente.length > 0) {
      if (!vocal && !suplente) {
        this.snackBar.open(
          'Debe seleccionar al menos un vocal o suplente cuando hay áreas de conocimiento disponibles',
          'Cerrar',
          { duration: 4000 }
        );
        return false;
      }
    }
    
    return true;
  }
  
  createDefensa(): void {
    // Validación especial para especialidad solo si es GII
    const grado = this.defensaForm.get('grado')?.value;
    const especialidad = this.defensaForm.get('especialidad')?.value;
    
    if (grado === TipoGrado.INGENIERIA_INFORMATICA && !especialidad) {
      this.defensaForm.get('especialidad')?.setErrors({ required: true });
    }
    
    // Validar áreas de conocimiento
    if (!this.validateAreasConocimiento()) {
      return;
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
      idioma: formValue.idioma,
      estudiante: formValue.estudiante, // Ahora es el objeto completo
      directorTribunal: this.profesores.find(p => `${p.nombre} ${p.apellidos}` === formValue.directorTribunal)!,
      codirectorTribunal: formValue.codirectorTribunal ? this.profesores.find(p => `${p.nombre} ${p.apellidos}` === formValue.codirectorTribunal) : undefined,
      vocalTribunal: formValue.vocalTribunal ? this.profesores.find(p => `${p.nombre} ${p.apellidos}` === formValue.vocalTribunal) : undefined,
      suplente: formValue.suplente ? this.profesores.find(p => `${p.nombre} ${p.apellidos}` === formValue.suplente) : undefined,
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
      grado: '', // Sin valor por defecto
      especialidad: '', // Sin valor por defecto
      titulo: '',
      idioma: '', // Sin valor por defecto
      estudiante: null, // Cambiar a null para objetos
      directorTribunal: '',
      codirectorTribunal: '',
      vocalTribunal: '',
      suplente: '',
      comentariosDireccion: '',
      especialidadesVocal: [],
      especialidadesSuplente: []
    });
    
    // No establecer validador required para especialidad inicialmente
    const especialidadControl = this.defensaForm.get('especialidad');
    especialidadControl?.clearValidators();
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
    
    // No mostrar especialidades inicialmente
    this.mostrarEspecialidades = false;
    this.updateAreasConocimiento();
    this.updateEstudiantesFiltrados();
  }
  
  async exportToPDF(): Promise<void> {
    this.isExporting.set(true);
    
    try {
      // Validar áreas de conocimiento
      if (!this.validateAreasConocimiento()) {
        this.isExporting.set(false);
        return;
      }
      
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
    yPosition += 16;
    
    // DNI del estudiante
    if (formValue.estudiante && formValue.estudiante.dni) {
      checkPageBreak(20);
      pdf.text(`DNI: ${formValue.estudiante.dni}`, margin, yPosition);
      yPosition += 20;
    } else {
      yPosition += 10;
    }
    
    // Información de la dirección
    checkPageBreak(60);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Zuzendaria(k) / Dirección:', margin, yPosition);
    yPosition += 16;
    
    checkPageBreak(30);
    pdf.setFont('helvetica', 'normal');
    writeWrappedLines(pdf.splitTextToSize(`${formValue.directorTribunal}`, pageWidth - 2 * margin), margin, 16);
    
    // Co-director (solo si está seleccionado)
    if (formValue.codirectorTribunal) {
      checkPageBreak(25);
      writeWrappedLines(pdf.splitTextToSize(`${formValue.codirectorTribunal}`, pageWidth - 2 * margin), margin, 16);
    }
    yPosition += 10;
    
    // Vocal (solo si está seleccionado) - Sección separada
    if (formValue.vocalTribunal) {
      checkPageBreak(40);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Bokala / Vocal:', margin, yPosition);
      yPosition += 16;
      
      checkPageBreak(30);
      pdf.setFont('helvetica', 'normal');
      writeWrappedLines(pdf.splitTextToSize(`${formValue.vocalTribunal}`, pageWidth - 2 * margin), margin, 16);
      yPosition += 10;
    }
    
    // Suplente (solo si está seleccionado) - Sección separada
    if (formValue.suplente) {
      checkPageBreak(40);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Ordezkoa / Suplente:', margin, yPosition);
      yPosition += 16;
      
      checkPageBreak(30);
      pdf.setFont('helvetica', 'normal');
      writeWrappedLines(pdf.splitTextToSize(`${formValue.suplente}`, pageWidth - 2 * margin), margin, 16);
      yPosition += 10;
    }
    
    
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
    
    // Solo firmar director y codirector (si hay)
    if (formValue.codirectorTribunal) {
      // Si hay codirector, mostrar ambos
      pdf.text('Zuzendaria / Director:', margin, yPosition);
      pdf.text('Kozuzendaria / Codirector:', pageWidth / 2, yPosition);
      yPosition += 24;
      
      checkPageBreak(30);
      pdf.text('_________________', margin, yPosition);
      pdf.text('_________________', pageWidth / 2, yPosition);
      yPosition += 16;
      
      checkPageBreak(30);
      pdf.text(formValue.directorTribunal, margin, yPosition);
      pdf.text(formValue.codirectorTribunal, pageWidth / 2, yPosition);
    } else {
      // Solo director
      pdf.text('Zuzendaria / Director:', margin, yPosition);
      yPosition += 24;
      
      checkPageBreak(30);
      pdf.text('_________________', margin, yPosition);
      yPosition += 16;
      
      checkPageBreak(30);
      pdf.text(formValue.directorTribunal, margin, yPosition);
    }
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
