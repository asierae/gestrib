import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Estudiante, EstudianteDisplay } from '../models/estudiante.model';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  private http = inject(HttpClient);

  /**
   * Carga los estudiantes desde el archivo Excel
   */
  loadEstudiantes(): Observable<EstudianteDisplay[]> {
    const currentYear = new Date().getFullYear();
    const excelPath = `/assets/sheets/alumnos_${currentYear}.xlsx`;
    
    // Por ahora retornamos datos de ejemplo hasta que se implemente la lectura de Excel
    return this.getEstudiantesMock();
  }

  /**
   * Datos de ejemplo para estudiantes (hasta implementar lectura de Excel)
   */
  private getEstudiantesMock(): Observable<EstudianteDisplay[]> {
    const estudiantes: EstudianteDisplay[] = [
      {
        nombreCompleto: 'Juan Pérez García',
        nombre: 'Juan',
        apellido1: 'Pérez',
        apellido2: 'García',
        email: 'juan.perez@estudiante.ehu.eus'
      },
      {
        nombreCompleto: 'María López Fernández',
        nombre: 'María',
        apellido1: 'López',
        apellido2: 'Fernández',
        email: 'maria.lopez@estudiante.ehu.eus'
      },
      {
        nombreCompleto: 'Carlos Ruiz Martínez',
        nombre: 'Carlos',
        apellido1: 'Ruiz',
        apellido2: 'Martínez',
        email: 'carlos.ruiz@estudiante.ehu.eus'
      },
      {
        nombreCompleto: 'Ana García Sánchez',
        nombre: 'Ana',
        apellido1: 'García',
        apellido2: 'Sánchez',
        email: 'ana.garcia@estudiante.ehu.eus'
      },
      {
        nombreCompleto: 'David Martín Rodríguez',
        nombre: 'David',
        apellido1: 'Martín',
        apellido2: 'Rodríguez',
        email: 'david.martin@estudiante.ehu.eus'
      }
    ];

    return new Observable(observer => {
      setTimeout(() => {
        observer.next(estudiantes);
        observer.complete();
      }, 500);
    });
  }
}
