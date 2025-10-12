export interface Defensa {
  id: number;
  curso: string;
  especialidad: TipoEspecialidad;
  titulo: string;
  idioma: string;
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
  id?: number;
  nombreCompleto: string;
  nombre: string;
  apellido1: string;
  apellido2: string;
  email?: string;
  dni?: string;
  titulacion?: string;
  asignatura?: string;
  creditosSup?: number;
  mediaExpediente?: number;
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

export enum TipoGrado {
  INGENIERIA_INFORMATICA = 'ingenieria_informatica',
  INTELIGENCIA_ARTIFICIAL = 'inteligencia_artificial'
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
  grado: TipoGrado;
  especialidad?: TipoEspecialidad; // Opcional porque solo se usa para GII
  titulo: string;
  idioma: string;
  estudiante: EstudianteDisplay;
  directorTribunal: Profesor;
  codirectorTribunal?: Profesor; // Opcional
  vocalTribunal?: Profesor; // Opcional
  suplente?: Profesor; // Opcional
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
