module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testMatch: ['**/tests/unit/**/*.spec.[jt]s?(x)', '**/__tests__/*.[jt]s?(x)'],
  // https://github.com/facebook/jest/issues/6766
  testURL: 'http://localhost/',
  transformIgnorePatterns: ['/node_modules/'],
  collectCoverage: true,
  moduleNameMapper: {
    '^@tmagic/(.*)$': '<rootDir>/../$1/src/index.ts',
  },
  moduleFileExtensions: ['js', 'json', 'ts'],
  globals: {
    'ts-jest': {
      babelConfig: false,
    },
  },
};
