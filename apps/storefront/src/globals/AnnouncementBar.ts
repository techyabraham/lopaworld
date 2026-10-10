import type { GlobalConfig } from 'payload';
import { authenticatedWrite } from '../access/cms';

export const AnnouncementBar: GlobalConfig = {
  slug: 'announcement-bar',
  label: 'Announcement bar',
  access: { read: ({ req }) => Boolean(req.user), update: authenticatedWrite },
  versions: { drafts: true },
  fields: [
    { name: 'enabled', type: 'checkbox', defaultValue: false },
    { name: 'message', type: 'text', admin: { description: 'Publish confirmed offers or service messages only.' } },
    { name: 'url', type: 'text' },
    { name: 'startsAt', type: 'date' },
    { name: 'endsAt', type: 'date' },
  ],
};
