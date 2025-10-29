import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DefensaHorario, DefensaHorarioRequest, DefensaHorarioResponse } from '../models/defensa-horario.model';

@Injectable({
  providedIn: 'root'
})
export class DefensasHorariosService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/defensashorarios`;

  /**
   * Obtiene los horarios de una defensa específica
   */
  getHorariosByDefensa(idDefensa: number): Observable<DefensaHorarioResponse> {
    return this.http.get<DefensaHorarioResponse>(`${this.baseUrl}/defensa/${idDefensa}`);
  }

  /**
   * Crea un nuevo horario para una defensa
   */
  createHorario(horario: DefensaHorarioRequest): Observable<DefensaHorarioResponse> {
    return this.http.post<DefensaHorarioResponse>(this.baseUrl, horario);
  }

  /**
   * Elimina un horario específico
   */
  deleteHorario(id: number): Observable<DefensaHorarioResponse> {
    return this.http.delete<DefensaHorarioResponse>(`${this.baseUrl}/${id}`);
  }

  /**
   * Elimina todos los horarios de una defensa
   */
  deleteHorariosByDefensa(idDefensa: number): Observable<DefensaHorarioResponse> {
    return this.http.delete<DefensaHorarioResponse>(`${this.baseUrl}/defensa/${idDefensa}`);
  }
}
