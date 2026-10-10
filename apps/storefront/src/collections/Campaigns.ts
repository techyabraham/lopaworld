import type { CollectionConfig } from 'payload';
import { authenticatedWrite, publishedRead } from '../access/cms';

export const Campaigns: CollectionConfig = {
  slug: 'campaigns',
  access: { read: publishedRead, create: authenticatedWrite, update: authenticatedWrite, delete: authenticatedWrite },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'status', 'startsAt', 'endsAt'] },
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'slug', type: 'text', required: true, unique: true },
    { name: 'status', type: 'select', required: true, defaultValue: 'draft', options: ['draft', 'scheduled', 'active', 'ended'] },
    { name: 'startsAt', type: 'date' },
    { name: 'endsAt', type: 'date' },
    { name: 'labels', type: 'relationship', relationTo: 'labels', hasMany: true },
    { name: 'campaignLine', type: 'text', admin: { description: 'Use owner-approved campaign copy only.' } },
    { name: 'body', type: 'richText' },
    { name: 'heroMedia', type: 'upload', relationTo: 'media', filterOptions: { rightsConfirmed: { equals: true } } },
    { name: 'heroAlt', type: 'text' },
    { name: 'ctaLabel', type: 'text' },
    { name: 'ctaUrl', type: 'text' },
  ],
};
