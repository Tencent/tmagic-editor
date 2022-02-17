module.exports = {
  preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
  transform: {
    '^.+\\.vue$': 'vue-jest',
  },
  transformIgnorePatterns: ['/node_modules/(?!lodash-es|vue)'],
  collectCoverage: true,
  moduleNameMapper: {
    '^@tmagic/(.*)$': '<rootDir>/packages/$1/src/index.ts',
    '^@editor/(.*)$': '<rootDir>/packages/editor/src/$1',
    '^lodash-es$': 'lodash',
  },
  moduleFileExtensions: ['js', 'jsx', 'json', 'vue', 'ts', 'tsx'],
  testPathIgnorePatterns: ['/magic-admin/'],
};
