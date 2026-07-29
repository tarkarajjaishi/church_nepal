# UI Kit

This directory contains the shared shadcn/ui-based primitives used across the
Next.js app.

## Included primitives

- `Button`
- `Input`
- `Textarea`
- `Select`
- `Dialog`
- `Popover`
- `Tabs`
- `Card`
- `Badge`
- `Table`
- `Skeleton`
- `Switch`
- `DropdownMenu`
- `Toast` via `sonner`

## Theme contract

These components are styled through CSS variables defined in
`nextjs/app/globals.css` and bridged in `nextjs/styles/theme.css`.

Core variables used by the kit include:

- `--background`
- `--foreground`
- `--card`
- `--card-foreground`
- `--popover`
- `--popover-foreground`
- `--primary`
- `--primary-foreground`
- `--secondary`
- `--secondary-foreground`
- `--muted`
- `--muted-foreground`
- `--accent`
- `--accent-foreground`
- `--destructive`
- `--destructive-foreground`
- `--border`
- `--input`
- `--ring`

Tailwind maps those variables in `nextjs/tailwind.config.ts`, so the primitives
remain theme-aware in both light and dark modes.

## Usage notes

- Import primitives from `@/components/ui/...`.
- Prefer the shared primitives over ad hoc markup for forms, dialogs, menus,
  and feedback states.
- Use the themed classes already built into the primitives instead of adding
  custom colors unless a component is intentionally brand-specific.
