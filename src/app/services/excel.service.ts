import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { Estudiante, EstudianteDisplay } from '../models/estudiante.model';
import { AlumnosService } from './alumnos.service';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  private http = inject(HttpClient);
  private alumnosService = inject(AlumnosService);

  /**
   * Carga los estudiantes desde la API de Alumnos
   */
  loadEstudiantes(): Observable<EstudianteDisplay[]> {
    console.log('ExcelService: Iniciando carga de estudiantes desde API...');
    return this.alumnosService.getAllAlumnos().pipe(
      map((alumnos: any[]) => {
        console.log('ExcelService: Datos recibidos de la API:', alumnos);
        console.log('ExcelService: Total de alumnos recibidos:', alumnos?.length || 0);
        console.log('ExcelService: Primer alumno de la API:', alumnos?.[0]);
        
        if (!alumnos || alumnos.length === 0) {
          console.warn('ExcelService: No se recibieron alumnos de la API, usando datos mock');
          return this.getEstudiantesMockData();
        }
        
        const estudiantesMapeados = alumnos.map((alumno, index) => {
          // Los datos pueden estar en el nivel superior o anidados en 'alumno'
          const datosAlumno = alumno.alumno || alumno;
          
          // Log para diagnosticar datos problemáticos
          if (!datosAlumno.nombre || !datosAlumno.apellidos) {
            console.warn(`ExcelService: Alumno ${index} con datos faltantes:`, {
              nombre: datosAlumno.nombre,
              apellidos: datosAlumno.apellidos,
              dni: datosAlumno.dni,
              alumno: alumno
            });
          }
          
          // Validar y limpiar datos (usando minúsculas)
          const nombre = datosAlumno.nombre || '';
          const apellidos = datosAlumno.apellidos || '';
          const dni = datosAlumno.dni || '';
          const titulacion = datosAlumno.titulacion || '';
          const asignatura = datosAlumno.asignatura || 'Trabajo Fin de Grado';
          const creditosSup = datosAlumno.creditosSup || 0;
          const mediaExpediente = datosAlumno.mediaExpediente || 0;
          
          // Dividir apellidos de forma segura
          const apellidosArray = apellidos.split(' ').filter((ap: string) => ap.trim() !== '');
          const apellido1 = apellidosArray[0] || '';
          const apellido2 = apellidosArray.slice(1).join(' ') || '';
          
          // Generar email de forma segura
          const emailBase = `${nombre.toLowerCase()}.${apellido1.toLowerCase()}`.replace(/[^a-z0-9.]/g, '');
          const email = emailBase ? `${emailBase}@estudiante.ehu.eus` : 'sin.email@estudiante.ehu.eus';
          
          return {
            nombreCompleto: `${nombre} ${apellidos}`.trim(),
            nombre: nombre,
            apellido1: apellido1,
            apellido2: apellido2,
            email: email,
            dni: dni,
            titulacion: titulacion,
            asignatura: asignatura,
            creditosSup: creditosSup,
            mediaExpediente: mediaExpediente
          };
        });
        
        // Verificar si todos los estudiantes tienen datos vacíos
        const estudiantesConDatos = estudiantesMapeados.filter(est => 
          est.nombreCompleto && est.nombreCompleto.trim() !== ''
        );
        
        console.log(`ExcelService: ${estudiantesConDatos.length} estudiantes con datos válidos de ${estudiantesMapeados.length} total`);
        
        if (estudiantesConDatos.length === 0) {
          console.warn('ExcelService: Todos los estudiantes tienen datos vacíos, usando datos mock');
          return this.getEstudiantesMockData();
        }
        
        console.log('ExcelService: Usando datos reales de la API');
        return estudiantesMapeados;
      }),
      catchError(error => {
        console.error('ExcelService: Error al cargar estudiantes desde API:', error);
        console.log('ExcelService: Usando datos mock como fallback');
        return of(this.getEstudiantesMockData());
      })
    );
  }

  /**
   * Datos de ejemplo para estudiantes (hasta implementar lectura de Excel)
   */
  private getEstudiantesMockData(): EstudianteDisplay[] {
    return [
      {
        nombreCompleto: 'Juan Pérez García',
        nombre: 'Juan',
        apellido1: 'Pérez',
        apellido2: 'García',
        email: 'juan.perez@estudiante.ehu.eus',
        dni: '12345678A',
        titulacion: 'Grado en Ingeniería Informática',
        asignatura: 'Trabajo Fin de Grado',
        creditosSup: 240,
        mediaExpediente: 8.5
      },
      {
        nombreCompleto: 'María López Fernández',
        nombre: 'María',
        apellido1: 'López',
        apellido2: 'Fernández',
        email: 'maria.lopez@estudiante.ehu.eus',
        dni: '87654321B',
        titulacion: 'Grado en Inteligencia Artificial',
        asignatura: 'Trabajo Fin de Grado',
        creditosSup: 240,
        mediaExpediente: 9.2
      },
      {
        nombreCompleto: 'Carlos Ruiz Martínez',
        nombre: 'Carlos',
        apellido1: 'Ruiz',
        apellido2: 'Martínez',
        email: 'carlos.ruiz@estudiante.ehu.eus',
        dni: '11223344C',
        titulacion: 'Grado en Ingeniería Informática',
        asignatura: 'Trabajo Fin de Grado',
        creditosSup: 240,
        mediaExpediente: 7.8
      }
    ];
  }

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
