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

export interface EspecialidadCheckbox {
  id: string;
  label: string;
  checked: boolean;
}

export const ESPECIALIDAD_OPTIONS = {
  [TipoEspecialidad.INGENIERIA_COMPUTACION]: [
    { id: 'hardware_diseño', label: 'Hardwarearen diseinua eta sistema txertatuak / Diseño hardware y sistemas empotrados' },
    { id: 'señal_procesado', label: 'Seinalearen prozes./ Procesado de señal' },
    { id: 'robotica', label: 'Robotika/ Robótica' },
    { id: 'arquitectura', label: 'Konputagailuen arkitek./ Arquitectura de comp.' },
    { id: 'sistemas_operativos', label: 'Sistema eragileak/ Sistemas Operativos' },
    { id: 'redes', label: 'Sareak/ Redes' },
    { id: 'rendimiento', label: 'Sistemen errendimendua/ Rendimiento de sistema' },
    { id: 'mineria_datos', label: 'Datu-meatzaritza / Minería de datos' },
    { id: 'interaccion', label: 'Pertsona eta konp. arteko elkarrekintza / Inter. persona comp.' }
  ],
  [TipoEspecialidad.INGENIERIA_SOFTWARE]: [
    { id: 'desarrollo_software', label: 'Software-garapena / Desarrollo del Software' },
    { id: 'proceso_software', label: 'Software-prozesua / Proceso Software' },
    { id: 'soluciones_empresariales', label: 'Enpresa- eta industria-soluzioak / Soluciones empresariales e industriales' },
    { id: 'metodos_formales', label: 'Metodo formalak software-ingeniaritzan / Métodos formales en ingeniería del software' }
  ],
  [TipoEspecialidad.COMPUTACION]: [
    { id: 'inteligencia_artificial', label: 'Adimen artifiziala / Inteligencia Artificial' },
    { id: 'analisis_datos', label: 'Datu-analisia / Análisis de datos' },
    { id: 'graficos', label: 'Grafikoak / Gráficos' },
    { id: 'robotica', label: 'Robotika/ Robótica' },
    { id: 'computacion_cientifica', label: 'Konputazio zientifikoa/ Computación científica' }
  ]
};
