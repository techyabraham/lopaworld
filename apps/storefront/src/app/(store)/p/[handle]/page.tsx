import type { Metadata } from 'next';
import { ProductPage } from '../../../../components/storefront/ProductPage';
import { canonical } from '../../../../lib/seo';
import { retrieveStoreProduct } from '../../../../lib/store';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  try {
    const product = await retrieveStoreProduct(handle);
    if (!product) return { title: 'Piece not found', robots: { index: false, follow: false } };
    const seoTitle = typeof product.metadata?.seo_title === 'string' ? product.metadata.seo_title.trim() : '';
    const seoDescription = typeof product.metadata?.seo_description === 'string' ? product.metadata.seo_description.trim() : '';
    const seoImage = typeof product.metadata?.seo_image_url === 'string' ? product.metadata.seo_image_url : undefined;
    const description = (seoDescription || product.description?.replace(/\s+/g, ' ').trim() || `Explore ${product.title} at Lopaworld.`).slice(0, 180);
    const image = seoImage || product.images?.[0]?.url || product.thumbnail || undefined;
    const path = `/p/${encodeURIComponent(product.handle)}`;
    return {
      title: seoTitle || product.title,
      description,
      alternates: { canonical: canonical(path) },
      openGraph: { type: 'website', title: seoTitle || product.title, description, url: canonical(path), images: image ? [{ url: image, alt: product.title }] : [] },
      twitter: { card: 'summary_large_image', title: seoTitle || product.title, description, images: image ? [image] : [] },
    };
  } catch {
    return { title: 'Lopaworld piece', robots: { index: false, follow: false } };
  }
}

export default async function ProductRoute({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  return <ProductPage handle={handle} />;
}
