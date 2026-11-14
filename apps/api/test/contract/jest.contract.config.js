/** @type {import('jest').Config} */
module.exports = {
  rootDir: '../..',
  testEnvironment: 'node',
  transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
  testMatch: ['<rootDir>/test/contract/**/*.contract.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
};
