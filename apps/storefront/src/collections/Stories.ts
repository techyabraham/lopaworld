import type { CollectionConfig } from 'payload';
import { authenticatedWrite, publishedRead } from '../access/cms';

export const Stories: CollectionConfig = {
  slug: 'stories',
  access: { read: publishedRead, create: authenticatedWrite, update: authenticatedWrite, delete: authenticatedWrite },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'publishedAt', 'updatedAt'] },
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'excerpt', type: 'textarea', required: true },
    { name: 'heroMedia', type: 'upload', relationTo: 'media', filterOptions: { rightsConfirmed: { equals: true } } },
    { name: 'heroAlt', type: 'text' },
    { name: 'labels', type: 'relationship', relationTo: 'labels', hasMany: true },
    { name: 'content', type: 'richText' },
    { name: 'publishedAt', type: 'date' },
    {
      name: 'seo', type: 'group', fields: [
        { name: 'title', type: 'text', maxLength: 70 },
        { name: 'description', type: 'textarea', maxLength: 180 },
        { name: 'shareImage', type: 'upload', relationTo: 'media' },
      ],
    },
  ],
};
