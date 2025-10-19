export interface DefensaHorario {
  id: number;
  idDefensa: number;
  fecha: Date;
  created: Date;
}

export interface DefensaHorarioRequest {
  idDefensa: number;
  fecha: Date;
}

export interface DefensaHorarioResponse {
  success: boolean;
  message: string;
  data?: DefensaHorario;
  dataList?: DefensaHorario[];
}
