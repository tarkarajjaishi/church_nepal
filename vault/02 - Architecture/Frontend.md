# Frontend Architecture

**Stack**: React 19 + Vite + Tailwind CSS v4 + Material UI + Radix UI
**Port**: 5173

## Overview

SSR-like React SPA with bilingual support (EN/NE), React Query for data fetching, and graceful fallback to mock data.

## Directory Structure

```
src/app/
├── components/        # Shared UI components
│   ├── layout/        # Header, Footer, Sidebar
│   ├── ui/            # Reusable primitives
│   └── shared/        # CardSkeleton, ErrorDisplay, etc.
├── lib/
│   ├── hooks.ts       # React Query hooks
│   ├── data.ts        # Mock data (fallback)
│   └── lang.tsx       # Language context (EN/NE)
├── pages/             # Page components
│   ├── Home.tsx
│   ├── About.tsx
│   ├── Sermons.tsx
│   ├── SermonDetail.tsx
│   ├── Events.tsx
│   ├── EventDetail.tsx
│   ├── Ministries.tsx
│   ├── MinistryDetail.tsx
│   ├── Contact.tsx
│   ├── PlanVisit.tsx
│   ├── WatchOnline.tsx
│   ├── Give.tsx
│   ├── Privacy.tsx
│   └── Terms.tsx
```

## Key Patterns

### React Query Hooks
```typescript
// hooks.ts
export function useSermons() {
  return useQuery({
    queryKey: ['sermons'],
    queryFn: () => fetch('/api/sermons').then(r => r.json()),
    placeholderData: mockSermons // Fallback
  });
}
```

### Language System
```typescript
// lang.tsx
const { t, lang, setLang } = useLang();
// t('key') returns translated string
```

### Detail Page Pattern
```typescript
// SermonDetail.tsx
const { id } = useParams();
const { data: sermon } = useSermon(id);

if (!sermon) return <DetailSkeleton />;

return (
  <PageHero title={sermon.title} />
  <Reveal>
    <Card>{sermon.content}</Card>
  </Reveal>
);
```

## Related
- [[02 - Architecture/Admin-SPA|Admin SPA]]
- [[03 - Knowledge/React-Patterns|React Patterns]]
