import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import * as parserVue from 'vue-eslint-parser'
import configPrettier from 'eslint-config-prettier'
import pluginPrettier from 'eslint-plugin-prettier'
import tseslint from 'typescript-eslint'
import parserTs from '@typescript-eslint/parser'

export default [
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/essential'],

  {
    languageOptions: {
      parser: parserVue,
      parserOptions: {
        parser: parserTs,
        sourceType: 'module',
      },
    },
  },

  {
    rules: {
      ...configPrettier.rules,
      'prettier/prettier': 'error',
    },
    plugins: {
      prettier: pluginPrettier,
    },
  },
]
