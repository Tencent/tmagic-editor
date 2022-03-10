module.exports = {
  preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
  transform: {
    '^.+\\.vue$': 'vue-jest',
  },
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },
  collectCoverage: true,
  transformIgnorePatterns: ['/node_modules/(?!lodash-es/.*)'],
  collectCoverageFrom: ['src/views/*.{ts,vue}', 'src/components/*.{ts,vue}'],
};
