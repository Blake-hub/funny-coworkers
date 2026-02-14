module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  collectCoverageFrom: [
    'app/components/**/*.{ts,tsx}',
    'app/services/**/*.{ts,tsx}',
    'app/contexts/**/*.{ts,tsx}',
    'app/providers/**/*.{ts,tsx}',
    'app/hooks/**/*.{ts,tsx}',
    '!app/**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!app/components/board/**',
    '!app/components/card/**',
    '!app/components/layout/**',
  ],
};