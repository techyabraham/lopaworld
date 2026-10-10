import type { CollectionConfig } from 'payload';
import { authenticatedWrite, publishedRead } from '../access/cms';

export const Pages: CollectionConfig = {
  slug: 'pages',
  access: { read: publishedRead, create: authenticatedWrite, update: authenticatedWrite, delete: authenticatedWrite },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug', 'updatedAt'] },
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'body', type: 'richText' },
    {
      name: 'seo', type: 'group', fields: [
        { name: 'title', type: 'text', maxLength: 70 },
        { name: 'description', type: 'textarea', maxLength: 180 },
        { name: 'shareImage', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
};
