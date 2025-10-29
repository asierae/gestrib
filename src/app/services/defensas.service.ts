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
  private baseUrl = `${environment.apiUrl}/api/defensas`;

  /**
   * Obtiene todas las defensas con filtros opcionales - Entry Point: get_defensas
   */
  getDefensas(filters?: DefensaFilters): Observable<DefensaResponse> {
    // Preparar el cuerpo de la petición POST con solo los filtros
    const requestBody = filters || {};

    return this.http.post<DefensaResponse>(`${this.baseUrl}/get_defensas`, requestBody)
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
   * Crea una nueva defensa - Entry Point: generar_defensa
   */
  createDefensa(defensa: CreateDefensaRequest): Observable<DefensaResponse> {
    // Mapear los datos del frontend al formato del backend
    const especialidadesVocalSerialized = this.serializeSpecialtyArray(defensa.especialidadesVocal);
    const especialidadesSupleteSerialized = this.serializeSpecialtyArray(defensa.especialidadesSuplente);
    
    const backendRequest = {
      IdCurso: this.mapCursoToId(defensa.curso),
      IdGrado: this.mapGradoToId(defensa.grado),
      IdEspecialidad: defensa.especialidad ? this.mapEspecialidadToId(defensa.especialidad) : null,
      Especialidad: defensa.especialidad ? this.mapEspecialidadToLabel(defensa.especialidad) : null,
      Titulo: defensa.titulo,
      IdAlumno: defensa.estudiante?.id || 0, // Necesitamos el ID del estudiante
      IdDirectorTribunal: defensa.directorTribunal.id,
      IdCodirectorTribunal: defensa.codirectorTribunal?.id || null,
      IdVocalTribunal: defensa.vocalTribunal?.id || null,
      IdSuplente: defensa.suplente?.id || null,
      IdPresidente: null, // Por defecto null
      EspecialidadesVocal: especialidadesVocalSerialized,
      EspecialidadesSuplente: especialidadesSupleteSerialized,
      ComentariosDireccion: defensa.comentariosDireccion,
      FechaDefensa: null, // Por defecto null
      HoraDefensa: null, // Por defecto null
      LugarDefensa: null, // Por defecto null
      Estado: 'Pendiente', // Estado por defecto
      Idioma: defensa.idioma,
      Lugar: null, // Por defecto null
      CreatedBy: 1, // ID del usuario actual (se puede obtener del AuthService)
      UpdatedBy: null,
      IsActive: true
    };

    return this.http.post<DefensaResponse>(this.baseUrl, backendRequest)
      .pipe(
        timeout<DefensaResponse>(environment.timeout),
        catchError(this.handleError)
      );
  }

  /**
   * Mapea el curso (string) a ID numérico
   */
  private mapCursoToId(curso: string): number {
    // Por ahora, usar un ID fijo. En el futuro se puede implementar lógica más compleja
    // basada en el año o crear una tabla de cursos
    return 1; // ID del curso actual
  }

  /**
   * Mapea el enum TipoGrado a ID numérico
   */
  private mapGradoToId(grado: string): number {
    switch (grado) {
      case 'ingenieria_informatica': return 1;
      case 'inteligencia_artificial': return 2;
      default: return 1;
    }
  }

  /**
   * Mapea el enum TipoEspecialidad a ID numérico
   */
  private mapEspecialidadToId(especialidad: string): number {
    switch (especialidad) {
      case 'ingenieria_computacion': return 1;
      case 'ingenieria_software': return 2;
      case 'computacion': return 3;
      default: return 1;
    }
  }

  /**
   * Mapea el enum TipoEspecialidad a label legible
   */
  private mapEspecialidadToLabel(especialidad: string): string {
    switch (especialidad) {
      case 'ingenieria_computacion': 
        return 'Ing. Comp.';
      case 'ingenieria_software': 
        return 'Ing. Software';
      case 'computacion': 
        return 'Computación';
      default: 
        return especialidad;
    }
  }

  /**
   * Serializa un array de especialidades a JSON string
   */
  private serializeSpecialtyArray(specialties: any[]): string {
    if (!specialties || specialties.length === 0) {
      return '';
    }
    
    // Si ya son strings, simplemente unirlos
    if (typeof specialties[0] === 'string') {
      return JSON.stringify(specialties);
    }
    
    // Si son objetos, extraer las propiedades relevantes
    const serializedSpecialties = specialties.map(specialty => {
      if (typeof specialty === 'object' && specialty !== null) {
        // Extraer el label o id del objeto
        return specialty.label || specialty.id || specialty.nombre || specialty;
      }
      return specialty;
    });
    
    return JSON.stringify(serializedSpecialties);
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
   * Actualiza solo el estado de una defensa
   */
  updateEstado(id: number, estado: string): Observable<DefensaResponse> {
    const updateRequest = { Estado: estado };
    return this.http.patch<DefensaResponse>(`${this.baseUrl}/${id}/estado`, updateRequest)
      .pipe(
        timeout<DefensaResponse>(environment.timeout),
        catchError(this.handleError)
      );
  }

  updateLugar(id: number, lugar: string): Observable<DefensaResponse> {
    const updateRequest = { LugarDefensa: lugar };
    return this.http.patch<DefensaResponse>(`${this.baseUrl}/${id}/lugar`, updateRequest)
      .pipe(
        timeout<DefensaResponse>(environment.timeout),
        catchError(this.handleError)
      );
  }

  updatePresidente(id: number, idPresidente: number): Observable<DefensaResponse> {
    const updateRequest = { IdPresidente: idPresidente };
    return this.http.patch<DefensaResponse>(`${this.baseUrl}/${id}/presidente`, updateRequest)
      .pipe(
        timeout<DefensaResponse>(environment.timeout),
        catchError(this.handleError)
      );
  }

  updateVocal(id: number, idVocal: number): Observable<DefensaResponse> {
    const updateRequest = { IdVocal: idVocal };
    return this.http.patch<DefensaResponse>(`${this.baseUrl}/${id}/vocal`, updateRequest)
      .pipe(
        timeout<DefensaResponse>(environment.timeout),
        catchError(this.handleError)
      );
  }

  updateCodirector(id: number, idCodirector: number): Observable<DefensaResponse> {
    const updateRequest = { IdCodirector: idCodirector };
    return this.http.patch<DefensaResponse>(`${this.baseUrl}/${id}/codirector`, updateRequest)
      .pipe(
        timeout<DefensaResponse>(environment.timeout),
        catchError(this.handleError)
      );
  }

  updateReemplazo(id: number, idReemplazo: number): Observable<DefensaResponse> {
    const updateRequest = { IdReemplazo: idReemplazo };
    return this.http.patch<DefensaResponse>(`${this.baseUrl}/${id}/reemplazo`, updateRequest)
      .pipe(
        timeout<DefensaResponse>(environment.timeout),
        catchError(this.handleError)
      );
  }

  updateProgramacion(id: number, fecha?: Date | null, hora?: string | null, lugar?: string | null): Observable<DefensaResponse> {
    const updateRequest: any = {};
    
    if (fecha) {
      updateRequest.FechaDefensa = fecha.toISOString();
    }
    
    if (hora) {
      updateRequest.HoraDefensa = hora; // Enviar directamente el string HH:MM
    }
    
    if (lugar !== undefined) {
      updateRequest.LugarDefensa = lugar;
    }
    
    return this.http.patch<DefensaResponse>(`${this.baseUrl}/${id}/programacion`, updateRequest)
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
   * Elimina todas las defensas
   */
  deleteAllDefensas(): Observable<DefensaResponse> {
    return this.http.delete<DefensaResponse>(`${this.baseUrl}/all`)
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
   * Busca defensas por texto - Entry Point: get_defensas
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
