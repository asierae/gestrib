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

    // Forzar que cada apertura de autocomplete muestre todo (sin filtro previo)
    ['estudiante','directorTribunal','vocalTribunal','suplente'].forEach(ctrlName => {
      const ctrl = this.defensaForm.get(ctrlName);
      ctrl?.valueChanges.pipe(startWith('')).subscribe(val => {
        if (val === '' || val === null) {
          if (ctrlName === 'estudiante') this.filteredEstudiantes = this.estudiantes;
          else this.filteredProfesores = this.profesores;
        }
      });
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
  
  async exportToPDF(): Promise<void> {
    if (this.defensaForm.invalid) {
      this.defensaForm.markAllAsTouched();
      this.snackBar.open(
        this.translationService.getTranslation('defensas.error.required'),
        this.translationService.getTranslation('common.close'),
        { duration: 3000 }
      );
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
    this.continuePDFGeneration(pdf, formValue, yPosition, pageWidth, maxY, margin, checkPageBreak);
  }
  
  private generatePDFWithTextHeader(pdf: jsPDF, formValue: any, yPosition: number, pageWidth: number, maxY: number, margin: number, checkPageBreak: Function): void {
    // Logo/Imagen superior (simulado con texto)
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('UNIVERSIDAD DEL PAÍS VASCO', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text('EUSKAL HERRIKO UNIBERTSITATEA', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;
    
    pdf.setFontSize(12);
    pdf.text('Escuela de Ingeniería de Gipuzkoa', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;
    
    this.continuePDFGeneration(pdf, formValue, yPosition, pageWidth, maxY, margin, checkPageBreak);
  }
  
  private continuePDFGeneration(pdf: jsPDF, formValue: any, yPosition: number, pageWidth: number, maxY: number, margin: number, checkPageBreak: Function): void {
    
    // Cabecera ya dibujada en cada página
    yPosition += 0;
    
    // Título del documento
    checkPageBreak(40);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    const title = 'ACTA DE TRIBUNAL DE DEFENSA DE TRABAJO FIN DE GRADO';
    const titleLines = pdf.splitTextToSize(title, pageWidth - 2 * margin);
    pdf.text(titleLines, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += titleLines.length * 18 + 10;
    
    // Información del curso
    checkPageBreak(30);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Curso Académico: ${formValue.curso}`, margin, yPosition);
    yPosition += 24;
    
    // Información de la especialidad
    checkPageBreak(20);
    const especialidadText = this.getEspecialidadText(formValue.especialidad);
    pdf.text(`Especialidad: ${especialidadText}`, margin, yPosition);
    yPosition += 20;
    
    // Título del trabajo
    checkPageBreak(60);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TÍTULO DEL TRABAJO:', margin, yPosition);
    yPosition += 14;
    pdf.setFont('helvetica', 'normal');
    const tituloLines = pdf.splitTextToSize(formValue.titulo, pageWidth - 2 * margin);
    const tituloHeight = tituloLines.length * 18;
    checkPageBreak(tituloHeight + 16);
    pdf.text(tituloLines, margin, yPosition);
    yPosition += tituloHeight + 16;
    
    // Información del estudiante
    checkPageBreak(25);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ESTUDIANTE:', margin, yPosition);
    yPosition += 14;
    pdf.setFont('helvetica', 'normal');
    pdf.text(formValue.estudiante, margin, yPosition);
    yPosition += 26;
    
    // Información del tribunal
    checkPageBreak(60);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMPOSICIÓN DEL TRIBUNAL:', margin, yPosition);
    yPosition += 16;
    
    checkPageBreak(30);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Director del Tribunal: ${formValue.directorTribunal}`, margin, yPosition);
    yPosition += 16;
    
    checkPageBreak(25);
    pdf.text(`Vocal del Tribunal: ${formValue.vocalTribunal}`, margin, yPosition);
    yPosition += 16;
    
    checkPageBreak(25);
    pdf.text(`Suplente: ${formValue.suplente}`, margin, yPosition);
    yPosition += 26;
    
    // Información adicional del tribunal
    checkPageBreak(60);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DATOS DEL TRIBUNAL:', margin, yPosition);
    yPosition += 16;
    
    checkPageBreak(35);
    pdf.setFont('helvetica', 'normal');
    pdf.text('• El tribunal está compuesto por profesores especialistas en la materia', margin, yPosition);
    yPosition += 16;
    
    checkPageBreak(30);
    pdf.text('• Todos los miembros del tribunal han revisado el trabajo previamente', margin, yPosition);
    yPosition += 16;
    
    checkPageBreak(30);
    pdf.text('• El tribunal se compromete a evaluar de forma objetiva y justa', margin, yPosition);
    yPosition += 22;
    
    // Especialidades del vocal (si hay)
    if (formValue.especialidadesVocal && formValue.especialidadesVocal.length > 0) {
      checkPageBreak(50);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Especialidades del Vocal:', margin, yPosition);
      yPosition += 16;
      
      pdf.setFont('helvetica', 'normal');
      formValue.especialidadesVocal.forEach((especialidad: string) => {
        checkPageBreak(24);
        pdf.text(`• ${especialidad}`, margin + 10, yPosition);
        yPosition += 16;
      });
      yPosition += 12;
    }
    
    // Especialidades del suplente (si hay)
    if (formValue.especialidadesSuplente && formValue.especialidadesSuplente.length > 0) {
      checkPageBreak(50);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Especialidades del Suplente:', margin, yPosition);
      yPosition += 16;
      
      pdf.setFont('helvetica', 'normal');
      formValue.especialidadesSuplente.forEach((especialidad: string) => {
        checkPageBreak(24);
        pdf.text(`• ${especialidad}`, margin + 10, yPosition);
        yPosition += 16;
      });
      yPosition += 12;
    }
    
    // Comentarios de la dirección (si hay)
    if (formValue.comentariosDireccion) {
      checkPageBreak(60);
      pdf.setFont('helvetica', 'bold');
      pdf.text('COMENTARIOS DE LA DIRECCIÓN:', margin, yPosition);
      yPosition += 16;
      
      pdf.setFont('helvetica', 'normal');
      const comments = formValue.comentariosDireccion;
      const splitComments = pdf.splitTextToSize(comments, pageWidth - 2 * margin);
      const commentsHeight = splitComments.length * 18;
      checkPageBreak(commentsHeight + 18);
      pdf.text(splitComments, margin, yPosition);
      yPosition += commentsHeight + 18;
    }
    
    // Información adicional del acta
    checkPageBreak(60);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INFORMACIÓN DEL ACTA:', margin, yPosition);
    yPosition += 18;
    
    checkPageBreak(35);
    pdf.setFont('helvetica', 'normal');
    pdf.text('• Este acta certifica la composición del tribunal para la defensa del trabajo', margin, yPosition);
    yPosition += 16;
    
    checkPageBreak(30);
    pdf.text('• El tribunal se compromete a seguir las normativas académicas vigentes', margin, yPosition);
    yPosition += 16;
    
    checkPageBreak(30);
    pdf.text('• La evaluación se realizará según los criterios establecidos por la universidad', margin, yPosition);
    yPosition += 22;
    
    // Firma - Asegurar que hay espacio suficiente
    checkPageBreak(140);
    
    // Línea separadora antes de las firmas
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 20;
    
    checkPageBreak(40);
    pdf.setFont('helvetica', 'bold');
    pdf.text('FIRMAS:', margin, yPosition);
    yPosition += 20;
    
    checkPageBreak(40);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Director del Tribunal:', margin, yPosition);
    pdf.text('Vocal del Tribunal:', pageWidth / 2, yPosition);
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
    
    // Guardar el PDF
    const fileName = `defensa_${formValue.curso}_${formValue.estudiante.replace(/\s+/g, '_')}.pdf`;
    pdf.save(fileName);
    
    this.snackBar.open(
      'PDF exportado exitosamente',
      'Cerrar',
      { duration: 3000 }
    );
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
