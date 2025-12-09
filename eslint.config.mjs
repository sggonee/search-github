import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-plugin-prettier';
import tseslint from 'typescript-eslint';

export default [
  {
    plugins: { prettier, import: importPlugin },
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      'prettier/prettier': 'error',
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          groups: ['builtin', 'external', 'parent'],
          pathGroups: [
            {
              pattern: 'react',
              group: 'external',
              position: 'before',
            },
            {
              pattern: '@/**',
              group: 'parent',
              position: 'after',
            },
          ],
        },
      ],
    },
  },
];
