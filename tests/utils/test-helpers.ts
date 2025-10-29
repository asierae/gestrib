/**
 * Utilidades y helpers para los tests
 */

import { ComponentFixture } from '@angular/core/testing';

/**
 * Helper para esperar a que Angular complete el ciclo de detección de cambios
 */
export function waitForAsync(fixture: ComponentFixture<any>): Promise<void> {
  return new Promise((resolve) => {
    fixture.detectChanges();
    setTimeout(() => {
      fixture.detectChanges();
      resolve();
    }, 0);
  });
}

/**
 * Crea un mock de objeto con métodos
 */
export function createMockService<T>(methods: string[]): jest.Mocked<T> {
  const mock: any = {};
  methods.forEach((method) => {
    mock[method] = jest.fn();
  });
  return mock;
}

/**
 * Helper para simular localStorage
 */
export class LocalStorageMock {
  private store: { [key: string]: string } = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value.toString();
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

/**
 * Helper para crear datos mock de usuarios
 */
export function createMockUser(overrides: Partial<any> = {}): any {
  return {
    id: 1,
    nombre: 'Test',
    apellidos: 'User',
    email: 'test@example.com',
    role: 'Administrador',
    idIdioma: 1,
    ...overrides,
  };
}

/**
 * Helper para crear datos mock de defensas
 */
export function createMockDefensa(overrides: Partial<any> = {}): any {
  return {
    id: 1,
    titulo: 'Test Defensa',
    estudiante: {
      id: 1,
      nombre: 'Juan',
      apellidos: 'Pérez',
      dni: '12345678A',
    },
    directorTribunal: {
      id: 1,
      nombre: 'Director',
      apellidos: 'Test',
    },
    codirectorTribunal: {},
    vocalTribunal: {},
    suplente: {},
    presidente: {},
    fechaDefensa: '2024-01-15',
    horaDefensa: '10:00',
    estado: 'Pendiente',
    ...overrides,
  };
}

