import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', caughtErrors: 'none', args: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      // Data loading in this app follows the standard setLoading-then-fetch
      // pattern inside effects — the rule's stricter model doesn't fit here.
      'react-hooks/set-state-in-effect': 'off',
      // App.jsx defines helper components (TabBar, TodayCard, …) inside App();
      // long-standing pattern, flagged for awareness but not a gate failure.
      'react-hooks/static-components': 'warn',
    },
  },
  {
    // shared.jsx deliberately exports constants + tiny UI primitives together;
    // the only cost is HMR granularity in dev, which we accept.
    files: ['src/shared.jsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // Server-side code (Vercel functions)
    files: ['api/**/*.js'],
    languageOptions: { globals: globals.node },
  },
])
