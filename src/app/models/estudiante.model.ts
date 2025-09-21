export interface Estudiante {
  nombre: string;
  apellido1: string;
  apellido2: string;
  email?: string;
  activo?: boolean;
}

export interface EstudianteDisplay {
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
