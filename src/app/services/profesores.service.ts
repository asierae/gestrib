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
}
