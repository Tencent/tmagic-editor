export default {
  collectCoverage: true,
  coverageProvider: 'v8',
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
  },
};
