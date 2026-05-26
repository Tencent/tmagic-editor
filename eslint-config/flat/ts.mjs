export default {
  files: ['**/*.ts', '**/*.tsx'],
  rules: {
    'brace-style': 'off',
    'no-empty-function': 'off',
    // https://github.com/typescript-eslint/typescript-eslint/issues/491
    'no-invalid-this': 'off',
    'no-magic-numbers': 'off',
    'react/sort-comp': 'off',
    'func-call-spacing': 'off',
    'comma-spacing': 'off',
    'dot-notation': 'off',
    indent: 'off',
    'keyword-spacing': 'off',
    camelcase: 'off',
    'no-underscore-dangle': 'off',
    'no-array-constructor': 'off',
    'no-dupe-class-members': 'off',
    'no-undef': 'off',
    'no-unused-vars': 'off',
    'no-useless-constructor': 'off',
    quotes: 'off',
    semi: 'off',
    'space-before-function-paren': 'off',
    // https://github.com/typescript-eslint/typescript-eslint/issues/600
    'spaced-comment': ['error', 'always', { markers: ['/'] }],
    /**
     * 重载的函数必须写在一起
     * @reason 增加可读性
     */
    '@typescript-eslint/adjacent-overload-signatures': 'error',
    /** 同 JS 规则的 TS 版本 */
    '@stylistic/ts/brace-style': 'error',
    /** 同 JS 规则的 TS 版本 */
    '@stylistic/comma-spacing': [
      'error',
      {
        before: false,
        after: true,
      },
    ],
    /**
     * 类型断言必须使用 as Type，禁止使用 <Type>，禁止对对象字面量进行类型断言（断言成 any 是允许的）
     * @reason <Type> 容易被理解为 jsx
     */
    '@typescript-eslint/consistent-type-assertions': [
      'error',
      {
        assertionStyle: 'as',
        objectLiteralTypeAssertions: 'never',
      },
    ],
    /**
     * 优先使用 interface 而不是 type
     */
    '@typescript-eslint/consistent-type-definitions': 'off',
    /** 同 JS 规则的 TS 版本 */
    '@typescript-eslint/dot-notation': 'warn',
    /**
     * 必须设置类的成员的可访问性
     * @reason 将不需要公开的成员设为私有的，可以增强代码的可理解性，对文档输出也很友好
     */
    '@typescript-eslint/explicit-member-accessibility': 'off',
    /**
     * 要求或禁止在函数标识符和其调用之间有空格
     */
    '@stylistic/ts/func-call-spacing': ['error', 'never'],
    /** 同 JS 规则的 TS 版本 */
    '@stylistic/ts/indent': [
      'warn',
      2,
      {
        SwitchCase: 1,
        VariableDeclarator: 1,
        outerIIFEBody: 1,
        FunctionDeclaration: {
          parameters: 1,
          body: 1,
        },
        FunctionExpression: {
          parameters: 1,
          body: 1,
        },
        CallExpression: {
          arguments: 1,
        },
        ArrayExpression: 1,
        ObjectExpression: 1,
        ImportDeclaration: 1,
        flatTernaryExpressions: false,
        ignoredNodes: [
          'JSXElement',
          'JSXElement > *',
          'JSXAttribute',
          'JSXIdentifier',
          'JSXNamespacedName',
          'JSXMemberExpression',
          'JSXSpreadAttribute',
          'JSXExpressionContainer',
          'JSXOpeningElement',
          'JSXClosingElement',
          'JSXFragment',
          'JSXOpeningFragment',
          'JSXClosingFragment',
          'JSXText',
          'JSXEmptyExpression',
          'JSXSpreadChild',
        ],
        ignoreComments: false,
      },
    ],
    /** 同 JS 规则的 TS 版本 */
    '@stylistic/ts/keyword-spacing': [
      'error',
      {
        overrides: {
          if: {
            after: true,
          },
          for: {
            after: true,
          },
          while: {
            after: true,
          },
          else: {
            after: true,
          },
        },
        before: true,
        after: true,
      },
    ],
    /**
     * 指定类成员的排序规则
     * @reason 优先级：
     * 1. static > instance
     * 2. field > constructor > method
     * 3. public > protected > private
     */
    '@typescript-eslint/member-ordering': [
      'error',
      {
        default: [
          'public-static-field',
          'protected-static-field',
          'private-static-field',
          'static-field',
          'public-static-method',
          'protected-static-method',
          'private-static-method',
          'static-method',
          'public-instance-field',
          'protected-instance-field',
          'private-instance-field',
          'public-field',
          'protected-field',
          'private-field',
          'instance-field',
          'field',
          'constructor',
          'public-instance-method',
          'protected-instance-method',
          'private-instance-method',
          'public-method',
          'protected-method',
          'private-method',
          'instance-method',
          'method',
        ],
      },
    ],
    /**
     * 接口中的方法必须用属性的方式定义
     */
    '@typescript-eslint/method-signature-style': 'off',
    /** 代替 JS 规则 camelCase 的 TS 规则 */
    '@typescript-eslint/naming-convention': [
      'warn',
      {
        selector: 'function',
        format: ['camelCase', 'PascalCase'],
      },
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE'],
      },
      {
        selector: 'variable',
        modifiers: ['global'],
        format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
      },
      {
        selector: 'variable',
        format: ['camelCase', 'PascalCase'],
        types: ['function'],
      },
      {
        selector: 'variable',
        modifiers: ['exported'],
        format: ['UPPER_CASE'],
        types: ['boolean', 'string', 'number', 'array'],
      },
      {
        selector: 'variable',
        modifiers: ['exported'],
        format: ['camelCase', 'PascalCase'],
        types: ['function'],
      },
      {
        selector: ['class', 'typeLike'],
        format: ['PascalCase'],
      },
      {
        selector: ['classMethod', 'classProperty'],
        leadingUnderscore: 'forbid',
        trailingUnderscore: 'forbid',
        format: ['camelCase'],
      },
    ],
    /** 同 JS 规则的 TS 版本 */
    '@typescript-eslint/no-array-constructor': 'error',
    /** 同 JS 规则的 TS 版本 */
    '@typescript-eslint/no-dupe-class-members': 'error',
    /**
     * 禁止定义空的接口
     */
    '@typescript-eslint/no-empty-interface': 'error',
    /**
     * 禁止给一个初始化时直接赋值为 number, string 的变量显式的声明类型
     * @reason 可以简化代码
     */
    '@typescript-eslint/no-inferrable-types': 'warn',
    /**
     * 禁止对 promise 的误用，详见示例
     */
    '@typescript-eslint/no-misused-promises': [
      'error',
      {
        checksConditionals: true,
      },
    ],
    /**
     * 禁止使用 namespace 来定义命名空间
     * @reason 使用 es6 引入模块，才是更标准的方式。
     * 但是允许使用 declare namespace ... {} 来定义外部命名空间
     */
    '@typescript-eslint/no-namespace': [
      'error',
      {
        allowDeclarations: true,
        allowDefinitionFiles: true,
      },
    ],
    /**
     * 禁止在 optional chaining 之后使用 non-null 断言（感叹号）
     * @reason optional chaining 后面的属性一定是非空的
     */
    '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',
    /**
     * 禁止给类的构造函数的参数添加修饰符
     */
    '@typescript-eslint/no-parameter-properties': 'off',
    /**
     * 禁止使用 require
     * @reason 统一使用 import 来引入模块，特殊情况使用单行注释允许 require 引入
     */
    '@typescript-eslint/no-require-imports': 'error',
    /**
     * 禁止将 this 赋值给其他变量，除非是解构赋值
     */
    '@typescript-eslint/no-this-alias': [
      'error',
      {
        allowDestructuring: true,
      },
    ],
    /**
     * 禁止无用的表达式
     */
    '@typescript-eslint/no-unused-expressions': [
      'error',
      {
        allowShortCircuit: true,
        allowTernary: true,
        allowTaggedTemplates: true,
      },
    ],
    /** 同 JS 规则的 TS 版本 */
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'after-used',
        ignoreRestSiblings: true,
        argsIgnorePattern: '^_.+',
        varsIgnorePattern: '^_.+',
      },
    ],
    /**
     * 禁止出现没必要的 constructor
     */
    '@typescript-eslint/no-useless-constructor': 'warn',
    /**
     * 使用 for 循环遍历数组时，如果索引仅用于获取成员，则必须使用 for of 循环替代 for 循环
     * @reason for of 循环更加易读
     */
    '@typescript-eslint/prefer-for-of': 'warn',
    /**
     * 使用函数类型别名替代包含函数调用声明的接口
     */
    '@typescript-eslint/prefer-function-type': 'warn',
    /**
     * 禁止使用 module 来定义命名空间
     * @reason module 已成为 js 的关键字
     */
    '@typescript-eslint/prefer-namespace-keyword': 'error',
    /**
     * 使用 optional chaining 替代 &&
     */
    '@typescript-eslint/prefer-optional-chain': 'error',
    /** 同 JS 规则的 TS 版本 */
    '@stylistic/ts/quotes': [
      'warn',
      'single',
      {
        allowTemplateLiterals: false,
      },
    ],
    /** 同 JS 规则的 TS 版本 */
    '@stylistic/ts/semi': ['error', 'always'],
    /** 同 JS 规则的 TS 版本 */
    '@stylistic/ts/space-before-function-paren': [
      'error',
      {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always',
      },
    ],
    /**
     * 禁止使用三斜杠导入文件
     * @reason 三斜杠是已废弃的语法，但在类型声明文件中还是可以使用的
     */
    '@typescript-eslint/triple-slash-reference': [
      'error',
      {
        path: 'never',
        types: 'always',
        lib: 'always',
      },
    ],
    /**
     * 禁止匿名 default class / default function 导出
     * @reason 匿名 default 导出在 dts 聚合（rolldown / api-extractor / vue-tsc 等）时会被命名为
     * `export_default`，导致跨包继承链在 .vue / .tsx 文件下解析失败，
     * 父类成员（如 EventEmitter 的 on/off）无法被 ts-plugin 推断出来。
     * 必须使用具名形式：先 `export class Foo {}` 再 `export default Foo;`，
     * 或 `export default class Foo {}`，确保类型聚合后保留原标识符。
     *
     * 注：此处需要重申 base.mjs 中已有的 no-restricted-syntax 选择器
     * （ForIn / Labeled / With），否则在 .ts/.tsx 下会被本规则整体覆盖。
     */
    'no-restricted-syntax': [
      'error',
      {
        selector: 'ExportDefaultDeclaration > ClassDeclaration[id=null]',
        message:
          '禁止匿名 default class 导出。请改为具名形式（如 `export default class Foo extends Bar {}`），否则聚合 dts 会丢失类型信息，导致跨包继承的成员（on/off/emit 等）无法被推断。',
      },
      {
        selector: 'ExportDefaultDeclaration > FunctionDeclaration[id=null]',
        message:
          '禁止匿名 default function 导出。请改为具名形式（如 `export default function foo() {}`），便于 dts 聚合保留原标识符与跨包类型推断。',
      },
      {
        selector: 'ForInStatement',
        message:
          'for..in loops iterate over the entire prototype chain, which is virtually never what you want. Use Object.{keys,values,entries}, and iterate over the resulting array.',
      },
      {
        selector: 'LabeledStatement',
        message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
      },
      {
        selector: 'WithStatement',
        message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
      },
    ],
    /**
     * 在类型注释周围需要一致的间距
     */
    '@stylistic/ts/type-annotation-spacing': 'error',
    /**
     * interface 和 type 定义时必须声明成员的类型
     */
    '@typescript-eslint/typedef': [
      'error',
      {
        arrayDestructuring: false,
        arrowParameter: false,
        memberVariableDeclaration: false,
        objectDestructuring: false,
        parameter: false,
        propertyDeclaration: true,
        variableDeclaration: false,
      },
    ],
    /**
     * 函数重载时，若能通过联合类型将两个函数的类型声明合为一个，则使用联合类型而不是两个函数声明
     */
    '@typescript-eslint/unified-signatures': 'error',
  },
};
