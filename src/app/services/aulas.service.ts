import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Aula, AulaRequest, AulaResponse } from '../models/aula.model';

@Injectable({
  providedIn: 'root'
})
export class AulasService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/aulas`;

  /**
   * Obtiene todas las aulas
   */
  getAllAulas(): Observable<AulaResponse> {
    return this.http.get<AulaResponse>(`${this.baseUrl}/obtener_aulas`);
  }

  /**
   * Obtiene una aula por ID
   */
  getAulaById(id: number): Observable<AulaResponse> {
    return this.http.get<AulaResponse>(`${this.baseUrl}/obtener_aula/${id}`);
  }

  /**
   * Crea una nueva aula
   */
  createAula(aula: AulaRequest): Observable<AulaResponse> {
    return this.http.post<AulaResponse>(`${this.baseUrl}/crear_aula`, aula);
  }

  /**
   * Actualiza una aula existente
   */
  updateAula(id: number, aula: AulaRequest): Observable<AulaResponse> {
    return this.http.put<AulaResponse>(`${this.baseUrl}/actualizar_aula/${id}`, aula);
  }

  /**
   * Elimina una aula (soft delete)
   */
  deleteAula(id: number): Observable<AulaResponse> {
    return this.http.delete<AulaResponse>(`${this.baseUrl}/eliminar_aula/${id}`);
  }
}
