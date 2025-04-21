import { rules } from 'eslint-plugin-import';

export default {
  plugins: {
    import: {
      meta: { name: 'eslint-plugin-import' },
      rules,
    },
  },
  files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
  languageOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    /**
     * 导入语句前不允许有任何非导入语句
     */
    'import/first': 'error',
    /**
     * 禁止重复导入模块
     */
    'import/no-duplicates': 'error',
    /**
     * 禁止使用 let 导出
     */
    'import/no-mutable-exports': 'warn',
    /**
     * 禁用导入的模块时使用 webpack 特有的语法（感叹号）
     */
    'import/no-webpack-loader-syntax': 'warn',
    /**
     * 当只有一个导出时，必须使用 export default 来导出
     */
    'import/prefer-default-export': 'off',
  },
};
