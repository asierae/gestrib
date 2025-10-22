import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ProfessorByPosition {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  puesto: string;
  fullName: string; // nombre + apellidos para el dropdown
}

@Injectable({
  providedIn: 'root'
})
export class ProfessorsByPositionService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/usuarios`;

  /**
   * Obtiene profesores por posición (Presidente, Vocal, etc.)
   */
  getProfessorsByPosition(position: string): Observable<ProfessorByPosition[]> {
    console.log(`ProfessorsByPositionService: Obteniendo profesores con puesto: ${position}`);
    
    return this.http.get<any[]>(`${this.apiUrl}/getAllUsuariosData`).pipe(
      map((response: any) => {
        // Si la respuesta es un string JSON, parsearlo
        const data = typeof response === 'string' ? JSON.parse(response) : response;
        
        if (!data || data.length === 0) {
          console.log('ProfessorsByPositionService: No hay datos de usuarios');
          return [];
        }
        
        // Filtrar profesores por posición (case insensitive)
        const positionLower = position.toLowerCase();
        const professors = data
          .filter((usuario: any) => {
            const puesto = usuario.puesto || usuario.Puesto || '';
            return puesto.toLowerCase().includes(positionLower);
          })
          .map((usuario: any) => {
            const nombre = usuario.Nombre || usuario.nombre || '';
            const apellidos = usuario.Apellidos || usuario.apellidos || '';
            
            return {
              id: usuario.Id || usuario.id,
              nombre: nombre,
              apellidos: apellidos,
              email: usuario.Email || usuario.email || '',
              puesto: usuario.puesto || usuario.Puesto || '',
              fullName: `${nombre} ${apellidos}`.trim()
            };
          });
        
        console.log(`ProfessorsByPositionService: Encontrados ${professors.length} profesores con puesto que contiene "${position}"`);
        return professors;
      }),
      catchError(error => {
        console.error('ProfessorsByPositionService: Error al cargar profesores por posición:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtiene profesores que pueden ser presidentes
   */
  getPresidents(): Observable<ProfessorByPosition[]> {
    return this.getProfessorsByPosition('Presidente');
  }

  /**
   * Obtiene profesores que pueden ser vocales
   */
  getVocals(): Observable<ProfessorByPosition[]> {
    return this.getProfessorsByPosition('Vocal');
  }
}
