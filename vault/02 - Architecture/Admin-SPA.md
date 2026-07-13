# Admin SPA

**Location**: `C:\churchnepal.com\FullProductionSetup-main\admin`
**Port**: 5174

## Overview

Separate Vite project for the admin CMS panel. Will be served as a standalone SPA that communicates with the Rust backend.

## Current State

### Built
- Login page (JWT auth)
- Dashboard (stats overview)
- CrudPage (generic CRUD component)

### Pending
- Entity-specific pages
- API integration
- Protected routes

## CrudPage Component

The `CrudPage.tsx` is designed to be reused for all entity types. It accepts:

```typescript
interface CrudPageProps {
  entityName: string;        // Display name ("Sermons")
  endpoint: string;          // API path ("/api/sermons")
  columns: Column[];         // Table columns
  formFields: FormField[];   // Form fields for create/edit
}
```

## Entity Pages Needed

Using CrudPage pattern:

1. **SermonsPage** - title, speaker, date, video_url, description
2. **EventsPage** - title, date, location, description, image
3. **MinistriesPage** - name, description, leader, image
4. **LeadersPage** - name, role, bio, image
5. **GalleryPage** - image, caption, date
6. **TestimoniesPage** - author, content, date
7. **NoticesPage** - title, content, priority, expires_at
8. **MembersPage** - name, email, phone, joined_date
9. **ServiceTimesPage** - day, time, service_type
10. **VersesPage** - reference, text, language
11. **CampaignsPage** - name, goal, current, description
12. **SettingsPage** - key, value, category

## Tech Stack

- React 19
- Vite
- shadcn/ui components
- Tailwind CSS
- React Query (for API calls)

## Related
- [[02 - Architecture/Backend|Backend API]]
- [[01 - Project/ADMIN-PANEL|Admin Panel Status]]
