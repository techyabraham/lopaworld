import type { CollectionConfig } from 'payload';
import { LABELS } from '@lopaworld/types';
import { authenticatedWrite, publishedRead } from '../access/cms';

const seoFields = {
  name: 'seo',
  type: 'group' as const,
  fields: [
    { name: 'title', type: 'text' as const, maxLength: 70 },
    { name: 'description', type: 'textarea' as const, maxLength: 180 },
    { name: 'shareImage', type: 'upload' as const, relationTo: 'media' as const },
  ],
};

export const Labels: CollectionConfig = {
  slug: 'labels',
  access: { read: publishedRead, create: authenticatedWrite, update: authenticatedWrite, delete: authenticatedWrite },
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'slug', 'accentToken', 'updatedAt'] },
  versions: { drafts: true },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'slug', type: 'select', required: true, unique: true, index: true,
      options: LABELS.map(({ name, slug }) => ({ label: name, value: slug })),
    },
    { name: 'introSummary', type: 'textarea' },
    { name: 'intro', type: 'richText' },
    {
      name: 'accentToken', type: 'select', required: true,
      options: LABELS.map(({ name, slug }) => ({ label: name, value: slug })),
    },
    { name: 'heroMedia', type: 'upload', relationTo: 'media', filterOptions: { rightsConfirmed: { equals: true } } },
    { name: 'instagramUrl', type: 'text' },
    { name: 'featuredCollectionHandle', type: 'text', admin: { description: 'Medusa collection handle only; prices and stock stay in Medusa.' } },
    seoFields,
  ],
};
