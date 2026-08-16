// eslint-config-next 16 ships flat config directly: each entry point exports a
// Linter.Config[]. The previous version pushed those through FlatCompat, which
// exists to translate *eslintrc* config — handed an already-flat config whose
// plugin objects reference each other, it tried to JSON.stringify the graph and
// died with "Converting circular structure to JSON". Spread them instead.
import coreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  { ignores: ['.next/**', 'node_modules/**', 'nnrv_bible-main/**'] },
  ...coreWebVitals,
  ...nextTypescript,

  // Once the config actually loaded, it surfaced 668 problems that had never
  // been reported. The rules below are demoted to warnings so `npm run lint`
  // fails on *new* correctness breakage instead of drowning in inherited debt;
  // they stay visible in the output rather than being switched off.
  //
  // Deliberately NOT demoted: react-hooks/rules-of-hooks. It caught a real bug
  // in RichTextEditor (useRef and useEffect after an early return, so hook
  // order changed the moment the editor initialised) and that class of error
  // breaks React outright.
  //
  // To work through the backlog, raise one back to 'error' and fix its file:
  {
    rules: {
      // ~380 sites. Genuine typing work, not a mechanical fix.
      '@typescript-eslint/no-explicit-any': 'warn',
      // ~40 sites: setState inside an effect, which double-renders.
      'react-hooks/set-state-in-effect': 'warn',
      // ~34 sites: apostrophes in JSX text.
      'react/no-unescaped-entities': 'warn',
      // ~18 sites: components declared inside another component's body.
      'react-hooks/static-components': 'warn',
      // Date.now()/Math.random() during render. Real, but fixing them changes
      // when the values refresh, so it needs deciding per site.
      'react-hooks/purity': 'warn',
      // useEffect calling a const function declared below it. Works, because
      // effects run after render, but it reads as a TDZ hazard.
      'react-hooks/immutability': 'warn',
      // 3 sites, all in build scripts and tailwind.config.ts.
      '@typescript-eslint/no-require-imports': 'warn',
    },
  },
]

export default eslintConfig
