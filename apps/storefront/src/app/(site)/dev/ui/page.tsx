import Link from 'next/link';
import { notFound } from 'next/navigation';
import { EntranceHero } from '../../../../components/storefront/EntranceHero';
import { DropSection, OccasionTiles } from '../../../../components/storefront/HomePage';
import { ProductTile } from '../../../../components/storefront/ProductGrid';
import { MobileTabBar } from '../../../../components/site/MobileTabBar';
import { MadeToMeasurePanel } from '../../../../components/flagged/MadeToMeasurePanel';
import { GroupOrderSection } from '../../../../components/flagged/GroupOrderSection';
import { UiGalleryClient } from '../../../../components/dev/UiGalleryClient';
import { heroLabels, occasionLinks, tilePermutations } from '../../../../components/dev/gallery-fixtures';
import { features } from '../../../../lib/env';

export const dynamic = 'force-dynamic';

// §5.7: every component in every state. Development only: 404 in production (e2e checks the dev
// build; the production build never serves this route).
export default function UiGalleryPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <main className="dev-gallery" data-label="lopaworld">
    <Link className="gallery-back" href="/">← Back to storefront</Link>
    <p className="dev-banner">Development only · Component gallery. Every product, label line and figure here is fictional or marked TODO_CONFIRM.</p>
    <h1>Shared design system</h1>
    <p>Check at 360 px and with a keyboard.</p>

    <section className="gallery-section" aria-labelledby="g-hero"><h2 id="g-hero">Entrance hero — three labels</h2>
      <EntranceHero headline="Sample headline. Voice line." supportingCopy={null} image={null} secondaryCta={null} labels={heroLabels} />
    </section>
    <section className="gallery-section" aria-labelledby="g-drop"><h2 id="g-drop">The Drop</h2>
      <DropSection id="gallery-drop" heading="New in" products={tilePermutations} viewAll="/dev/ui" />
    </section>
    <section className="gallery-section" aria-labelledby="g-occasions"><h2 id="g-occasions">Occasion tiles</h2>
      <OccasionTiles heading="Where are you walking in?" links={occasionLinks} />
    </section>
    <section className="gallery-section" aria-labelledby="g-tiles"><h2 id="g-tiles">Product tile badges and colour summaries</h2>
      <ul className="product-grid">{tilePermutations.map((product) => <ProductTile key={product.id} product={product} />)}</ul>
    </section>
    <section className="gallery-section" aria-labelledby="g-tabbar"><h2 id="g-tabbar">Mobile tab bar (below 1024 px it is fixed to the viewport)</h2>
      <div className="gallery-frame"><MobileTabBar /></div>
    </section>
    <section className="gallery-section" aria-labelledby="g-mtm"><h2 id="g-mtm">Flagged: made to measure (NEXT_PUBLIC_FEATURE_MTM is {features.madeToMeasure ? 'on' : 'off'})</h2>
      <div className="gallery-field-wide"><MadeToMeasurePanel preview /></div>
    </section>
    <section className="gallery-section" aria-labelledby="g-group"><h2 id="g-group">Flagged: group orders (NEXT_PUBLIC_FEATURE_GROUP_ORDERS is {features.groupOrders ? 'on' : 'off'})</h2>
      <GroupOrderSection preview />
    </section>
    <UiGalleryClient />
  </main>;
}
