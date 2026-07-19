// Central re-export of all resource hooks.
// Import from '@/lib/hooks' for any resource.

export { createResourceHooks } from './factory'

// Content
export * from './sermons'
export * from './ministries'
export * from './events'
export * from './leaders'
export * from './gallery'
export * from './testimonies'
export * from './notices'
export * from './members'
export * from './service-times'
export * from './verses'
export * from './campaigns'
export * from './content-blocks'
export * from './blog'
export * from './services'
export * from './team'
export * from './portfolio'
export * from './uploads'

// CRM
export * from './people'
export * from './households'
export * from './tags'
export * from './groups'

// Giving
export * from './donations'
export * from './funds'
export * from './offerings'
export * from './pledges'

// Events / Attendance
export * from './attendance'
export * from './event-rsvps'

// Communication
export * from './broadcasts'
export * from './forms'
export * from './newsletter'
export * from './contact-info'
export * from './contact-messages'

// Volunteers
export * from './volunteers'

// Admin facade modules
export * from './dashboard-admin'
export * from './reports-admin'
export * from './member-applications-admin'
export * from './attendance-queries'
export * from './newsletter-admin'

// Admin
export * from './users'
export * from './todos'
export * from './settings'
export * from './dashboard'
export * from './audit-log'
export * from './member-applications'
export * from './reports'
export { useSettingsSections } from './settings'
export { useToggleSection } from './settings'
