export interface User {
  id: number;
  email: string;
  password?: string; // Optional for security reasons
  tipo: UserType;
  activo: boolean;
  created: Date;
  updated?: Date;
  token?: string;
  idIdioma: Language;
  nombre?: string;
  apellidos?: string;
  telefono?: string;
  avatar?: string;
  ultimoAcceso?: Date;
  permisos?: Permission[];
}

export enum UserType {
  ADMIN = 'admin',
  JUEZ = 'juez',
  SECRETARIO = 'secretario',
  ABOGADO = 'abogado',
  CLIENTE = 'cliente'
}

export enum Language {
  ES = 'es',
  EN = 'en',
  EU = 'eu'
}

export interface Permission {
  id: number;
  nombre: string;
  descripcion: string;
  modulo: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}
