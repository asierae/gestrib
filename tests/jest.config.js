module.exports = {
  preset: 'jest-preset-angular',
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  rootDir: '.',
  testMatch: ['<rootDir>/**/*.spec.ts'],
  collectCoverageFrom: [
    '../src/**/*.ts',
    '!../src/**/*.d.ts',
    '!../src/**/*.module.ts',
    '!../src/main.ts',
    '!../src/**/*.interface.ts',
    '!../src/**/*.model.ts',
    '!../src/**/*.enum.ts'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['html', 'text', 'text-summary'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../src/$1',
    '^@environments/(.*)$': '<rootDir>/../src/environments/$1',
    '^@services/(.*)$': '<rootDir>/../src/app/services/$1',
    '^@components/(.*)$': '<rootDir>/../src/app/components/$1',
    '^@models/(.*)$': '<rootDir>/../src/app/models/$1',
    '^src/(.*)$': '<rootDir>/../src/$1'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@angular|rxjs|@fullcalendar)/)'
  ],
  moduleFileExtensions: ['ts', 'html', 'js', 'json'],
  testEnvironment: 'jsdom',
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/../tsconfig.spec.json',
      stringifyContentPathRegex: '\\.html$'
    }
  }
};

