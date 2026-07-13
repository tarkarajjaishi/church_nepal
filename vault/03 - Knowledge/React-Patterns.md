# React Patterns

## React Query with Fallback

```typescript
// hooks.ts
export function useSermons() {
  return useQuery({
    queryKey: ['sermons'],
    queryFn: async () => {
      const res = await fetch('/api/sermons');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    placeholderData: mockSermons // Fallback to mock data
  });
}
```

**Pattern**: `placeholderData` provides graceful degradation if backend is down.

## Language System

```typescript
// lang.tsx
export function LangProvider({ children }) {
  const [lang, setLang] = useState<'en' | 'ne'>('en');
  
  const t = (key: string) => translations[lang][key] || key;
  
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

// Usage
const { t, lang, setLang } = useLang();
<h1>{t('welcome')}</h1>
```

**Note**: State not persisted (resets on reload). Some pages use inline ternaries instead of `t()`.

## Detail Page Pattern

```typescript
// SermonDetail.tsx
const { id } = useParams();
const { data: sermon, isLoading, error } = useSermon(id);

if (isLoading) return <DetailSkeleton />;
if (error) return <ErrorDisplay refetch={() => refetch()} />;
if (!sermon) return <div>Sermon not found</div>;

return (
  <>
    <PageHero title={sermon.title} subtitle={sermon.speaker} />
    <Reveal>
      <Card>
        <p>{sermon.description}</p>
      </Card>
    </Reveal>
    <RelatedItems items={relatedSermons} />
  </>
);
```

## Loading/Error States

- **List pages**: `CardSkeleton` + `ErrorDisplay(refetch)`
- **Detail pages**: `DetailSkeleton` + `ErrorDisplay(refetch)` + back button
- **Shared embedded components**: `CardSkeleton` only (fallback to mock hides errors)
- **WatchOnline**: `LoadingSpinner` + null guard

## Translation Keys

Added 30+ keys to `language.tsx` for detail pages. Naming: descriptive snake_case.

Examples:
- `related_sermons`
- `back_to_events`
- `ministry_not_found`

## Related
- [[02 - Architecture/Frontend|Frontend Architecture]]
