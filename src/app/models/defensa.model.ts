export interface Defensa {
  id: number;
  curso: string;
  especialidad: TipoEspecialidad;
  titulo: string;
  estudiante: EstudianteDisplay;
  directorTribunal: Profesor;
  vocalTribunal: Profesor;
  suplente: Profesor;
  comentariosDireccion: string;
  fechaCreacion: Date;
  fechaModificacion?: Date;
  creadoPor: number;
  modificadoPor?: number;
  activo: boolean;
}

export interface EstudianteDisplay {
  nombreCompleto: string;
  nombre: string;
  apellido1: string;
  apellido2: string;
  email?: string;
}

export interface Profesor {
  id: number;
  nombre: string;
  apellidos: string;
  email: string;
  tipoEspecialidad: TipoEspecialidad;
  dni: string;
  activo: boolean;
}

export enum TipoEspecialidad {
  INGENIERIA_COMPUTACION = 'ingenieria_computacion',
  INGENIERIA_SOFTWARE = 'ingenieria_software',
  COMPUTACION = 'computacion'
}

export enum TipoDefensa {
  PENAL = 'penal',
  CIVIL = 'civil',
  ADMINISTRATIVO = 'administrativo',
  LABORAL = 'laboral',
  MERCANTIL = 'mercantil',
  FAMILIA = 'familia',
  OTROS = 'otros'
}

export enum EstadoDefensa {
  BORRADOR = 'borrador',
  EN_PROCESO = 'en_proceso',
  PRESENTADA = 'presentada',
  ADMITIDA = 'admitida',
  RECHAZADA = 'rechazada',
  ARCHIVADA = 'archivada'
}

export interface CreateDefensaRequest {
  curso: string;
  especialidad: TipoEspecialidad;
  titulo: string;
  estudiante: EstudianteDisplay;
  directorTribunal: Profesor;
  vocalTribunal: Profesor;
  suplente: Profesor;
  comentariosDireccion: string;
  especialidadesVocal: string[];
  especialidadesSuplente: string[];
}

export interface UpdateDefensaRequest {
  id: number;
  nombre?: string;
  descripcion?: string;
  tipo?: TipoDefensa;
  estado?: EstadoDefensa;
  observaciones?: string;
  activo?: boolean;
}

export interface DefensaResponse {
  success: boolean;
  data?: Defensa | Defensa[];
  message?: string;
  error?: string;
}

export interface DefensaFilters {
  tipo?: TipoDefensa;
  estado?: EstadoDefensa;
  activo?: boolean;
  creadoPor?: number;
  fechaDesde?: Date;
  fechaHasta?: Date;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
