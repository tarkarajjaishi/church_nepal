// Compatibility alias.
//
// The single source of truth for the language context, provider, dictionary,
// and useLang hook is `./language`. Historically some files imported from
// `@/lib/i18n` and others from `@/lib/language`, which created TWO separate
// React contexts: the (site) layout mounted the provider from one module while
// components read useLang() from the other, so t() found no provider and
// returned raw keys ("hero_welcome", "nav_about", …).
//
// Re-exporting here guarantees every import path resolves to the SAME context.
export * from './language'
