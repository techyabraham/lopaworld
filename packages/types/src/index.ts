export const LABELS = [
  { slug: 'next', name: 'Lopa Next' },
  { slug: 'trybe', name: 'Lopa Trybe' },
  { slug: 'prime', name: 'Lopa Prime' },
  { slug: 'men', name: 'Lopa Men' },
  { slug: 'fashion', name: 'Lopa Fashion' },
  { slug: 'bridal', name: 'Lopa Bridal' },
  { slug: 'lopaworld', name: 'Lopaworld' },
] as const;

export type LabelSlug = (typeof LABELS)[number]['slug'];

export type ProductEditorialMetadata = {
  label: LabelSlug;
  fit?: string;
  fabric?: string;
  care?: string;
  made_to_order?: boolean;
  lead_time_days?: number | null;
  delivery_note?: string;
  size_guide_id?: string;
  occasion?: string[];
  model_info?: string;
  image_alt_texts?: string[];
};
