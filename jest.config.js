/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/integration'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.integration.test.ts'],
  clearMocks: true,
  moduleFileExtensions: ['ts', 'js', 'json'],
};
