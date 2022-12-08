module.exports = {
  env: {
    node: true,
    browser: true,
  },
  globals: {
    describe: true,
    it: true,
    expect: true,
    jest: true,
    beforeEach: true,
  },
  parser:  '@typescript-eslint/parser',
  extends: [
    'eslint-config-tencent',
    'eslint-config-tencent/ts',
    './prettier',
  ],
  plugins: [
    '@typescript-eslint',
    'simple-import-sort',
  ],
  ignorePatterns: ['.eslintrc.js','/assets/*','/tests/*','/coverage/*'],
  rules: {
    'no-param-reassign': 'off',
    'simple-import-sort/imports': [
      'error', {
        groups: [
          // Node.js builtins. You could also generate this regex if you use a `.js` config.
          // For example: `^(${require('module').builtinModules.join('|')})(/|$)`
          [
            '^(assert|buffer|child_process|cluster|console|constants|crypto|dgram|dns|domain|events|fs|http|https|module|net|os|path|punycode|querystring|readline|repl|stream|string_decoder|sys|timers|tls|tty|url|util|vm|zlib|freelist|v8|process|async_hooks|http2|perf_hooks)(/.*|$)',
          ],
          // Packages. `react|vue` related packages come first.
          ['^(react|vue|vite)', '^@?\\w'],
          ['^(@tmagic)(/.*|$)'],
          // Internal packages.
          ['^(@|@src|@tests)(/.*|$)'],
          // Side effect imports.
          ['^\\u0000'],
          // Parent imports. Put `..` last.
          ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
          // Other relative imports. Put same-folder imports and `.` last.
          ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
          // Style imports.
          ['^.+\\.s?css$'],
        ],
      },
    ],
  },
};
