import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Alumno {
  id: number;
  dni: string;
  nombre: string;
  apellidos: string;
  titulacion: string;
  asignatura: string;
  creditosSup: number;
  mediaExpediente: number;
  idTipoGrado: number;
  created: string;
  updated?: string;
  tipoGrado?: TipoGrado;
}

export interface TipoGrado {
  id: number;
  nombre: string;
  descripcion?: string;
  created: string;
  updated?: string;
}

export interface AlumnoRequest {
  dni: string;
  nombre: string;
  apellidos: string;
  titulacion: string;
  asignatura: string;
  creditosSup: number;
  mediaExpediente: number;
}

export interface AlumnosBulkRequest {
  alumnos: AlumnoRequest[];
}

export interface AlumnosBulkResponse {
  message: string;
  alumnosProcesados: number;
  totalProcesados: number;
}

@Injectable({
  providedIn: 'root'
})
export class AlumnosService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/api/Alumnos`;

  /**
   * Obtener todos los alumnos
   */
  getAllAlumnos(): Observable<any[]> {
    console.log('AlumnosService: Realizando petición GET a:', this.apiUrl);
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(response => {
        console.log('AlumnosService: Respuesta de la API:', response);
        return response;
      })
    );
  }

  /**
   * Obtener un alumno por ID
   */
  getAlumnoById(id: number): Observable<Alumno> {
    return this.http.get<Alumno>(`${this.apiUrl}/${id}`);
  }

  /**
   * Obtener un alumno por DNI
   */
  getAlumnoByDni(dni: string): Observable<Alumno> {
    return this.http.get<Alumno>(`${this.apiUrl}/dni/${dni}`);
  }

  /**
   * Crear un nuevo alumno
   */
  createAlumno(alumno: AlumnoRequest): Observable<Alumno> {
    return this.http.post<Alumno>(this.apiUrl, alumno);
  }

  /**
   * Crear múltiples alumnos desde Excel
   */
  createBulkAlumnos(alumnos: AlumnoRequest[]): Observable<AlumnosBulkResponse> {
    const request: AlumnosBulkRequest = { alumnos };
    return this.http.post<AlumnosBulkResponse>(`${this.apiUrl}/bulk`, request);
  }

  /**
   * Actualizar un alumno
   */
  updateAlumno(id: number, alumno: AlumnoRequest): Observable<Alumno> {
    return this.http.put<Alumno>(`${this.apiUrl}/${id}`, alumno);
  }

  /**
   * Eliminar un alumno por ID
   */
  deleteAlumno(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  /**
   * Eliminar un alumno por DNI
   */
  deleteAlumnoByDni(dni: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/dni/${dni}`);
  }

  /**
   * Obtener tipos de grado
   */
  getTiposGrado(): Observable<TipoGrado[]> {
    return this.http.get<TipoGrado[]>(`${this.apiUrl}/tipos-grado`);
  }

  /**
   * Procesar datos de Excel y convertirlos a AlumnoRequest[]
   */
  processExcelData(excelData: any[]): AlumnoRequest[] {
    const alumnos: AlumnoRequest[] = [];

    for (const row of excelData) {
      try {
        // Obtener los nombres de las columnas reales del Excel
        const columnNames = Object.keys(row);
        console.log('Columnas disponibles en la fila:', columnNames);
        
        // Buscar las columnas por diferentes nombres posibles
        const dni = this.findColumnValue(row, ['DNI', 'dni', 'Dni']);
        const titulacion = this.findColumnValue(row, ['Titulación', 'titulacion', 'Titulacion']);
        const asignatura = this.findColumnValue(row, ['Asignatura', 'asignatura', 'Asignatura']);
        const alumno = this.findColumnValue(row, ['Alumno', 'alumno', 'Alumno/a', 'alumno/a']);
        const creditos = this.findColumnValue(row, ['Créditos', 'creditos', 'Créditos sup', 'creditos sup']);
        const media = this.findColumnValue(row, ['Media', 'media', 'Media expediente', 'media expediente']);

        // Validar que la fila tenga los datos necesarios
        if (!dni || !alumno || !titulacion) {
          console.warn('Fila omitida por datos incompletos:', { dni, alumno, titulacion, row });
          continue;
        }

        // Extraer nombre y apellidos del campo "Alumno"
        // El nombre es la última palabra (más a la derecha) y los apellidos son el resto
        const nombreCompleto = alumno.toString().trim();
        const partesNombre = nombreCompleto.split(' ');
        
        if (partesNombre.length < 2) {
          console.warn('Formato de nombre incorrecto:', nombreCompleto);
          continue;
        }

        // El nombre es la última palabra, los apellidos son el resto
        const nombre = partesNombre[partesNombre.length - 1].trim();
        const apellidos = partesNombre.slice(0, -1).join(' ').trim();

        // Determinar idTipoGrado basado en la titulación
        const titulacionStr = titulacion.toString().trim();
        let idTipoGrado = 1; // Por defecto Ingeniería Informática
        
        if (titulacionStr.toLowerCase().includes('inteligencia artificial')) {
          idTipoGrado = 2;
        }

        // Procesar créditos de forma más robusta
        let creditosSup = 0;
        if (creditos !== null && creditos !== undefined && creditos !== '') {
          const parsed = parseInt(creditos.toString().trim());
          if (!isNaN(parsed)) {
            creditosSup = parsed;
          }
        }

        // Procesar media de forma más robusta
        let mediaExpediente = 0;
        if (media !== null && media !== undefined && media !== '') {
          const parsed = parseFloat(media.toString().trim().replace(',', '.'));
          if (!isNaN(parsed)) {
            mediaExpediente = parsed;
          }
        }

        const alumnoData: AlumnoRequest = {
          dni: dni.toString().trim(),
          nombre: nombre,
          apellidos: apellidos,
          titulacion: titulacionStr,
          asignatura: asignatura?.toString().trim() || 'Trabajo Fin de Grado',
          creditosSup: creditosSup,
          mediaExpediente: mediaExpediente
        };

        console.log('Alumno procesado:', {
          nombreCompleto: alumno,
          nombre: nombre,
          apellidos: apellidos,
          alumnoData: alumnoData
        });
        alumnos.push(alumnoData);
      } catch (error) {
        console.error('Error procesando fila:', row, error);
      }
    }

    return alumnos;
  }

  private findColumnValue(row: any, possibleNames: string[]): any {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
        return row[name];
      }
    }
    return null;
  }

  /**
   * Validar datos de alumnos antes de enviar
   */
  validateAlumnosData(alumnos: AlumnoRequest[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!alumnos || alumnos.length === 0) {
      errors.push('No hay datos de alumnos para procesar');
      return { valid: false, errors };
    }

    const dnis = new Set<string>();

    for (let i = 0; i < alumnos.length; i++) {
      const alumno = alumnos[i];
      const rowNumber = i + 1;

      // Validar DNI
      if (!alumno.dni || alumno.dni.trim() === '') {
        errors.push(`Fila ${rowNumber}: DNI es requerido`);
      } else if (dnis.has(alumno.dni)) {
        errors.push(`Fila ${rowNumber}: DNI duplicado: ${alumno.dni}`);
      } else {
        dnis.add(alumno.dni);
      }

      // Validar nombre
      if (!alumno.nombre || alumno.nombre.trim() === '') {
        errors.push(`Fila ${rowNumber}: Nombre es requerido`);
      }

      // Validar apellidos
      if (!alumno.apellidos || alumno.apellidos.trim() === '') {
        errors.push(`Fila ${rowNumber}: Apellidos son requeridos`);
      }

      // Validar créditos (permitir 0 como válido)
      if (alumno.creditosSup < 0) {
        errors.push(`Fila ${rowNumber}: Créditos no puede ser negativo`);
      }

      // Validar media
      if (alumno.mediaExpediente < 0 || alumno.mediaExpediente > 10) {
        errors.push(`Fila ${rowNumber}: Media expediente debe estar entre 0 y 10`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}

