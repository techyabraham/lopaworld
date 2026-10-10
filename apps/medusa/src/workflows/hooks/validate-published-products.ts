import { createProductsWorkflow, updateProductsWorkflow } from '@medusajs/medusa/core-flows';
import { ContainerRegistrationKeys, MedusaError } from '@medusajs/framework/utils';
import { validateProductForPublishing, type PublishedProductCandidate } from '../../utils/product-validation';

const productFields = [
  'id', 'title', 'status', 'metadata', 'images.url', 'images.metadata',
  'options.title', 'options.values',
  'variants.title', 'variants.sku', 'variants.allow_backorder', 'variants.options.value',
  'variants.prices.amount', 'variants.prices.currency_code',
];

async function validatePublishedProducts(ids: string[], container: { resolve: (key: string) => unknown }) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as {
    graph: (input: { entity: string; fields: string[]; filters: { id: string } }) => Promise<{ data: unknown[] }>;
  };

  for (const id of ids) {
    const { data } = await query.graph({ entity: 'product', fields: productFields, filters: { id } });
    const product = data[0] as PublishedProductCandidate | undefined;
    if (!product || product.status !== 'published') continue;
    const errors = validateProductForPublishing(product);
    if (errors.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, errors.join('\n'));
  }
}

createProductsWorkflow.hooks.productsCreated(async ({ products }, { container }) => {
  await validatePublishedProducts(products.map(({ id }) => id), container);
});

updateProductsWorkflow.hooks.productsUpdated(async ({ products }, { container }) => {
  await validatePublishedProducts(products.map(({ id }) => id), container);
});
