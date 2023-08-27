module.exports = {
  extends: ['standard', 'turbo', 'prettier'],
  ignorePatterns: [
    'dist/*',
    'node_modules/*',
    'coverage/*',
    '.turbo/*',
    '.eslintrc.js',
    '*.test.ts',
  ],
  env: {
    node: true,
  },
  globals: {
    NodeJS: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: { project: ['./tsconfig.json'] },
  plugins: ['@typescript-eslint'],
  rules: {
    'turbo/no-undeclared-env-vars': 'off',
    'spaced-comment': 'warn',
    'no-use-before-define': 'warn',
  },
}
