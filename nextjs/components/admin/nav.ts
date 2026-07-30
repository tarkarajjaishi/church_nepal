import {
  LayoutDashboard, BookOpen, Calendar, Users, Image, Quote, Bell, UserCheck, Clock,
  BookMarked, DollarSign, Settings, Church, Shield, LayoutGrid, Heart, CheckSquare,
  UserCircle, Newspaper, Briefcase, Globe, Mail, Contact, Palette, Receipt,
  HandHelping, Wallet, Target, ClipboardCheck, Radio, FileText, BarChart3,
  HandHeart, MessageSquare, MonitorPlay, Music, Package, Library, LifeBuoy, KeyRound,
} from 'lucide-react'

/**
 * The admin navigation, as groups rather than a flat list with dividers.
 *
 * Fifty-one links in one scroll is not a menu, it is a haystack — so the shape
 * of the data is the fix: named groups that collapse, and a `keywords` field so
 * the command palette finds "tickets" under Help Desk and "SLA" under Help Desk
 * too, without either word being in the label.
 */

export type NavLink = {
  to: string
  icon: React.ElementType
  label: string
  /** Needs this permission. */
  perm?: string
  /** Needs *any one* of these — for pages that serve several modules. */
  anyPerm?: string[]
  /** Extra words the command palette should match on. */
  keywords?: string
  /**
   * Pages inside this module. Shown nested under the parent only while you are
   * in it — a module's own sub-navigation used to be a second column beside the
   * sidebar, which cost 224px of table width and meant two menus to read.
   */
  children?: { to: string; label: string; stub?: boolean }[]
}

export type NavGroup = {
  id: string
  label: string
  items: NavLink[]
  /** Groups a person opens every day start expanded; the rest do not. */
  defaultOpen?: boolean
}

export const NAV: NavGroup[] = [
  {
    id: 'general',
    label: 'General',
    defaultOpen: true,
    items: [
      { to: '/admin/overview', icon: Church, label: 'Church Overview', perm: 'dashboard.view', keywords: 'home summary' },
      { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', perm: 'dashboard.view', keywords: 'stats numbers' },
      { to: '/admin/todos', icon: CheckSquare, label: 'Todos', perm: 'dashboard.view', keywords: 'tasks jobs' },
      { to: '/admin/content-blocks', icon: LayoutGrid, label: 'Homepage Sections', perm: 'content.manage', keywords: 'front page blocks' },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    defaultOpen: true,
    items: [
      { to: '/admin/sermons', icon: BookOpen, label: 'Sermons', perm: 'content.manage', keywords: 'preaching messages audio' },
      { to: '/admin/events', icon: Calendar, label: 'Events', perm: 'content.manage', keywords: 'calendar diary' },
      { to: '/admin/ministries', icon: Users, label: 'Ministries', perm: 'content.manage' },
      { to: '/admin/groups', icon: Users, label: 'Groups', perm: 'people.view', keywords: 'small home cell' },
      { to: '/admin/leaders', icon: UserCheck, label: 'Leaders', perm: 'content.manage', keywords: 'elders pastors' },
      { to: '/admin/gallery', icon: Image, label: 'Gallery', perm: 'content.manage', keywords: 'photos pictures' },
      { to: '/admin/testimonies', icon: Quote, label: 'Testimonies', perm: 'content.manage', keywords: 'stories' },
      { to: '/admin/notices', icon: Bell, label: 'Notices', perm: 'content.manage', keywords: 'announcements' },
      { to: '/admin/members', icon: Users, label: 'Members', perm: 'people.view', keywords: 'congregation' },
      { to: '/admin/service-times', icon: Clock, label: 'Service Times', perm: 'content.manage', keywords: 'sunday schedule' },
      { to: '/admin/verses', icon: BookMarked, label: 'Verses', perm: 'content.manage', keywords: 'scripture bible' },
    ],
  },
  {
    id: 'people',
    label: 'People & Giving',
    defaultOpen: true,
    items: [
      { to: '/admin/people', icon: Users, label: 'People', perm: 'people.view', keywords: 'contacts directory' },
      { to: '/admin/prayer-requests', icon: HandHeart, label: 'Prayer Requests', perm: 'communication.manage' },
      { to: '/admin/contact-messages', icon: MessageSquare, label: 'Contact Messages', perm: 'communication.manage', keywords: 'enquiries inbox' },
      { to: '/admin/member-applications', icon: Users, label: 'Member Applications', perm: 'people.view', keywords: 'joining' },
      {
        to: '/admin/offering-management', icon: DollarSign, label: 'Offering Management',
        perm: 'giving.view', keywords: 'counting deposits cash receipts',
        children: [
          { to: '/admin/offering-management', label: 'Dashboard' },
          { to: '/admin/offering-management/offerings', label: 'Offerings' },
          { to: '/admin/offering-management/new', label: 'Quick add' },
          { to: '/admin/offering-management/cash-counting', label: 'Cash counting' },
          { to: '/admin/offering-management/deposits', label: 'Deposits' },
          { to: '/admin/offering-management/bank-accounts', label: 'Bank accounts' },
          { to: '/admin/offering-management/donors', label: 'Donors' },
          { to: '/admin/offering-management/recurring', label: 'Recurring giving' },
          { to: '/admin/offering-management/campaigns', label: 'Campaigns' },
          { to: '/admin/offering-management/funds', label: 'Funds' },
          { to: '/admin/offering-management/receipts', label: 'Receipts' },
          { to: '/admin/offering-management/reports', label: 'Financial reports' },
          { to: '/admin/offering-management/analytics', label: 'Analytics' },
          { to: '/admin/offering-management/settings', label: 'Settings' },
        ],
      },
      { to: '/admin/giving', icon: Receipt, label: 'Giving Dashboard', perm: 'giving.view' },
      { to: '/admin/funds', icon: Wallet, label: 'Funds', perm: 'giving.view' },
      { to: '/admin/campaigns', icon: Target, label: 'Campaigns', perm: 'giving.view', keywords: 'appeal fundraising' },
      { to: '/admin/pledges', icon: Target, label: 'Pledges', perm: 'giving.view', keywords: 'promises' },
      { to: '/admin/donations', icon: Heart, label: 'Donations', perm: 'giving.view', keywords: 'gifts tithes' },
      { to: '/admin/offerings', icon: DollarSign, label: 'Offerings (legacy)', perm: 'giving.view' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    defaultOpen: true,
    items: [
      {
        to: '/admin/worship', icon: Music, label: 'Worship', perm: 'worship.manage',
        keywords: 'songs rota band rehearsal',
        children: [
          { to: '/admin/worship', label: 'Dashboard' },
          { to: '/admin/worship/services', label: 'Service plans' },
          { to: '/admin/worship/rehearsals', label: 'Rehearsals' },
          { to: '/admin/worship/team', label: 'Worship team' },
        ],
      },
      {
        to: '/admin/presentation', icon: MonitorPlay, label: 'Presentation',
        perm: 'presentation.manage', keywords: 'slides screen projector lyrics',
        children: [
          { to: '/admin/presentation', label: 'Dashboard' },
          { to: '/admin/presentation/live', label: 'Live presentation' },
          { to: '/admin/presentation/playlists', label: 'Playlists' },
          { to: '/admin/presentation/songs', label: 'Song library' },
          { to: '/admin/presentation/presentations', label: 'Presentations' },
          { to: '/admin/presentation/displays', label: 'Displays' },
          { to: '/admin/presentation/themes', label: 'Themes' },
          { stub: true, to: '/admin/presentation/history', label: 'History' },
        ],
      },
      {
        to: '/admin/helpdesk', icon: LifeBuoy, label: 'Help Desk', perm: 'helpdesk.manage',
        keywords: 'tickets repairs faults sla support',
        children: [
          { to: '/admin/helpdesk', label: 'Dashboard' },
          { to: '/admin/helpdesk/tickets', label: 'All tickets' },
          { to: '/admin/helpdesk/unassigned', label: 'Unassigned' },
          { to: '/admin/helpdesk/breaching', label: 'Breaching SLA' },
          { to: '/admin/helpdesk/knowledge', label: 'Knowledge base' },
          { to: '/admin/helpdesk/categories', label: 'Categories & SLA' },
        ],
      },
      {
        to: '/admin/assets', icon: Package, label: 'Assets', perm: 'assets.manage',
        keywords: 'equipment inventory maintenance',
        children: [
          { to: '/admin/assets', label: 'Dashboard' },
          { to: '/admin/assets/register', label: 'Asset register' },
          { to: '/admin/assets/assignments', label: 'Check-out' },
          { to: '/admin/assets/reservations', label: 'Reservations' },
          { to: '/admin/assets/maintenance', label: 'Maintenance' },
          { to: '/admin/assets/categories', label: 'Categories' },
          { to: '/admin/assets/suppliers', label: 'Suppliers' },
        ],
      },
      {
        to: '/admin/library', icon: Library, label: 'Library', perm: 'library.manage',
        keywords: 'books loans borrow catalogue',
        children: [
          { to: '/admin/library', label: 'Dashboard' },
          { to: '/admin/library/catalogue', label: 'Catalogue' },
          { to: '/admin/library/loans', label: 'Loans' },
          { to: '/admin/library/holds', label: 'Holds' },
          { to: '/admin/library/borrowers', label: 'Borrowers' },
          { to: '/admin/library/settings', label: 'Lending rules' },
        ],
      },
      { to: '/admin/attendance', icon: ClipboardCheck, label: 'Attendance', perm: 'people.view', keywords: 'headcount register' },
      { to: '/admin/rsvps', icon: Users, label: 'Event RSVPs', perm: 'people.view', keywords: 'bookings' },
      { to: '/admin/volunteers', icon: HandHelping, label: 'Volunteers', perm: 'people.view', keywords: 'rota shifts helpers' },
      { to: '/admin/broadcasts', icon: Radio, label: 'Broadcasts', perm: 'communication.manage', keywords: 'sms email blast' },
      { to: '/admin/forms', icon: FileText, label: 'Forms', perm: 'communication.manage', keywords: 'signup survey' },
    ],
  },
  {
    id: 'website',
    label: 'Website',
    items: [
      { to: '/admin/images', icon: Image, label: 'Image Manager', perm: 'content.manage', keywords: 'media uploads' },
      { to: '/admin/blog', icon: Newspaper, label: 'Blog Posts', perm: 'content.manage', keywords: 'articles news' },
      { to: '/admin/team', icon: UserCheck, label: 'Team Members', perm: 'content.manage', keywords: 'staff' },
      { to: '/admin/services', icon: Briefcase, label: 'Services', perm: 'content.manage' },
      { to: '/admin/portfolio', icon: Globe, label: 'Portfolio', perm: 'content.manage' },
      { to: '/admin/contact-info', icon: Contact, label: 'Contact Info', perm: 'content.manage', keywords: 'address phone' },
      { to: '/admin/newsletter', icon: Mail, label: 'Newsletter', perm: 'communication.manage', keywords: 'subscribers mailing' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    items: [
      // The reports page serves nine reports across five modules and filters
      // itself to what the caller can run, so a single permission is the wrong
      // gate: `giving.view` hid it from a librarian who has a library report,
      // and `dashboard.view` offered it to a viewer who has none.
      {
        to: '/admin/reports', icon: BarChart3, label: 'Reports',
        keywords: 'export csv pdf statistics',
        children: [
          { to: '/admin/reports', label: 'Run a report' },
          { to: '/admin/reports/schedules', label: 'Scheduled reports' },
        ],
        anyPerm: [
          'giving.view', 'people.view', 'worship.manage',
          'assets.manage', 'library.manage', 'helpdesk.manage',
        ],
      },
      { to: '/admin/audit-log', icon: Shield, label: 'Audit Log', perm: 'audit.view', keywords: 'history who changed' },
      { to: '/admin/users', icon: Shield, label: 'Users', perm: 'users.manage', keywords: 'accounts logins' },
      {
        to: '/admin/roles', icon: KeyRound, label: 'Roles & Permissions',
        perm: 'users.manage', keywords: 'access rbac',
        children: [
          { to: '/admin/roles', label: 'Roles' },
          { to: '/admin/roles/people', label: 'Who has what' },
        ],
      },
      { to: '/admin/theme', icon: Palette, label: 'Theme & Layout', perm: 'settings.manage', keywords: 'colours branding' },
      { to: '/admin/settings', icon: Settings, label: 'Settings', perm: 'settings.manage' },
      { to: '/admin/profile', icon: UserCircle, label: 'Profile', keywords: 'me my account password' },
    ],
  },
]

/**
 * Drop what this user cannot reach, then drop groups left with nothing in them.
 *
 * This only decides what is *shown*. Every one of these permissions is checked
 * again by the server on the route itself — a hidden link is a courtesy so
 * nobody is offered a page that will refuse them, never the control.
 */
export function visibleNav(can: (p: string) => boolean, publicOnly = false): NavGroup[] {
  return NAV.map((g) => ({
    ...g,
    items: g.items.filter((i) => {
      if (publicOnly) return !i.perm && !i.anyPerm
      if (i.anyPerm) return i.anyPerm.some(can)
      return !i.perm || can(i.perm)
    }),
  })).filter((g) => g.items.length > 0)
}
