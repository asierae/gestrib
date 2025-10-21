import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NotificarHorariosRequest {
  idDefensa: number;
  tituloDefensa: string;
  nombreEstudiante: string;
  emailCodirector: string;
  emailVocal: string;
  emailReemplazo: string;
}

export interface NotificarHorariosResponse {
  success: boolean;
  message: string;
  destinatarios?: string[];
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionHorariosService {
  private baseUrl = `${environment.apiUrl}/api/defensas`;

  constructor(private http: HttpClient) { }

  notificarHorarios(request: NotificarHorariosRequest): Observable<NotificarHorariosResponse> {
    return this.http.post<NotificarHorariosResponse>(`${this.baseUrl}/notificar-horarios`, request);
  }
}
