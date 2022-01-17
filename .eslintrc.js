/** @type {Partial<import('eslint').Linter.RulesRecord>} */
const rules = {
  curly: ['error', 'multi-line'],
  eqeqeq: ['error', 'smart'],
  'capitalized-comments': ['off'],
  'no-eq-null': ['off'],
  '@typescript-eslint/consistent-indexed-object-style': [
    'error',
    'index-signature',
  ],
  // 'import/extensions': 'off',
  // 'node/file-extension-in-import': 'off',
  // 'unicorn/prefer-node-protocol': 'off',
  // 'unicorn/no-array-reduce': 'off',
  // 'unicorn/prefer-spread': 'off',
};
/** @type {import('eslint').Linter.Config} */
const config = {
  extends: ['xo', 'prettier', 'plugin:prettier/recommended'],
  parserOptions: {
    project: false,
  },
  rules,

  overrides: [
    {
      files: ['src/**/*.ts'],
      parserOptions: {
        project: 'src/tsconfig.json',
      },
      extends: [
        'xo',
        'xo-typescript',
        'prettier',
        'plugin:prettier/recommended',
      ],
      rules,
    },
    {
      files: ['*.config.js'],
      rules: {
        'unicorn/prefer-module': 'off',
        '@typescript-eslint/no-throw-literal': ['off'],
      },
    },
    {
      files: ['test/**/*.js'],
      rules: {
        ...rules,
        'no-unused-vars': 'off',
        'func-names': 'off',
        'prettier/prettier': [
          'error',
          {
            printWidth: 140,
            tabWidth: 4,
            trailingComma: 'es5',
            arrowParens: 'avoid',
          },
        ],
      },
    },
  ],
};
module.exports = config;
