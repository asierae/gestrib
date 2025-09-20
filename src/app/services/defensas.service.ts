import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, retry, timeout, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  Defensa, 
  CreateDefensaRequest, 
  UpdateDefensaRequest, 
  DefensaResponse, 
  DefensaFilters,
  TipoDefensa,
  EstadoDefensa
} from '../models/defensa.model';

@Injectable({
  providedIn: 'root'
})
export class DefensasService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/${environment.apiVersion}/defensas`;

  /**
   * Obtiene todas las defensas con filtros opcionales
   */
  getDefensas(filters?: DefensaFilters): Observable<DefensaResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.tipo) params = params.set('tipo', filters.tipo);
      if (filters.estado) params = params.set('estado', filters.estado);
      if (filters.activo !== undefined) params = params.set('activo', filters.activo.toString());
      if (filters.creadoPor) params = params.set('creadoPor', filters.creadoPor.toString());
      if (filters.fechaDesde) params = params.set('fechaDesde', filters.fechaDesde.toISOString());
      if (filters.fechaHasta) params = params.set('fechaHasta', filters.fechaHasta.toISOString());
      if (filters.search) params = params.set('search', filters.search);
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.sortOrder) params = params.set('sortOrder', filters.sortOrder);
    }

    return this.http.get<DefensaResponse>(this.baseUrl, { params })
      .pipe(
        timeout<DefensaResponse>(environment.timeout),
        retry(environment.retryAttempts),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene una defensa por ID
   */
  getDefensaById(id: number): Observable<DefensaResponse> {
    return this.http.get<DefensaResponse>(`${this.baseUrl}/${id}`)
      .pipe(
        timeout<DefensaResponse>(environment.timeout),
        retry(environment.retryAttempts),
        catchError(this.handleError)
      );
  }

  /**
   * Crea una nueva defensa
   */
  createDefensa(defensa: CreateDefensaRequest): Observable<DefensaResponse> {
    return this.http.post<DefensaResponse>(this.baseUrl, defensa)
      .pipe(
        timeout<DefensaResponse>(environment.timeout),
        catchError(this.handleError)
      );
  }

  /**
   * Actualiza una defensa existente
   */
  updateDefensa(id: number, defensa: UpdateDefensaRequest): Observable<DefensaResponse> {
    return this.http.put<DefensaResponse>(`${this.baseUrl}/${id}`, defensa)
      .pipe(
        timeout<DefensaResponse>(environment.timeout),
        catchError(this.handleError)
      );
  }

  /**
   * Actualiza parcialmente una defensa (PATCH)
   */
  patchDefensa(id: number, updates: Partial<UpdateDefensaRequest>): Observable<DefensaResponse> {
    return this.http.patch<DefensaResponse>(`${this.baseUrl}/${id}`, updates)
      .pipe(
        timeout<DefensaResponse>(environment.timeout),
        catchError(this.handleError)
      );
  }

  /**
   * Elimina una defensa (soft delete)
   */
  deleteDefensa(id: number): Observable<DefensaResponse> {
    return this.http.delete<DefensaResponse>(`${this.baseUrl}/${id}`)
      .pipe(
        timeout<DefensaResponse>(environment.timeout),
        catchError(this.handleError)
      );
  }

  /**
   * Elimina permanentemente una defensa
   */
  hardDeleteDefensa(id: number): Observable<DefensaResponse> {
    return this.http.delete<DefensaResponse>(`${this.baseUrl}/${id}/permanent`)
      .pipe(
        timeout<DefensaResponse>(environment.timeout),
        catchError(this.handleError)
      );
  }

  /**
   * Restaura una defensa eliminada
   */
  restoreDefensa(id: number): Observable<DefensaResponse> {
    return this.http.post<DefensaResponse>(`${this.baseUrl}/${id}/restore`, {})
      .pipe(
        timeout<DefensaResponse>(environment.timeout),
        catchError(this.handleError)
      );
  }

  /**
   * Obtiene las defensas por tipo
   */
  getDefensasByTipo(tipo: TipoDefensa, filters?: Omit<DefensaFilters, 'tipo'>): Observable<DefensaResponse> {
    const filtersWithTipo = { ...filters, tipo };
    return this.getDefensas(filtersWithTipo);
  }

  /**
   * Obtiene las defensas por estado
   */
  getDefensasByEstado(estado: EstadoDefensa, filters?: Omit<DefensaFilters, 'estado'>): Observable<DefensaResponse> {
    const filtersWithEstado = { ...filters, estado };
    return this.getDefensas(filtersWithEstado);
  }

  /**
   * Busca defensas por texto
   */
  searchDefensas(searchTerm: string, filters?: Omit<DefensaFilters, 'search'>): Observable<DefensaResponse> {
    const filtersWithSearch = { ...filters, search: searchTerm };
    return this.getDefensas(filtersWithSearch);
  }

  /**
   * Obtiene estadísticas de defensas
   */
  getDefensasStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/stats`)
      .pipe(
        timeout<any>(environment.timeout),
        retry(environment.retryAttempts),
        catchError(this.handleError)
      );
  }

  /**
   * Exporta defensas a diferentes formatos
   */
  exportDefensas(format: 'pdf' | 'excel' | 'csv', filters?: DefensaFilters): Observable<Blob> {
    let params = new HttpParams().set('format', format);
    
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = filters[key as keyof DefensaFilters];
        if (value !== undefined && value !== null) {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get(`${this.baseUrl}/export`, { 
      params, 
      responseType: 'blob' 
    }).pipe(
      timeout<Blob>(environment.timeout),
      catchError(this.handleError)
    );
  }

  /**
   * Maneja errores HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Ha ocurrido un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      switch (error.status) {
        case 400:
          errorMessage = 'Solicitud incorrecta. Verifique los datos enviados.';
          break;
        case 401:
          errorMessage = 'No autorizado. Debe iniciar sesión.';
          break;
        case 403:
          errorMessage = 'Acceso denegado. No tiene permisos para realizar esta acción.';
          break;
        case 404:
          errorMessage = 'Defensa no encontrada.';
          break;
        case 409:
          errorMessage = 'Conflicto. La defensa ya existe o está en uso.';
          break;
        case 422:
          errorMessage = 'Datos de validación incorrectos.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor. Intente más tarde.';
          break;
        case 0:
          errorMessage = 'No se pudo conectar con el servidor. Verifique su conexión.';
          break;
        default:
          errorMessage = `Error del servidor: ${error.status} - ${error.message}`;
      }
    }

    console.error('Error en DefensasService:', error);
    return throwError(() => new Error(errorMessage));
  }
}
