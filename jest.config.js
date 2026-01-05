export const preset = 'ts-jest';
export const testEnvironment = 'node';
export const roots = ['<rootDir>/src'];
export const testMatch = ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'];
export const transform = {
  '^.+\\.ts$': 'ts-jest',
};
export const collectCoverageFrom = [
  'src/**/*.ts',
  '!src/**/*.d.ts',
  '!src/index.ts',
  '!src/config/seed.ts',
];
export const coverageDirectory = 'coverage';
export const coverageReporters = ['text', 'lcov', 'html'];
export const moduleFileExtensions = ['ts', 'js', 'json'];
export const verbose = true;
export const testTimeout = 60000;
export const maxWorkers = 1;
export const setupFilesAfterEnv = ['<rootDir>/src/tests/setup.ts'];
