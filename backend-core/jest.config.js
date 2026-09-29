module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  // DB-backed integration tests share one PostgreSQL — keep them serial.
  maxWorkers: 1,
  clearMocks: true,
};
