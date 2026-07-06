// ESLint 9 flat config — TypeScript + React hooks correctness rules.
// Style/formatting stays with Prettier; this catches real bugs only.
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

// ── Module boundary rule (ADR-000 seam rule 4 / STAGE0-REORG-PLAN §2) ────────
// modules/A/** may import modules/B ONLY via modules/B's index.
// Severity is WARN for Stage 0 (visibility before enforcement); flips to error
// once the reorg PRs land. Replaces the spec's .eslintrc.boundaries.cjs, which
// eslint 9 flat config would ignore.
const MODULES = [
  'admin', 'child', 'coach', 'commerce', 'community', 'customer-service',
  'discovery', 'events', 'identity', 'learning-content', 'notifications',
  'parent', 'school',
]

// Inside a module: deep imports into any OTHER module are a violation.
const moduleBoundaryBlocks = MODULES.map((mod) => ({
  files: [`src/modules/${mod}/**/*.{ts,tsx}`],
  rules: {
    'no-restricted-imports': ['warn', {
      patterns: MODULES.filter((other) => other !== mod).flatMap((other) => ([{
        group: [
          `**/modules/${other}/**`,
          `../${other}/**`,
          `../../${other}/**`,
          `../../../${other}/**`,
        ],
        message: `Cross-module boundary: import from 'modules/${other}' (its index), never its internals.`,
      }])),
    }],
  },
}))

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
      // error (was warn) so dropping --max-warnings 0 keeps this gate intact
      // while boundary warnings stay non-fatal.
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  // Outside modules/: reach into a module only through its index.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/modules/**'],
    rules: {
      'no-restricted-imports': ['warn', {
        patterns: [{
          group: ['**/modules/*/**'],
          message: "Import a module only via its public index: modules/<name>.",
        }],
      }],
    },
  },
  ...moduleBoundaryBlocks,
)
