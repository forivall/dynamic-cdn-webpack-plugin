/** @type {import('prettier').Config} */
const config = {
  arrowParens: 'always',
  singleQuote: true,
  trailingComma: 'es5',
  useTabs: false,
  overrides: [
    {
      files: ['test/**/*.js'],
      options: {
        tabWidth: 4,
      },
    },
    {
      files: ['.nycrc'],
      options: { parser: 'json' },
    },
    {
      files: ['.taprc'],
      options: { parser: 'yaml' },
    },
  ],
};
module.exports = config;
