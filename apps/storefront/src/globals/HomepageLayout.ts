import type { Block, GlobalConfig } from 'payload';
import { LABELS } from '@lopaworld/types';
import { authenticatedWrite } from '../access/cms';

const CampaignHero: Block = {
  slug: 'campaignHero',
  labels: { singular: 'Campaign hero', plural: 'Campaign heroes' },
  fields: [
    { name: 'campaign', type: 'relationship', relationTo: 'campaigns' },
    { name: 'headline', type: 'text', required: true },
    { name: 'supportingCopy', type: 'textarea' },
    { name: 'image', type: 'upload', relationTo: 'media', filterOptions: { rightsConfirmed: { equals: true } } },
    { name: 'imageAlt', type: 'text' },
    { name: 'ctaLabel', type: 'text' },
    { name: 'ctaUrl', type: 'text' },
  ],
};

const LabelEntrances: Block = {
  slug: 'labelEntrances',
  labels: { singular: 'Label entrances', plural: 'Label entrances' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    {
      name: 'labels', type: 'relationship', relationTo: 'labels', hasMany: true, required: true,
      validate: (value) => Array.isArray(value) && value.length === LABELS.length || `Select all ${LABELS.length} in-scope labels.`,
    },
  ],
};

const FeaturedCollection: Block = {
  slug: 'featuredCollection',
  labels: { singular: 'Featured collection', plural: 'Featured collections' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'medusaCollectionHandle', type: 'text', required: true, admin: { description: 'Medusa collection handle only. Product prices and inventory are fetched from Medusa.' } },
    { name: 'label', type: 'relationship', relationTo: 'labels' },
  ],
};

const NewArrivals: Block = {
  slug: 'newArrivals',
  labels: { singular: 'New arrivals', plural: 'New arrivals' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
  ],
};

const StoryFeature: Block = {
  slug: 'storyFeature',
  labels: { singular: 'Editorial story', plural: 'Editorial stories' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'story', type: 'relationship', relationTo: 'stories', required: true },
  ],
};

const OccasionLinks: Block = {
  slug: 'occasionLinks',
  labels: { singular: 'Occasion links', plural: 'Occasion links' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'links', type: 'array', minRows: 1, fields: [
      { name: 'label', type: 'text', required: true },
      { name: 'url', type: 'text', required: true },
    ] },
  ],
};

const Newsletter: Block = {
  slug: 'newsletter',
  labels: { singular: 'Newsletter sign-up', plural: 'Newsletter sign-ups' },
  fields: [
    { name: 'heading', type: 'text', required: true },
    { name: 'description', type: 'textarea' },
    { name: 'consentText', type: 'text', required: true },
  ],
};

export const HomepageLayout: GlobalConfig = {
  slug: 'homepage-layout',
  label: 'Homepage layout',
  access: { read: () => true, update: authenticatedWrite },
  admin: {
    description: 'Reorder the blocks to compose the homepage. Preview opens the saved draft layout.',
    preview: (_data, { req }) => {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `${req.protocol}://${req.host}`;
      const secret = process.env.PREVIEW_SECRET;
      return secret ? `${baseUrl}/api/preview/homepage?secret=${encodeURIComponent(secret)}` : `${baseUrl}/api/preview/homepage`;
    },
  },
  versions: { drafts: true },
  fields: [
    {
      name: 'layout', type: 'blocks', required: true, minRows: 1,
      blocks: [CampaignHero, LabelEntrances, FeaturedCollection, NewArrivals, StoryFeature, OccasionLinks, Newsletter],
    },
  ],
};
