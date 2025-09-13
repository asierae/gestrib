import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Profesor, TipoEspecialidad } from '../models/profesor.model';

@Injectable({
  providedIn: 'root'
})
export class ProfesoresService {

  /**
   * Obtiene todos los profesores
   */
  getProfesores(): Observable<Profesor[]> {
    return new Observable(observer => {
      setTimeout(() => {
        const profesores: Profesor[] = [
          {
            id: 1,
            nombre: 'Dr. Juan',
            apellidos: 'Martínez García',
            email: 'juan.martinez@ehu.eus',
            tipoEspecialidad: TipoEspecialidad.INGENIERIA_COMPUTACION,
            dni: '12345678A',
            activo: true
          },
          {
            id: 2,
            nombre: 'Dra. María',
            apellidos: 'López Fernández',
            email: 'maria.lopez@ehu.eus',
            tipoEspecialidad: TipoEspecialidad.INGENIERIA_SOFTWARE,
            dni: '87654321B',
            activo: true
          },
          {
            id: 3,
            nombre: 'Dr. Carlos',
            apellidos: 'Ruiz Sánchez',
            email: 'carlos.ruiz@ehu.eus',
            tipoEspecialidad: TipoEspecialidad.COMPUTACION,
            dni: '11223344C',
            activo: true
          },
          {
            id: 4,
            nombre: 'Dra. Ana',
            apellidos: 'García Pérez',
            email: 'ana.garcia@ehu.eus',
            tipoEspecialidad: TipoEspecialidad.INGENIERIA_COMPUTACION,
            dni: '44332211D',
            activo: true
          },
          {
            id: 5,
            nombre: 'Dr. David',
            apellidos: 'Fernández López',
            email: 'david.fernandez@ehu.eus',
            tipoEspecialidad: TipoEspecialidad.INGENIERIA_SOFTWARE,
            dni: '55667788E',
            activo: true
          },
          {
            id: 6,
            nombre: 'Dra. Laura',
            apellidos: 'Sánchez Ruiz',
            email: 'laura.sanchez@ehu.eus',
            tipoEspecialidad: TipoEspecialidad.COMPUTACION,
            dni: '99887766F',
            activo: true
          }
        ];
        observer.next(profesores);
        observer.complete();
      }, 300);
    });
  }

  /**
   * Obtiene profesores por especialidad
   */
  getProfesoresByEspecialidad(especialidad: TipoEspecialidad): Observable<Profesor[]> {
    return new Observable(observer => {
      this.getProfesores().subscribe(profesores => {
        const filtered = profesores.filter(p => p.tipoEspecialidad === especialidad);
        observer.next(filtered);
        observer.complete();
      });
    });
  }
}
