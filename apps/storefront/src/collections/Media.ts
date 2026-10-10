import type { CollectionConfig } from 'payload';
import { authenticatedWrite } from '../access/cms';

export const Media: CollectionConfig = {
  slug: 'media',
  access: { create: authenticatedWrite, update: authenticatedWrite, delete: authenticatedWrite },
  upload: {
    staticDir: 'public/media',
    imageSizes: [
      { name: 'thumbnail', width: 480, height: 480, fit: 'inside' },
      { name: 'card', width: 960, height: 1200, fit: 'cover' },
      { name: 'hero', width: 1920, height: 1200, fit: 'cover' },
    ],
    adminThumbnail: 'thumbnail',
  },
  fields: [
    { name: 'alt', type: 'text', required: true, label: 'Alternative text' },
    { name: 'rightsConfirmed', type: 'checkbox', defaultValue: false, label: 'Usage rights confirmed' },
  ],
};
