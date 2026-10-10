import config from '@payload-config';
import { notFound } from 'next/navigation';
import { getPayload } from 'payload';

type LabelDocument = {
  name?: string;
  slug?: string;
  introSummary?: string;
  accentToken?: string;
  heroMedia?: { url?: string; alt?: string } | string | null;
  featuredCollectionHandle?: string;
};

export default async function LabelPage({ params }: { params: Promise<{ label: string }> }) {
  const { label: slug } = await params;
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: 'labels',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
    overrideAccess: false,
  });
  const label = result.docs[0] as unknown as LabelDocument | undefined;
  if (!label?.slug || !label.name) notFound();

  const hero = typeof label.heroMedia === 'object' && label.heroMedia ? label.heroMedia : null;
  return <main className="phase-page" data-label={label.accentToken ?? label.slug}>
    <header>
      <p className="eyebrow">Lopaworld label</p>
      <h1>{label.name}</h1>
      {label.introSummary && <p>{label.introSummary}</p>}
    </header>
    {hero?.url && <figure className="label-hero"><img src={hero.url} alt={hero.alt ?? ''} /><figcaption>{hero.alt}</figcaption></figure>}
    {label.featuredCollectionHandle && <section aria-label="Featured collection reference" data-medusa-collection={label.featuredCollectionHandle} />}
  </main>;
}
