// ESLint 9 flat config — TypeScript + React hooks correctness rules.
// Style/formatting stays with Prettier; this catches real bugs only.
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'public'] },
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // Hard correctness rule only; the v6 purity/compiler rules flag too many
      // long-standing (working) patterns to gate the build on.
      'react-hooks/rules-of-hooks': 'error',
      // The codebase intentionally uses `any` at UI seams.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
)
