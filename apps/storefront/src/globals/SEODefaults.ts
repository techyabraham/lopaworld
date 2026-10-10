import type { GlobalConfig } from 'payload';
import { authenticatedWrite } from '../access/cms';

export const SEODefaults: GlobalConfig = {
  slug: 'seo-defaults',
  label: 'SEO defaults',
  access: { read: ({ req }) => Boolean(req.user), update: authenticatedWrite },
  versions: { drafts: true },
  fields: [
    { name: 'siteTitle', type: 'text', required: true, maxLength: 70 },
    { name: 'defaultDescription', type: 'textarea', maxLength: 180 },
    { name: 'defaultShareImage', type: 'upload', relationTo: 'media' },
    { name: 'organizationName', type: 'text' },
  ],
};
