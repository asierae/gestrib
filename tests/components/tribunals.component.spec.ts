import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TribunalsComponent } from '../../src/app/components/tribunals/tribunals';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { DefensasService } from '../../src/app/services/defensas.service';
import { AuthService } from '../../src/app/services/auth.service';
import { AulasService } from '../../src/app/services/aulas.service';
import { TranslationService } from '../../src/app/services/translation.service';
import { ProfessorsByPositionService } from '../../src/app/services/professors-by-position.service';

describe('TribunalsComponent', () => {
  let component: TribunalsComponent;
  let fixture: ComponentFixture<TribunalsComponent>;
  let mockDefensasService: jest.Mocked<DefensasService>;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockAulasService: jest.Mocked<AulasService>;
  let mockRouter: jest.Mocked<Router>;
  let mockTranslationService: jest.Mocked<TranslationService>;
  let mockProfessorsService: jest.Mocked<ProfessorsByPositionService>;

  beforeEach(async () => {
    // Create mocks
    mockDefensasService = {
      getDefensas: jest.fn(),
      updateEstado: jest.fn(),
      updateLugar: jest.fn(),
      deleteDefensa: jest.fn(),
      updateProgramacion: jest.fn(),
      updatePresidente: jest.fn(),
      updateVocal: jest.fn(),
      updateCodirector: jest.fn(),
      updateReemplazo: jest.fn(),
    } as any;

    mockAuthService = {
      isAdmin: jest.fn(),
      currentUser: jest.fn(),
    } as any;

    mockAulasService = {
      getAllAulas: jest.fn(),
    } as any;

    mockRouter = {
      navigate: jest.fn(),
    } as any;

    mockTranslationService = {
      getTranslation: jest.fn((key: string) => key),
    } as any;

    mockProfessorsService = {
      getProfessorsByPosition: jest.fn(),
    } as any;

    await TestBed.configureTestingModule({
      imports: [TribunalsComponent, MatSnackBarModule, MatDialogModule],
      providers: [
        { provide: DefensasService, useValue: mockDefensasService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: AulasService, useValue: mockAulasService },
        { provide: Router, useValue: mockRouter },
        { provide: TranslationService, useValue: mockTranslationService },
        { provide: ProfessorsByPositionService, useValue: mockProfessorsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TribunalsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('clearFilters', () => {
    it('should clear all filters', () => {
      component.fromDate = new Date('2024-01-01');
      component.toDate = new Date('2024-12-31');
      component.filterText = 'test';

      component.clearFilters();

      expect(component.fromDate).toBeUndefined();
      expect(component.toDate).toBeUndefined();
      expect(component.filterText).toBe('');
    });
  });

  describe('loadDefensas', () => {
    it('should load defensas successfully', () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: 1,
            estudiante: { nombre: 'Juan', apellidos: 'Pérez', dni: '12345678A' },
            titulo: 'Test Defensa',
            directorTribunal: { nombre: 'Director', apellidos: 'Test' },
            codirectorTribunal: {},
            vocalTribunal: {},
            suplente: {},
            presidente: {},
            fechaDefensa: '2024-01-15',
            horaDefensa: '10:00',
            estado: 'Pendiente',
          },
        ],
      };

      mockDefensasService.getDefensas = jest.fn().mockReturnValue(of(mockResponse));
      mockAuthService.currentUser = jest.fn().mockReturnValue({
        id: 1,
        nombre: 'Admin',
        apellidos: 'User',
      });
      mockAuthService.isAdmin = jest.fn().mockReturnValue(true);

      component.loadDefensas();

      expect(mockDefensasService.getDefensas).toHaveBeenCalled();
    });

    it('should handle error when loading defensas', () => {
      const error = { message: 'Error loading defensas', status: 500 };
      mockDefensasService.getDefensas = jest.fn().mockReturnValue(throwError(() => error));

      component.loadDefensas();

      expect(mockDefensasService.getDefensas).toHaveBeenCalled();
      expect(component.data).toEqual([]);
    });
  });

  describe('filterDefensasByUser', () => {
    it('should return all defensas for admin', () => {
      const allDefensas = [{ id: 1 }, { id: 2 }];
      mockAuthService.currentUser = jest.fn().mockReturnValue({ id: 1 });
      mockAuthService.isAdmin = jest.fn().mockReturnValue(true);

      const result = component.filterDefensasByUser(allDefensas);

      expect(result).toEqual(allDefensas);
    });

    it('should return empty array if no user', () => {
      mockAuthService.currentUser = jest.fn().mockReturnValue(null);

      const result = component.filterDefensasByUser([{ id: 1 }]);

      expect(result).toEqual([]);
    });

    it('should filter defensas for non-admin user', () => {
      const allDefensas = [
        {
          id: 1,
          director: 'Juan Pérez',
          codirector: '',
          president: '',
          vocal: '',
          replacement: '',
        },
        {
          id: 2,
          director: 'Otro Director',
          codirector: '',
          president: '',
          vocal: '',
          replacement: '',
        },
      ];

      mockAuthService.currentUser = jest.fn().mockReturnValue({
        id: 1,
        nombre: 'Juan',
        apellidos: 'Pérez',
      });
      mockAuthService.isAdmin = jest.fn().mockReturnValue(false);

      const result = component.filterDefensasByUser(allDefensas);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('hasActiveFilters', () => {
    it('should return true when fromDate is set', () => {
      component.fromDate = new Date();
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should return true when toDate is set', () => {
      component.toDate = new Date();
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should return true when filterText is not empty', () => {
      component.filterText = 'test';
      expect(component.hasActiveFilters()).toBe(true);
    });

    it('should return false when no filters are active', () => {
      component.fromDate = undefined;
      component.toDate = undefined;
      component.filterText = '';
      expect(component.hasActiveFilters()).toBe(false);
    });
  });

  describe('canSelectHorarios', () => {
    it('should return true if user is director', () => {
      mockAuthService.currentUser = jest.fn().mockReturnValue({
        id: 1,
        nombre: 'Juan',
        apellidos: 'Pérez',
      });

      const row = { director: 'Juan Pérez', vocal: '', president: '' };
      expect(component.canSelectHorarios(row)).toBe(true);
    });

    it('should return false if user is not involved', () => {
      mockAuthService.currentUser = jest.fn().mockReturnValue({
        id: 1,
        nombre: 'Otro',
        apellidos: 'Usuario',
      });

      const row = { director: 'Juan Pérez', vocal: '', president: '' };
      expect(component.canSelectHorarios(row)).toBe(false);
    });
  });
});

