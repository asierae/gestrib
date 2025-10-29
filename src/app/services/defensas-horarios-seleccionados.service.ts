import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { catchError, timeout } from 'rxjs/operators';

export interface DefensaHorarioSeleccionado {
  id?: number;
  idDefensa: number;
  idUsuario: number;
  fechaHora: string;
  nombreProfesor?: string;
  puesto?: string;
}

export interface CreateSeleccionRequest {
  idDefensa: number;
  idUsuario: number;
  fechaHora: string;
}

export interface UpdateSeleccionRequest {
  fechaHora: string;
}

@Injectable({
  providedIn: 'root'
})
export class DefensasHorariosSeleccionadosService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/DefensasHorariosSeleccionados`;

  /**
   * Obtiene todas las selecciones de horarios para una defensa específica
   */
  getSeleccionesByDefensaId(idDefensa: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/defensa/${idDefensa}`)
      .pipe(
        timeout(environment.timeout),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene la selección de un usuario específico para una defensa
   */
  getSeleccionByUsuario(idDefensa: number, idUsuario: number): Observable<any | null> {
    return this.http.get<any | null>(`${this.baseUrl}/defensa/${idDefensa}/usuario/${idUsuario}`)
      .pipe(
        timeout(environment.timeout),
        catchError(this.handleError)
      );
  }

  /**
   * Crea una nueva selección de horario
   */
  createSeleccion(request: CreateSeleccionRequest): Observable<any> {
    const endpoint = `${this.baseUrl}/crear_seleccion_horario`;
    return this.http.post<any>(endpoint, request)
      .pipe(
        timeout(environment.timeout),
        catchError(this.handleError)
      );
  }

  /**
   * Actualiza una selección de horario existente
   */
  updateSeleccion(id: number, request: UpdateSeleccionRequest): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/${id}`, request)
      .pipe(
        timeout(environment.timeout),
        catchError(this.handleError)
      );
  }

  /**
   * Elimina una selección de horario
   */
  deleteSeleccion(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`)
      .pipe(
        timeout(environment.timeout),
        catchError(this.handleError)
      );
  }


  /**
   * Maneja errores de la API
   */
  private handleError = (error: any): Observable<never> => {
    console.error('DefensasHorariosSeleccionadosService error:', error);
    throw error;
  };
}
