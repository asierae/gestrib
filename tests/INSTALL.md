# Instalación de Jest para Tests

Para usar los tests con Jest, necesitas instalar las dependencias necesarias y configurar el proyecto.

## Paso 1: Instalar Dependencias

Ejecuta el siguiente comando en la raíz del proyecto:

```bash
npm install --save-dev jest jest-preset-angular @types/jest ts-jest @angular-builders/jest
```

## Paso 2: Actualizar package.json

Agrega estos scripts a tu `package.json` en la sección `scripts`:

```json
{
  "scripts": {
    "test:jest": "jest --config tests/jest.config.js",
    "test:jest:watch": "jest --config tests/jest.config.js --watch",
    "test:jest:coverage": "jest --config tests/jest.config.js --coverage"
  }
}
```

## Paso 3: Actualizar tsconfig.spec.json (Opcional)

Si quieres usar Jest en lugar de Jasmine, puedes actualizar `tsconfig.spec.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/spec",
    "types": [
      "jest",
      "node"
    ],
    "esModuleInterop": true
  },
  "include": [
    "src/**/*.ts",
    "tests/**/*.ts"
  ]
}
```

## Paso 4: Ejecutar Tests

Una vez instaladas las dependencias, puedes ejecutar los tests:

```bash
# Ejecutar todos los tests
npm run test:jest

# Modo watch (se ejecutan automáticamente al cambiar archivos)
npm run test:jest:watch

# Con cobertura
npm run test:jest:coverage
```

## Nota

Los tests están en una carpeta separada (`tests/`) para no interferir con los tests existentes de Jasmine/Karma que usa Angular CLI por defecto.

