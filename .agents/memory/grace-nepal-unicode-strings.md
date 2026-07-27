---
name: Grace Nepal Unicode in TSX string literals
description: Vite transform 500 error caused by curly apostrophes and Unicode dashes in single-quoted JS/TSX string literals.
---

## Rule
Never use Unicode curly apostrophes (U+2019 `'`), en-dashes (U+2013 `–`), or em-dashes (U+2014 `—`) inside single-quoted JavaScript string literals in TSX files.

**Why:** Vite's esbuild transform fails with a 500 (Internal Server Error) when it encounters an unescaped curly apostrophe inside a single-quoted string — the apostrophe terminates the string early, causing a parse error.

**How to apply:**
- Use double-quoted strings for any literal containing an apostrophe: `"Children's Church"`
- Replace en/em-dashes with ASCII hyphens or ` - ` in fallback constant arrays
- When writing fallback data arrays in code, use `node -e` to check for non-ASCII chars (codepoints > 127) before committing
- If AI output introduces these characters, use `node` to replace them: `.replace(/\u2019/g, "'")`
