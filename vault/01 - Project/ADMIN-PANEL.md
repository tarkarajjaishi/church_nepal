# Admin Panel Status

**Location**: `C:\churchnepal.com\FullProductionSetup-main\admin`
**Port**: 5174 (separate Vite project)

## Current State

### Pages Built
| Page | Status | Notes |
|------|--------|-------|
| Login | ✅ Done | JWT auth |
| Dashboard | ✅ Done | Stats overview |
| CrudPage | ✅ Done | Generic CRUD component |

### What's Missing
- Individual entity pages (using CrudPage template)
- API integration hooks
- Protected route wrapper
- Image upload component

## Architecture

```
admin/
├── src/
│   ├── pages/
│   │   ├── Login.tsx        # Authentication
│   │   ├── Dashboard.tsx    # Stats overview
│   │   └── CrudPage.tsx     # Reusable CRUD component
│   ├── components/          # UI components
│   └── lib/                 # API hooks, utilities
```

## CrudPage Pattern

The `CrudPage.tsx` is a generic component that takes:
- `entityName` - Display name
- `endpoint` - API path
- `columns` - Table column definitions
- `formFields` - Form field definitions

### Example Usage
```tsx
<CrudPage
  entityName="Sermons"
  endpoint="/api/sermons"
  columns={[
    { key: 'title', label: 'Title' },
    { key: 'speaker', label: 'Speaker' },
    { key: 'date', label: 'Date' }
  ]}
  formFields={[
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'speaker', label: 'Speaker', type: 'text' },
    { key: 'video_url', label: 'Video URL', type: 'url' }
  ]}
/>
```

## Next Steps

1. Create entity-specific pages using CrudPage
2. Add API hooks (React Query) for admin
3. Implement protected route wrapper
4. Add image upload component

## Related
- [[02 - Architecture/Backend|Backend API]]
- [[01 - Project/TODO|TODO]]
