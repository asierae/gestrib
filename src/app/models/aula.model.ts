export interface Aula {
  id: number;
  nombre: string;
  created: Date;
  updated: Date;
  isActive: boolean;
}

export interface AulaRequest {
  nombre: string;
}

export interface AulaResponse {
  success: boolean;
  message: string;
  data?: Aula;
  dataList?: Aula[];
}
