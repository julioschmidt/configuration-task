module.exports = {
    preset: 'ts-jest', // Usa ts-jest para processar TypeScript
    testEnvironment: 'node', // Ambiente de teste Node.js
    testMatch: ['**/?(*.)+(spec|test).ts'], // Encontra arquivos .test.ts ou .spec.ts
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    transform: {
      '^.+\\.ts$': 'ts-jest', // Transforma arquivos .ts com ts-jest
    },
    setupFilesAfterEnv: ['<rootDir>/src/singleton.ts'],
  };