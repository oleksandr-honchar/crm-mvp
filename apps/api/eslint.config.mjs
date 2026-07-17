// @ts-check
import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'src/**/*.spec.ts', 'src/**/*.test.ts'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-misused-promises': 'off',

      // 1. Fixes "Unsafe return of a value of type error"
      '@typescript-eslint/no-unsafe-return': 'off',

      // 2. Fixes "Async method 'findAll' has no 'await' expression"
      '@typescript-eslint/require-await': 'off',
    },
  },
  // 3. Tells TypeScript ESLint to relax path checking if the project builds successfully
  {
    files: ['**/*.ts'],
    rules: {
      'import/no-unresolved': 'off',
    }
  },
  eslintConfigPrettier,
);
