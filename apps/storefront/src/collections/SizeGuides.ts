import type { CollectionConfig } from 'payload';
import { authenticatedWrite, publishedRead } from '../access/cms';

export const SizeGuides: CollectionConfig = {
  slug: 'size-guides',
  access: { read: publishedRead, create: authenticatedWrite, update: authenticatedWrite, delete: authenticatedWrite },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'category', 'measurementBasis'] },
  versions: { drafts: true },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'category', type: 'text', required: true, index: true, admin: { description: 'Editable category label; do not assume one universal chart.' } },
    { name: 'label', type: 'relationship', relationTo: 'labels' },
    { name: 'measurementBasis', type: 'select', required: true, options: [{ label: 'Body measurements', value: 'body' }, { label: 'Finished garment measurements', value: 'garment' }] },
    { name: 'howToMeasure', type: 'richText', required: true },
    {
      name: 'measurements', type: 'array', minRows: 1, fields: [
        { name: 'size', type: 'text', required: true },
        { name: 'measurement', type: 'text', required: true },
        { name: 'centimetres', type: 'number', min: 0 },
        { name: 'inches', type: 'number', min: 0 },
        { name: 'fitNote', type: 'text' },
      ],
    },
  ],
};
