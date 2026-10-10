import type { GlobalConfig } from 'payload';
import { authenticatedWrite } from '../access/cms';

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Navigation',
  access: { read: () => true, update: authenticatedWrite },
  versions: { drafts: true },
  fields: [
    { name: 'primaryLinks', type: 'array', fields: [
      { name: 'label', type: 'text', required: true },
      { name: 'url', type: 'text', required: true },
      { name: 'labelReference', type: 'relationship', relationTo: 'labels' },
    ] },
    { name: 'footerLinks', type: 'array', fields: [
      { name: 'label', type: 'text', required: true },
      { name: 'url', type: 'text', required: true },
    ] },
  ],
};
