module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    // process *.vue files with vue-jest
    '^.+\\.vue$': '@vue/vue3-jest',
    '.+\\.(css|styl|less|sass|scss|jpg|jpeg|png|svg|gif|eot|otf|webp|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|avif)$':
      'jest-transform-stub',
    '^.+\\.jsx?$': 'babel-jest',
    '^.+\\.tsx?$': 'ts-jest',
  },
  // serializer for snapshots
  snapshotSerializers: ['jest-serializer-vue'],
  testMatch: ['**/tests/unit/**/*.spec.[jt]s?(x)', '**/__tests__/*.[jt]s?(x)'],
  // https://github.com/facebook/jest/issues/6766
  testURL: 'http://localhost/',
  transformIgnorePatterns: ['/node_modules/(?!lodash-es|vue)'],
  collectCoverage: true,
  moduleNameMapper: {
    '^@tmagic/(.*)$': '<rootDir>/../$1/src/index.ts',
    '^@editor/(.*)$': '<rootDir>/src/$1',
    '^lodash-es$': 'lodash',
  },
  moduleFileExtensions: ['js', 'jsx', 'json', 'vue', 'ts', 'tsx'],
  testPathIgnorePatterns: ['/magic-admin/'],
  globals: {
    'ts-jest': {
      babelConfig: false,
    },
  },
};
