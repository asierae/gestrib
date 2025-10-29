# Tests con Jest

Este directorio contiene los tests unitarios del proyecto usando Jest.

## Configuración

### Instalación de dependencias

Primero, asegúrate de tener Jest y las dependencias necesarias instaladas:

```bash
npm install --save-dev jest jest-preset-angular @types/jest ts-jest
```

### Configuración en package.json

Agrega estos scripts a tu `package.json`:

```json
{
  "scripts": {
    "test:jest": "jest",
    "test:jest:watch": "jest --watch",
    "test:jest:coverage": "jest --coverage"
  }
}
```

## Estructura de Tests

```
tests/
├── jest.config.js              # Configuración de Jest
├── setup-jest.ts               # Configuración inicial para Jest
├── components/                 # Tests de componentes
│   ├── tribunals.component.spec.ts
│   └── login.component.spec.ts
├── services/                   # Tests de servicios
│   ├── auth.service.spec.ts
│   └── defensas.service.spec.ts
└── README.md                   # Este archivo
```

## Ejecutar Tests

### Ejecutar todos los tests
```bash
npm run test:jest
```

### Ejecutar en modo watch
```bash
npm run test:jest:watch
```

### Ejecutar con coverage
```bash
npm run test:jest:coverage
```

### Ejecutar un archivo específico
```bash
npm run test:jest tribunals.component.spec.ts
```

## Tests Incluidos

### Componentes

#### TribunalsComponent
- ✅ Creación del componente
- ✅ Limpieza de filtros
- ✅ Carga de defensas
- ✅ Filtrado de defensas por usuario
- ✅ Verificación de filtros activos
- ✅ Permisos para seleccionar horarios

#### LoginComponent
- ✅ Creación del componente
- ✅ Validación del formulario
- ✅ Envío de login
- ✅ Manejo de errores
- ✅ Navegación después del login
- ✅ Actualización de idioma

### Servicios

#### AuthService
- ✅ Verificación de login
- ✅ Obtener usuario actual
- ✅ Verificación de admin
- ✅ Login de administración
- ✅ Logout
- ✅ Refresh token

#### DefensasService
- ✅ Obtener defensas con filtros
- ✅ Obtener defensa por ID
- ✅ Crear defensa
- ✅ Actualizar estado
- ✅ Actualizar lugar
- ✅ Eliminar defensa

## Escribir Nuevos Tests

### Estructura básica de un test

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { YourComponent } from '../../src/app/components/your/your.component';

describe('YourComponent', () => {
  let component: YourComponent;
  let fixture: ComponentFixture<YourComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [YourComponent],
      providers: [
        // Mock providers aquí
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(YourComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Más tests aquí...
});
```

## Mocking

Los tests usan mocks para:
- Servicios HTTP (HttpTestingController)
- Router
- Servicios de traducción
- LocalStorage
- Otros servicios externos

## Coverage

Para ver el reporte de cobertura:
```bash
npm run test:jest:coverage
```

El reporte se generará en la carpeta `coverage/`.

## Notas

- Los tests están separados del código fuente principal
- Se usa `jest-preset-angular` para la integración con Angular
- Los mocks se crean con Jest para simular dependencias
- Se mantienen solo `console.error` en el código de producción

