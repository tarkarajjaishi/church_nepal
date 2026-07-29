# Decision Log

Record all significant project decisions here.

## Template

Use the decision template in `templates/decision-template.md`.

## Recent Decisions

### 2026-07-13: Obsidian Vault Setup
- **Decision**: Create Obsidian vault in project directory
- **Context**: Need persistent knowledge base across sessions
- **Options**: Separate location vs project directory
- **Choice**: Project directory (keeps docs with code)
- **Consequences**: Vault tracked in project, easy to find

### 2026-07-13: Admin Panel Architecture
- **Decision**: Separate SPA on port 5174
- **Context**: Admin needs different auth and UI from public site
- **Options**: Same app with routes vs separate SPA
- **Choice**: Separate SPA (cleaner separation)
- **Consequences**: More setup, but isolated concerns

### 2026-07-13: Mock Data as Fallback
- **Decision**: Keep `data.ts` as `placeholderData` in React Query hooks
- **Context**: Backend may be down, need graceful degradation
- **Options**: Remove mock data vs keep as fallback
- **Choice**: Keep as fallback
- **Consequences**: App works even without backend

## Related
- [[02 - Architecture/Backend|Backend Architecture]]
- [[02 - Architecture/Frontend|Frontend Architecture]]
