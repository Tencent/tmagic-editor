export default {
  rules: {
    /**
     * 不要在中括号中添加空格
     */
    'array-bracket-spacing': ['error', 'never'],
    /**
     * 数组的方法除了 forEach 之外，回调函数必须有返回值
     */
    'array-callback-return': 'warn',
    /**
     * 要求箭头函数体使用大括号
     */
    'arrow-body-style': ['warn', 'as-needed'],
    /**
     * 要求箭头函数的参数使用圆括号
     */
    'arrow-parens': [
      'warn',
      'as-needed',
      {
        requireForBlockBody: true,
      },
    ],
    /**
     * 强制箭头函数的箭头前后使用一致的空格
     */
    'arrow-spacing': 'warn',
    /**
     * 要求打开的块标志和同一行上的标志拥有一致的间距。此规则还会在同一行关闭的块标记和前边的标记强制实施一致的间距。
     */
    'block-spacing': 'error',
    /**
     * 强制在代码块中使用一致的大括号风格
     */
    'brace-style': 'error',
    /**
     * 使用驼峰命名法（camelCase）命名对象、函数和实例。
     */
    camelcase: [
      'error',
      {
        ignoreDestructuring: true,
        properties: 'never',
      },
    ],
    /**
     * 添加尾随逗号
     */
    'comma-dangle': ['warn', 'always-multiline'],
    /**
     * 强制在逗号前后使用一致的空格
     */
    'comma-spacing': [
      'error',
      {
        before: false,
        after: true,
      },
    ],
    /**
     * 强制使用一致的逗号风格
     */
    'comma-style': ['error', 'last'],
    /**
     * 强制在计算的属性的方括号中使用一致的空格
     */
    'computed-property-spacing': ['warn', 'never'],
    /**
     * 禁止使用 foo['bar']，必须写成 foo.bar
     */
    'dot-notation': 'warn',
    /**
     * 要求或禁止文件末尾存在空行
     */
    'eol-last': ['error', 'always'],
    /**
     * 必须使用 === 或 !==，禁止使用 == 或 !=
     */
    eqeqeq: ['warn', 'always'],
    /**
     * 要求或禁止在函数标识符和其调用之间有空格
     */
    'func-call-spacing': ['error', 'never'],
    /**
     * 必须只使用函数声明或只使用函数表达式
     */
    'func-style': ['off', 'expression'],
    /**
     * 强制在函数括号内使用一致的换行
     */
    'function-paren-newline': ['warn', 'multiline'],
    /**
     * 强制 generator 函数中 * 号周围使用一致的空格
     */
    'generator-star-spacing': [
      'warn',
      {
        before: false,
        after: true,
      },
    ],
    /**
     * 限制变量名长度
     */
    'id-length': 'off',
    /**
     * 强制隐式返回的箭头函数体的位置
     */
    'implicit-arrow-linebreak': ['warn', 'beside'],
    /**
     * 使用 2 个空格缩进
     */
    indent: [
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
    /**
     * 强制在对象字面量的属性中键和值之间使用一致的间距
     */
    'key-spacing': 'error',
    /**
     * 强制在关键字前后使用一致的空格
     */
    'keyword-spacing': [
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
      },
    ],
    /**
     * 只允许使用 unix 的 LF 作为换行符，Windows 的 CRLF 不可以使用
     */
    'linebreak-style': ['warn', 'unix'],
    /**
     * 强制一行的最大长度，限制单行不能超过100个字符，字符串和正则表达式除外。
     */
    'max-len': [
      'off',
      {
        code: 120,
        ignoreStrings: true,
        ignoreUrls: true,
        ignoreRegExpLiterals: true,
        ignoreTemplateLiterals: true,
      },
    ],
    /**
     * 只有在命名构造器或者类的时候，才用帕斯卡拼命名法（PascalCase），即首字母大写。
     */
    'new-cap': [
      'error',
      {
        newIsCap: true,
        newIsCapExceptions: [],
        capIsNew: false,
        capIsNewExceptions: ['Immutable.Map', 'Immutable.Set', 'Immutable.List'],
        properties: false,
      },
    ],
    /**
     * 在编写多个方法链式调用(超过两个方法链式调用)时。 使用前导点，强调这行是一个方法调用，而不是一个语句。
     */
    'newline-per-chained-call': [
      'warn',
      {
        ignoreChainWithDepth: 2,
      },
    ],
    /**
     * 使用字面量语法创建数组。
     */
    'no-array-constructor': ['error'],
    /**
     * 在 case 和 default 的子句中，如果存在声明 (例如. let, const, function, 和 class)，使用大括号来创建块级作用域。
     */
    'no-case-declarations': 'error',
    /**
     * 避免搞混箭头函数符号 (=>) 和比较运算符 (<=, >=)。
     */
    'no-confusing-arrow': 'warn',
    /**
     * 禁止对使用 const 定义的常量重新赋值
     */
    'no-const-assign': 'error',
    /**
     * 禁止重复定义类的成员
     */
    'no-dupe-class-members': 'error',
    /**
     * 禁止在 else 内使用 return，必须改为提前结束
     */
    'no-else-return': [
      'warn',
      {
        allowElseIf: false,
      },
    ],
    /**
     * 禁止使用 eval
     */
    'no-eval': 'error',
    /**
     * 不要使用迭代器。
     * @reason 推荐使用 JavaScript 的高阶函数代替 for-in。
     */
    'no-iterator': 'warn',
    /**
     * 禁止在循环内的函数内部出现循环体条件语句中定义的变量
     */
    'no-loop-func': 'error',
    /**
     * 禁止混合使用不同的操作符:
     * - 禁止 `%`, `**` 之间混用
     * - 禁止 `%` 与其它运算符之间混用
     * - 禁止乘除运算符之间混用
     * - 禁止位运算符之间的任何混用
     * - 禁止比较运算符之间混用
     * - 禁止 `&&`, `||` 之间混用
     */
    'no-mixed-operators': [
      'error',
      {
        groups: [
          ['%', '**'],
          ['%', '+'],
          ['%', '-'],
          ['%', '*'],
          ['%', '/'],
          ['&', '|', '<<', '>>', '>>>'],
          ['==', '!=', '===', '!=='],
          ['&&', '||'],
        ],
        allowSamePrecedence: false,
      },
    ],
    /**
     * 禁止连续赋值，比如 foo = bar = 1
     */
    'no-multi-assign': 'error',
    /**
     * 不要使用多个空行填充代码。
     */
    'no-multiple-empty-lines': 'error',
    /**
     * 禁止使用嵌套的三元表达式，比如 a ? b : c ? d : e
     */
    'no-nested-ternary': 'warn',
    /**
     * 禁止使用 new Function
     * @reason 这和 eval 是等价的
     */
    'no-new-func': 'error',
    /**
     * 禁止直接 new Object
     */
    'no-new-object': 'error',
    /**
     * 禁止使用 new 来生成 String, Number 或 Boolean
     */
    'no-new-wrappers': 'warn',
    /**
     * 禁止对函数的参数重新赋值
     */
    'no-param-reassign': [
      'warn',
      {
        props: true,
        ignorePropertyModificationsFor: [
          'acc',
          'accumulator',
          'e',
          'ctx',
          'req',
          'request',
          'res',
          'response',
          '$scope',
          'staticContext',
          'state',
        ],
      },
    ],
    /**
     * 禁止使用 ++ 或 --
     */
    'no-plusplus': [
      'error',
      {
        allowForLoopAfterthoughts: true,
      },
    ],
    /**
     * 禁止使用 hasOwnProperty, isPrototypeOf 或 propertyIsEnumerable
     */
    'no-prototype-builtins': 'error',
    /**
     * 计算指数时，可以使用 ** 运算符。
     */
    'no-restricted-properties': [
      'warn',
      {
        object: 'Math',
        property: 'pow',
        message: 'Please use ** instand',
      },
    ],
    /**
     * 推荐使用 JavaScript 的高阶函数代替 for-in
     */
    'no-restricted-syntax': [
      'warn',
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
     * 避免在行尾添加空格。
     */
    'no-trailing-spaces': 'error',
    /**
     * 变量应先声明再使用，禁止引用任何未声明的变量，除非你明确知道引用的变量存在于当前作用域链上。
     */
    'no-undef': ['error'],
    /**
     * 禁止变量名出现下划线
     */
    'no-underscore-dangle': 'warn',
    /**
     * 必须使用 !a 替代 a ? false : true
     */
    'no-unneeded-ternary': 'warn',
    /**
     * 已定义的变量必须使用
     * 但不检查最后一个使用的参数之前的参数
     * 也不检查 rest 属性的兄弟属性
     */
    'no-unused-vars': [
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
    'no-useless-constructor': 'warn',
    /**
     * 禁止出现没必要的转义
     */
    'no-useless-escape': 'error',
    /**
     * 禁止使用 var
     */
    'no-var': 'error',
    /**
     * 禁止属性前有空白
     */
    'no-whitespace-before-property': 'warn',
    /**
     * 强制单个语句的位置
     */
    'nonblock-statement-body-position': ['error', 'beside'],
    /**
     * 强制在大括号中使用一致的空格
     */
    'object-curly-spacing': ['warn', 'always'],
    /**
     * 将对象方法、属性简写，且间歇属性放在前面。
     */
    'object-shorthand': 'warn',
    /**
     * 禁止变量申明时用逗号一次申明多个
     */
    'one-var': ['warn', 'never'],
    /**
     * 避免在赋值语句 = 前后换行。如果你的代码单行长度超过了 max-len 定义的长度而不得不换行，那么使用括号包裹。
     */
    'operator-linebreak': [
      'error',
      'before',
      {
        overrides: {
          '=': 'none',
        },
      },
    ],
    /**
     * 要求或禁止块内填充
     */
    'padded-blocks': ['error', 'never'],
    /**
     * 要求回调函数使用箭头函数
     */
    'prefer-arrow-callback': 'warn',
    /**
     * 申明后不再被修改的变量必须使用 const 来申明
     */
    'prefer-const': [
      'error',
      {
        destructuring: 'any',
        ignoreReadBeforeAssign: false,
      },
    ],
    /**
     * 优先使用解构赋值
     */
    'prefer-destructuring': [
      'warn',
      {
        VariableDeclarator: {
          array: false,
          object: true,
        },
        AssignmentExpression: {
          array: true,
          object: false,
        },
      },
      {
        enforceForRenamedProperties: false,
      },
    ],
    /**
     * 必须使用 ...args 而不是 arguments
     */
    'prefer-rest-params': 'warn',
    /**
     * 必须使用 ... 而不是 apply，比如 foo(...args)
     */
    'prefer-spread': 'warn',
    /**
     * 必须使用模版字符串而不是字符串连接
     */
    'prefer-template': 'error',
    /**
     * 要求对象字面量属性名称用引号括起来
     */
    'quote-props': [
      'error',
      'as-needed',
      {
        keywords: false,
      },
    ],
    /**
     * 使用单引号 '' 定义字符串
     */
    quotes: [
      'warn',
      'single',
      {
        allowTemplateLiterals: false,
      },
    ],
    /**
     * parseInt 必须传入第二个参数
     */
    radix: 'warn',
    /**
     * 要加分号
     */
    semi: ['error', 'always'],
    /**
     * 强制在块之前使用一致的空格
     */
    'space-before-blocks': 'error',
    /**
     * 强制在 function 的左括号之前使用一致的空格
     */
    'space-before-function-paren': [
      'error',
      {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always',
      },
    ],
    /**
     * 强制在圆括号内使用一致的空格
     */
    'space-in-parens': ['error', 'never'],
    /**
     * 要求操作符周围有空格
     */
    'space-infix-ops': 'error',
    /**
     * 注释的斜线或 * 后必须有空格
     */
    'spaced-comment': ['error', 'always'],
    /**
     * 要求或禁止模板字符串中的嵌入表达式周围空格的使用
     */
    'template-curly-spacing': ['error', 'never'],
    /**
     * 要求立即执行的函数使用括号括起来
     */
    'wrap-iife': ['error', 'outside'],
  },
};
