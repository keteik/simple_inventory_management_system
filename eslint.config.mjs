// @ts-check

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import eslintPluginPrettier from 'eslint-plugin-prettier';

// Use the flat config style — composing recommended configs and then
// enabling eslint-plugin-prettier so Prettier issues surface as ESLint warnings.
export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    plugins: { prettier: eslintPluginPrettier },
    rules: {
      // show Prettier formatting issues as ESLint warnings
      'prettier/prettier': ['warn'],
    },
  },
);
