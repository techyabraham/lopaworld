import { LABELS, type ProductEditorialMetadata } from '@lopaworld/types';

type ProductImage = { url?: unknown; alt?: unknown; metadata?: Record<string, unknown> | null };
type ProductOptionValue = { value?: unknown };
type ProductVariant = {
  title?: unknown;
  sku?: unknown;
  options?: ProductOptionValue[] | Record<string, unknown>;
  prices?: Array<{ currency_code?: unknown; amount?: unknown }>;
};

export type PublishedProductCandidate = {
  id: string;
  title?: unknown;
  status?: unknown;
  metadata?: Record<string, unknown> | null;
  images?: ProductImage[] | null;
  options?: Array<{ title?: unknown; values?: unknown[] }> | null;
  variants?: ProductVariant[] | null;
};

export function validateProductForPublishing(product: PublishedProductCandidate): string[] {
  const errors: string[] = [];
  const title = typeof product.title === 'string' && product.title.trim() ? product.title : product.id;
  const metadata = product.metadata ?? {};
  const label = metadata.label;
  const allowedLabels = LABELS.map(({ slug }) => slug);

  if (typeof label !== 'string' || !allowedLabels.includes(label as ProductEditorialMetadata['label'])) {
    errors.push(`${title}: metadata.label must be one of ${allowedLabels.join(', ')}.`);
  }

  const images = product.images ?? [];
  if (!images.length) errors.push(`${title}: add at least one product image.`);
  const altTexts = Array.isArray(metadata.image_alt_texts) ? metadata.image_alt_texts : [];
  images.forEach((image, index) => {
    const alt = typeof image.alt === 'string' ? image.alt :
      typeof image.metadata?.alt === 'string' ? image.metadata.alt : altTexts[index];
    if (typeof image.url !== 'string' || !image.url.trim()) errors.push(`${title}: image ${index + 1} needs a URL.`);
    if (typeof alt !== 'string' || !alt.trim()) errors.push(`${title}: image ${index + 1} needs alternative text.`);
  });

  const options = product.options ?? [];
  if (!options.length) errors.push(`${title}: add at least one product option (for example, size or a named one-size option).`);
  options.forEach((option, index) => {
    if (typeof option.title !== 'string' || !option.title.trim()) errors.push(`${title}: product option ${index + 1} needs a title.`);
    if (!Array.isArray(option.values) || !option.values.length || option.values.some((value) => typeof value !== 'string' || !value.trim())) {
      errors.push(`${title}: product option ${index + 1} needs at least one non-empty value.`);
    }
  });

  const variants = product.variants ?? [];
  if (!variants.length) errors.push(`${title}: add at least one variant.`);
  variants.forEach((variant, index) => {
    const variantTitle = typeof variant.title === 'string' && variant.title.trim() ? variant.title : `variant ${index + 1}`;
    if (typeof variant.sku !== 'string' || !variant.sku.trim()) errors.push(`${title}: ${variantTitle} needs a SKU.`);
    const selectedOptions = Array.isArray(variant.options)
      ? variant.options.map(({ value }) => value)
      : Object.values(variant.options ?? {});
    if (options.length && (selectedOptions.length !== options.length || selectedOptions.some((value) => typeof value !== 'string' || !value.trim()))) {
      errors.push(`${title}: ${variantTitle} must select a value for every product option.`);
    }
    const ngnPrices = (variant.prices ?? []).filter((price) => price.currency_code === 'ngn');
    if (!ngnPrices.some((price) => typeof price.amount === 'number' && Number.isFinite(price.amount) && price.amount > 0)) {
      errors.push(`${title}: ${variantTitle} needs a positive NGN price.`);
    }
  });

  if (metadata.made_to_order !== undefined && typeof metadata.made_to_order !== 'boolean') {
    errors.push(`${title}: metadata.made_to_order must be true or false.`);
  }
  if (metadata.made_to_order === true && metadata.lead_time_days !== null &&
      (typeof metadata.lead_time_days !== 'number' || !Number.isInteger(metadata.lead_time_days) || metadata.lead_time_days < 1)) {
    errors.push(`${title}: made-to-order products need a positive integer metadata.lead_time_days or null.`);
  }

  return errors;
}
