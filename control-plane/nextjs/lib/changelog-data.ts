// Mock changelog data - in a real app this would come from an API
export interface ChangelogEntry {
  id: string;
  version: string;
  date: string;
  title: string;
  description: string;
  type: 'new' | 'improved' | 'fixed';
  read?: boolean;
}

export const changelogData: ChangelogEntry[] = [
  {
    id: 'v1.2.0',
    version: 'v1.2.0',
    date: '2026-07-15',
    title: 'New Attendance Dashboard',
    description: 'Track attendance trends with our new comprehensive dashboard.',
    type: 'new'
  },
  {
    id: 'v1.1.5',
    version: 'v1.1.5',
    date: '2026-07-10',
    title: 'Enhanced Prayer Request Workflow',
    description: 'Improved prayer request management with status tracking.',
    type: 'improved'
  },
  {
    id: 'v1.1.4',
    version: 'v1.1.4',
    date: '2026-07-05',
    title: 'Fixed Event RSVP Bug',
    description: 'Resolved issue where RSVP counts were incorrect.',
    type: 'fixed'
  },
  {
    id: 'v1.1.3',
    version: 'v1.1.3',
    date: '2026-06-28',
    title: 'Ministry Directory Improvements',
    description: 'Added search and filtering capabilities to ministry directory.',
    type: 'improved'
  }
];

export const getUnreadCount = (): number => {
  return changelogData.filter(entry => !entry.read).length;
};
