import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { Profesor, TipoEspecialidad } from '../models/profesor.model';

@Injectable({
  providedIn: 'root'
})
export class ProfesoresService {
  private http = inject(HttpClient);
  private apiUrl = 'https://gestrib-api.azurewebsites.net/usuarios';

  /**
   * Obtiene todos los profesores desde la API
   */
  getProfesores(): Observable<Profesor[]> {
    console.log('ProfesoresService: Cargando profesores desde API...');
    return this.http.get<any[]>(`${this.apiUrl}/getAllUsuariosData`).pipe(
      map((response: any) => {
        console.log('ProfesoresService: Respuesta de la API:', response);
        
        // Si la respuesta es un string JSON, parsearlo
        const data = typeof response === 'string' ? JSON.parse(response) : response;
        
        if (!data || data.length === 0) {
          console.warn('ProfesoresService: No se recibieron profesores de la API, usando datos mock');
          return this.getProfesoresMockData();
        }
        
        const profesoresMapeados = data.map((usuario: any) => {
          return {
            id: usuario.Id || usuario.id,
            nombre: usuario.Nombre || usuario.nombre || '',
            apellidos: usuario.Apellidos || usuario.apellidos || '',
            email: usuario.Email || usuario.email || '',
            tipoEspecialidad: this.mapTipoEspecialidad(usuario.TipoEspecialidad || usuario.tipoEspecialidad),
            dni: usuario.DNI || usuario.dni || '',
            activo: usuario.IsActive !== false && usuario.isActive !== false
          };
        });
        
        console.log(`ProfesoresService: ${profesoresMapeados.length} profesores mapeados`);
        return profesoresMapeados;
      }),
      catchError(error => {
        console.error('ProfesoresService: Error al cargar profesores desde API:', error);
        console.log('ProfesoresService: Usando datos mock como fallback');
        return of(this.getProfesoresMockData());
      })
    );
  }

  /**
   * Elimina un profesor por ID
   */
  deleteProfesor(id: number): Observable<any> {
    console.log(`ProfesoresService: Eliminando profesor con ID ${id}`);
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        console.log('ProfesoresService: Profesor eliminado exitosamente');
        return response;
      }),
      catchError(error => {
        console.error('ProfesoresService: Error al eliminar profesor:', error);
        throw error;
      })
    );
  }

  /**
   * Mapea el tipo de especialidad desde la API
   */
  private mapTipoEspecialidad(tipo: string): TipoEspecialidad {
    if (!tipo) return TipoEspecialidad.INGENIERIA_COMPUTACION;
    
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes('computacion') || tipoLower.includes('computación')) {
      return TipoEspecialidad.INGENIERIA_COMPUTACION;
    } else if (tipoLower.includes('software')) {
      return TipoEspecialidad.INGENIERIA_SOFTWARE;
    } else {
      return TipoEspecialidad.COMPUTACION;
    }
  }

  /**
   * Datos mock para profesores (fallback)
   */
  private getProfesoresMockData(): Profesor[] {
    return [
      {
        id: 1,
        nombre: 'Dr. Juan',
        apellidos: 'Martínez García',
        email: 'juan.martinez@ehu.eus',
        tipoEspecialidad: TipoEspecialidad.INGENIERIA_COMPUTACION,
        dni: '12345678A',
        activo: true
      },
      {
        id: 2,
        nombre: 'Dra. María',
        apellidos: 'López Fernández',
        email: 'maria.lopez@ehu.eus',
        tipoEspecialidad: TipoEspecialidad.INGENIERIA_SOFTWARE,
        dni: '87654321B',
        activo: true
      },
      {
        id: 3,
        nombre: 'Dr. Carlos',
        apellidos: 'Ruiz Sánchez',
        email: 'carlos.ruiz@ehu.eus',
        tipoEspecialidad: TipoEspecialidad.COMPUTACION,
        dni: '11223344C',
        activo: true
      },
      {
        id: 4,
        nombre: 'Dra. Ana',
        apellidos: 'García Pérez',
        email: 'ana.garcia@ehu.eus',
        tipoEspecialidad: TipoEspecialidad.INGENIERIA_COMPUTACION,
        dni: '44332211D',
        activo: true
      },
      {
        id: 5,
        nombre: 'Dr. David',
        apellidos: 'Fernández López',
        email: 'david.fernandez@ehu.eus',
        tipoEspecialidad: TipoEspecialidad.INGENIERIA_SOFTWARE,
        dni: '55667788E',
        activo: true
      },
      {
        id: 6,
        nombre: 'Dra. Laura',
        apellidos: 'Sánchez Ruiz',
        email: 'laura.sanchez@ehu.eus',
        tipoEspecialidad: TipoEspecialidad.COMPUTACION,
        dni: '99887766F',
        activo: true
      }
    ];
  }

  /**
   * Obtiene profesores por especialidad
   */
  getProfesoresByEspecialidad(especialidad: TipoEspecialidad): Observable<Profesor[]> {
    return new Observable(observer => {
      this.getProfesores().subscribe(profesores => {
        const filtered = profesores.filter(p => p.tipoEspecialidad === especialidad);
        observer.next(filtered);
        observer.complete();
      });
    });
  }

  /**
   * Procesa datos de Excel para profesores
   */
  processExcelData(excelData: any[]): ProfesorRequest[] {
    console.log('ProfesoresService: Procesando datos de Excel...');
    console.log('ProfesoresService: Total filas recibidas:', excelData.length);
    
    if (!excelData || excelData.length === 0) {
      console.warn('ProfesoresService: No hay datos para procesar');
      return [];
    }

    // Mostrar las primeras filas para debug
    console.log('ProfesoresService: Primera fila de datos:', excelData[0]);
    console.log('ProfesoresService: Columnas disponibles:', Object.keys(excelData[0] || {}));
    
    // Debug detallado de las primeras 3 filas
    excelData.slice(0, 3).forEach((row, index) => {
      console.log(`ProfesoresService: Fila ${index + 1} completa:`, row);
      console.log(`ProfesoresService: Fila ${index + 1} claves:`, Object.keys(row));
      
      // Debug específico para cada campo del Excel de profesores
      console.log(`ProfesoresService: Fila ${index + 1} - NOMBRE:`, row['Nombre']);
      console.log(`ProfesoresService: Fila ${index + 1} - APELLIDOS:`, row['Apellidos']);
      console.log(`ProfesoresService: Fila ${index + 1} - EMAIL:`, row['Direc. Mail UPV']);
      console.log(`ProfesoresService: Fila ${index + 1} - ESPECIALIDAD:`, row['Nombre unidad org.']);
    });

    const profesores: ProfesorRequest[] = [];
    const emailsProcesados = new Set<string>(); // Para controlar emails duplicados
    
    excelData.forEach((row, index) => {
      try {
        // Mapear las columnas del Excel a los campos del profesor
        // Solo usar los 4 campos exactos del Excel de profesores
        const nombre = this.getFieldValue(row, ['Nombre']);
        const apellidos = this.getFieldValue(row, ['Apellidos']);
        const email = this.getFieldValue(row, ['Direc. Mail UPV']);
        const especialidad = this.getFieldValue(row, ['Nombre unidad org.']);

        const profesor: ProfesorRequest = {
          nombre: nombre,
          apellidos: apellidos,
          email: email,
          dni: this.generateDniFromEmail(email), // Siempre generar DNI automáticamente
          tipoEspecialidad: this.mapTipoEspecialidadFromExcel(especialidad)
        };

        // Validar que los campos obligatorios estén presentes
        // Para profesores solo necesitamos: nombre, apellidos y email
        if (profesor.nombre && profesor.apellidos && profesor.email) {
          const emailLower = profesor.email.toLowerCase();
          
          // Verificar si el email ya fue procesado
          if (emailsProcesados.has(emailLower)) {
            console.warn(`ProfesoresService: Fila ${index + 1} omitida - email duplicado: ${profesor.email}`);
          } else {
            // Agregar email a la lista de procesados
            emailsProcesados.add(emailLower);
            profesores.push(profesor);
            console.log(`ProfesoresService: Fila ${index + 1} procesada correctamente:`, {
              nombre: profesor.nombre,
              apellidos: profesor.apellidos,
              email: profesor.email,
              dni: profesor.dni,
              especialidad: profesor.tipoEspecialidad
            });
          }
        } else {
          console.warn(`ProfesoresService: Fila ${index + 1} omitida - faltan campos obligatorios:`, {
            nombre: profesor.nombre,
            apellidos: profesor.apellidos,
            email: profesor.email,
            dni: profesor.dni,
            tieneNombre: !!profesor.nombre,
            tieneApellidos: !!profesor.apellidos,
            tieneEmail: !!profesor.email
          });
        }
      } catch (error) {
        console.error(`ProfesoresService: Error procesando fila ${index + 1}:`, error);
      }
    });

    const duplicadosOmitidos = excelData.length - profesores.length;
    console.log(`ProfesoresService: ${profesores.length} profesores procesados de ${excelData.length} filas`);
    if (duplicadosOmitidos > 0) {
      console.log(`ProfesoresService: ${duplicadosOmitidos} registros omitidos (emails duplicados o campos faltantes)`);
    }
    return profesores;
  }

  /**
   * Valida los datos de profesores
   */
  validateProfesoresData(profesores: ProfesorRequest[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!profesores || profesores.length === 0) {
      errors.push('No hay profesores para validar');
      return { valid: false, errors };
    }

    profesores.forEach((profesor, index) => {
      const rowNum = index + 1;
      
      if (!profesor.nombre || profesor.nombre.trim() === '') {
        errors.push(`Fila ${rowNum}: El nombre es obligatorio`);
      }
      
      if (!profesor.apellidos || profesor.apellidos.trim() === '') {
        errors.push(`Fila ${rowNum}: Los apellidos son obligatorios`);
      }
      
      if (!profesor.email || profesor.email.trim() === '') {
        errors.push(`Fila ${rowNum}: El email es obligatorio`);
      } else if (!this.isValidEmail(profesor.email)) {
        errors.push(`Fila ${rowNum}: El email no tiene un formato válido`);
      }
      
      // DNI es opcional, se genera automáticamente si no existe
      if (!profesor.dni || profesor.dni.trim() === '') {
        console.warn(`Fila ${rowNum}: DNI no encontrado, se generará automáticamente`);
      }
    });

    // Los emails duplicados ya se manejan en el procesamiento, no es necesario validarlos aquí

    return { valid: errors.length === 0, errors };
  }

  /**
   * Crea profesores masivamente como usuarios
   */
  createBulkProfesores(profesores: ProfesorRequest[]): Observable<any> {
    console.log('ProfesoresService: Enviando profesores a la API...');
    return this.http.post(`${this.apiUrl}/bulk-profesores`, { profesores }).pipe(
      map(response => {
        console.log('ProfesoresService: Profesores creados exitosamente:', response);
        return response;
      }),
      catchError(error => {
        console.error('ProfesoresService: Error al crear profesores:', error);
        throw error;
      })
    );
  }

  /**
   * Obtiene el valor de un campo desde diferentes posibles nombres de columna
   */
  private getFieldValue(row: any, possibleNames: string[]): string {
    console.log('ProfesoresService: Buscando campo en fila:', Object.keys(row));
    console.log('ProfesoresService: Nombres posibles:', possibleNames);
    
    for (const name of possibleNames) {
      console.log(`ProfesoresService: Probando nombre "${name}":`, row[name]);
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
        const value = String(row[name]).trim();
        console.log(`ProfesoresService: Valor encontrado para "${name}":`, value);
        return value;
      }
    }
    console.log('ProfesoresService: No se encontró ningún valor para los nombres:', possibleNames);
    return '';
  }

  /**
   * Mapea el tipo de especialidad desde el Excel
   */
  private mapTipoEspecialidadFromExcel(especialidad: string): TipoEspecialidad {
    if (!especialidad) return TipoEspecialidad.INGENIERIA_COMPUTACION;
    
    const especialidadLower = especialidad.toLowerCase();
    
    // Mapear especialidades específicas de la UPV/EHU
    if (especialidadLower.includes('computacion') || especialidadLower.includes('computación') || 
        especialidadLower.includes('ingeniería computación') || especialidadLower.includes('ingenieria computacion') ||
        especialidadLower.includes('sistemas') || especialidadLower.includes('automatica') ||
        especialidadLower.includes('electronica') || especialidadLower.includes('electrónica')) {
      return TipoEspecialidad.INGENIERIA_COMPUTACION;
    } else if (especialidadLower.includes('software') || especialidadLower.includes('ingeniería software') ||
               especialidadLower.includes('ingenieria software') || especialidadLower.includes('programacion') ||
               especialidadLower.includes('programación')) {
      return TipoEspecialidad.INGENIERIA_SOFTWARE;
    } else if (especialidadLower.includes('computación') || especialidadLower.includes('computacion') ||
               especialidadLower.includes('informatica') || especialidadLower.includes('informática')) {
      return TipoEspecialidad.COMPUTACION;
    } else {
      return TipoEspecialidad.INGENIERIA_COMPUTACION; // Por defecto para otras especialidades
    }
  }

  /**
   * Genera un DNI temporal basado en el email
   */
  private generateDniFromEmail(email: string): string {
    if (!email) return 'TEMP000000A';
    
    // Extraer parte del email y generar un DNI temporal
    const emailPart = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
    const hash = this.simpleHash(emailPart);
    const number = String(hash).padStart(8, '0').substring(0, 8);
    const letter = this.getDniLetter(number);
    
    return `${number}${letter}`;
  }

  /**
   * Hash simple para generar números
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Obtiene la letra del DNI según el algoritmo oficial
   */
  private getDniLetter(number: string): string {
    const letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
    const index = parseInt(number) % 23;
    return letters[index];
  }

  /**
   * Valida si un email tiene formato válido
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

/**
 * Interfaz para la creación de profesores desde Excel
 */
export interface ProfesorRequest {
  nombre: string;
  apellidos: string;
  email: string;
  dni: string;
  tipoEspecialidad: TipoEspecialidad;
}
