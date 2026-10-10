import { ProductPage } from '../../../../components/storefront/ProductPage';

export const dynamic = 'force-dynamic';
export default async function ProductRoute({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return <ProductPage handle={handle} />;
}
