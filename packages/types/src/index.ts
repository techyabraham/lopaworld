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

export const STORE_ANALYTICS_EVENTS = [
  'label_select', 'collection_view', 'search', 'search_zero_results', 'filter_apply', 'sort_change',
  'product_view', 'variant_select', 'add_to_bag', 'remove_from_bag', 'begin_checkout',
  'payment_failed', 'purchase', 'whatsapp_click', 'size_guide_open', 'notify_me_submit',
] as const;

export type StoreAnalyticsEventName = (typeof STORE_ANALYTICS_EVENTS)[number];
export type StoreAnalyticsEvent = {
  name: StoreAnalyticsEventName;
  params?: Record<string, string | number | boolean>;
};

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
  seo_title?: string;
  seo_description?: string;
  seo_image_url?: string;
};
