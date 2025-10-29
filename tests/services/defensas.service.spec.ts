import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DefensasService } from '../../src/app/services/defensas.service';
import { environment } from '../../src/environments/environment';

describe('DefensasService', () => {
  let service: DefensasService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/api/defensas`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DefensasService],
    });

    service = TestBed.inject(DefensasService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDefensas', () => {
    it('should fetch defensas with filters', () => {
      const mockFilters = { page: 1, limit: 10 };
      const mockResponse = {
        success: true,
        data: [
          {
            id: 1,
            titulo: 'Test Defensa',
            estudiante: { nombre: 'Juan', apellidos: 'Pérez' },
          },
        ],
      };

      service.getDefensas(mockFilters).subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.data).toHaveLength(1);
      });

      const req = httpMock.expectOne(`${baseUrl}/get_defensas`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockFilters);
      req.flush(mockResponse);
    });

    it('should fetch defensas without filters', () => {
      const mockResponse = {
        success: true,
        data: [],
      };

      service.getDefensas().subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/get_defensas`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('getDefensaById', () => {
    it('should fetch a defensa by id', () => {
      const defensaId = 1;
      const mockResponse = {
        success: true,
        data: {
          id: 1,
          titulo: 'Test Defensa',
        },
      };

      service.getDefensaById(defensaId).subscribe((response) => {
        expect(response.success).toBe(true);
        expect(response.data.id).toBe(defensaId);
      });

      const req = httpMock.expectOne(`${baseUrl}/${defensaId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createDefensa', () => {
    it('should create a new defensa', () => {
      const mockRequest = {
        curso: '2024-2025',
        grado: 1,
        especialidad: 1,
        titulo: 'Nueva Defensa',
        idioma: 'es',
        estudiante: { id: 1 },
        directorTribunal: { id: 1 },
      } as any;

      const mockResponse = {
        success: true,
        message: 'Defensa creada exitosamente',
      };

      service.createDefensa(mockRequest).subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(baseUrl);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('updateEstado', () => {
    it('should update defensa status', () => {
      const defensaId = 1;
      const newStatus = 'Aprobada';
      const mockResponse = {
        success: true,
        message: 'Estado actualizado',
      };

      service.updateEstado(defensaId, newStatus).subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/${defensaId}/estado`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ estado: newStatus });
      req.flush(mockResponse);
    });
  });

  describe('updateLugar', () => {
    it('should update defensa place', () => {
      const defensaId = 1;
      const newPlace = 'Aula 101';
      const mockResponse = {
        success: true,
        message: 'Lugar actualizado',
      };

      service.updateLugar(defensaId, newPlace).subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/${defensaId}/lugar`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ lugar: newPlace });
      req.flush(mockResponse);
    });
  });

  describe('deleteDefensa', () => {
    it('should delete a defensa', () => {
      const defensaId = 1;
      const mockResponse = {
        success: true,
        message: 'Defensa eliminada',
      };

      service.deleteDefensa(defensaId).subscribe((response) => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${baseUrl}/${defensaId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });
  });
});

