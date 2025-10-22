import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { Profesor, TipoEspecialidad } from '../models/profesor.model';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ProfesoresService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/usuarios`;

  /**
   * Obtiene todos los profesores desde la API
   */
  getProfesores(): Observable<Profesor[]> {
    return this.http.get<any[]>(`${this.apiUrl}/getAllUsuariosData`).pipe(
      map((response: any) => {
        
        // Si la respuesta es un string JSON, parsearlo
        const data = typeof response === 'string' ? JSON.parse(response) : response;
        
        if (!data || data.length === 0) {
          return this.getProfesoresMockData();
        }
        
        const profesoresMapeados = data.map((usuario: any) => {
          return {
            id: usuario.Id || usuario.id,
            nombre: usuario.Nombre || usuario.nombre || '',
            apellidos: usuario.Apellidos || usuario.apellidos || '',
            email: usuario.Email || usuario.email || '',
            tipoEspecialidad: this.mapTipoEspecialidad(usuario.TipoEspecialidad || usuario.tipoEspecialidad),
            especialidadOriginal: usuario.Entidad || usuario.entidad || '',
            dni: usuario.DNI || usuario.dni || '',
            tipoUsuario: usuario.TipoUsuario || usuario.tipoUsuario || 2, // Por defecto Profesor
            activo: usuario.IsActive !== false && usuario.isActive !== false
          };
        });
        
        return profesoresMapeados;
      }),
      catchError(error => {
        console.error('Error al cargar profesores desde API:', error);
        return of(this.getProfesoresMockData());
      })
    );
  }

  /**
   * Debug: Obtiene información del usuario actual
   */
  debugUserInfo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/debug-user-info`).pipe(
      map(response => {
        console.log('ProfesoresService: Información del usuario:', response);
        return response;
      }),
      catchError(error => {
        console.error('ProfesoresService: Error obteniendo info del usuario:', error);
        throw error;
      })
    );
  }

  /**
   * Elimina un profesor por ID
   */
  deleteProfesor(id: number): Observable<any> {
    console.log('ProfesoresService: Eliminando profesor con ID:', id);
    console.log('ProfesoresService: URL completa:', `${this.apiUrl}/${id}`);
    
    // Verificar si hay token disponible
    const token = this.authService.getToken();
    console.log('ProfesoresService: Token disponible:', !!token);
    console.log('ProfesoresService: Usuario autenticado:', this.authService.isLoggedIn());
    
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        console.log('ProfesoresService: Profesor eliminado exitosamente:', response);
        return response;
      }),
      catchError(error => {
        console.error('ProfesoresService: Error al eliminar profesor:', error);
        console.error('ProfesoresService: Status:', error.status);
        console.error('ProfesoresService: StatusText:', error.statusText);
        console.error('ProfesoresService: URL:', error.url);
        console.error('ProfesoresService: Error details:', error.error);
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
        tipoUsuario: 1, // Admin
        activo: true
      },
      {
        id: 2,
        nombre: 'Dra. María',
        apellidos: 'López Fernández',
        email: 'maria.lopez@ehu.eus',
        tipoEspecialidad: TipoEspecialidad.INGENIERIA_SOFTWARE,
        dni: '87654321B',
        tipoUsuario: 2, // Profesor
        activo: true
      },
      {
        id: 3,
        nombre: 'Dr. Carlos',
        apellidos: 'Ruiz Sánchez',
        email: 'carlos.ruiz@ehu.eus',
        tipoEspecialidad: TipoEspecialidad.COMPUTACION,
        dni: '11223344C',
        tipoUsuario: 2, // Profesor
        activo: true
      },
      {
        id: 4,
        nombre: 'Dra. Ana',
        apellidos: 'García Pérez',
        email: 'ana.garcia@ehu.eus',
        tipoEspecialidad: TipoEspecialidad.INGENIERIA_COMPUTACION,
        dni: '44332211D',
        tipoUsuario: 2, // Profesor
        activo: true
      },
      {
        id: 5,
        nombre: 'Dr. David',
        apellidos: 'Fernández López',
        email: 'david.fernandez@ehu.eus',
        tipoEspecialidad: TipoEspecialidad.INGENIERIA_SOFTWARE,
        dni: '55667788E',
        tipoUsuario: 2, // Profesor
        activo: true
      },
      {
        id: 6,
        nombre: 'Dra. Laura',
        apellidos: 'Sánchez Ruiz',
        email: 'laura.sanchez@ehu.eus',
        tipoEspecialidad: TipoEspecialidad.COMPUTACION,
        dni: '99887766F',
        tipoUsuario: 2, // Profesor
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
    if (!excelData || excelData.length === 0) {
      return [];
    }

    const profesores: ProfesorRequest[] = [];
    const emailsProcesados = new Set<string>(); // Para controlar emails duplicados
    
    excelData.forEach((row, index) => {
      try {
        // Mapear las columnas del Excel a los campos del profesor
        // Incluir el nuevo campo Cargo
        const nombre = this.getFieldValue(row, ['Nombre']);
        const apellidos = this.getFieldValue(row, ['Apellidos']);
        const email = this.getFieldValue(row, ['Direc. Mail UPV']);
        const especialidad = this.getFieldValue(row, ['Nombre unidad org.']);
        const cargo = this.getFieldValue(row, ['Cargo']);

        const profesor: ProfesorRequest = {
          nombre: nombre,
          apellidos: apellidos,
          email: email,
          dni: this.generateDniFromEmail(email), // Siempre generar DNI automáticamente
          tipoEspecialidad: this.mapTipoEspecialidadFromExcel(especialidad),
          especialidadOriginal: especialidad, // Guardar el valor original del Excel
          cargo: cargo // Nuevo campo Cargo
        };

        // Validar que los campos obligatorios estén presentes
        // Para profesores solo necesitamos: nombre, apellidos y email
        if (profesor.nombre && profesor.apellidos && profesor.email) {
          const emailLower = profesor.email.toLowerCase();
          
          // Verificar si el email ya fue procesado
          if (emailsProcesados.has(emailLower)) {
            // Email duplicado, omitir
          } else {
            // Agregar email a la lista de procesados
            emailsProcesados.add(emailLower);
            profesores.push(profesor);
          }
        } else {
          // Faltan campos obligatorios, omitir fila
        }
      } catch (error) {
        console.error(`Error procesando fila ${index + 1}:`, error);
      }
    });

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
    });

    // Los emails duplicados ya se manejan en el procesamiento, no es necesario validarlos aquí

    return { valid: errors.length === 0, errors };
  }

  /**
   * Crea profesores masivamente como usuarios
   */
  createBulkProfesores(profesores: ProfesorRequest[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/bulk-profesores`, { profesores }).pipe(
      map(response => {
        return response;
      }),
      catchError(error => {
        console.error('Error al crear profesores:', error);
        throw error;
      })
    );
  }

  /**
   * Obtiene el valor de un campo desde diferentes posibles nombres de columna
   */
  private getFieldValue(row: any, possibleNames: string[]): string {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
        const value = String(row[name]).trim();
        return value;
      }
    }
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

  /**
   * Actualiza el tipo de usuario de un profesor
   */
  updateTipoUsuario(usuarioId: number, tipoUsuario: number): Observable<any> {
    console.log('ProfesoresService: Actualizando tipo de usuario:', { usuarioId, tipoUsuario });
    
    const requestBody = {
      id: usuarioId,
      idTipo: tipoUsuario
    };
    
    return this.http.post(`${this.apiUrl}/update-tipo-usuario`, requestBody).pipe(
      map(response => {
        console.log('ProfesoresService: Tipo de usuario actualizado exitosamente:', response);
        return response;
      }),
      catchError(error => {
        console.error('ProfesoresService: Error al actualizar tipo de usuario:', error);
        console.error('ProfesoresService: Status:', error.status);
        console.error('ProfesoresService: StatusText:', error.statusText);
        console.error('ProfesoresService: URL:', error.url);
        console.error('ProfesoresService: Error details:', error.error);
        throw error;
      })
    );
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
  especialidadOriginal?: string; // Campo original del Excel "Nombre unidad org."
  cargo?: string; // Campo Cargo del Excel
}
