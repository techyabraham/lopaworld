import config from '@payload-config';
import { draftMode } from 'next/headers';
import { redirect } from 'next/navigation';
import { getPayload } from 'payload';

export const metadata = { title: 'Homepage draft preview · Lopaworld', robots: { index: false, follow: false } };

type PreviewBlock = { id?: string; blockType?: string; heading?: string; headline?: string; supportingCopy?: string };

export default async function HomepageDraftPreview() {
  if (!(await draftMode()).isEnabled) redirect('/');
  const payload = await getPayload({ config });
  const homepage = await payload.findGlobal({ slug: 'homepage-layout', draft: true, overrideAccess: true });
  const blocks = (homepage as { layout?: PreviewBlock[] }).layout ?? [];

  return <main className="phase-page" data-preview="homepage-draft">
    <p className="eyebrow">Draft preview · not public content</p>
    <h1>Homepage layout preview</h1>
    <p>This preview shows the saved block order. Prices and inventory remain in Medusa.</p>
    {blocks.length === 0
      ? <p>No homepage blocks have been saved yet. Add blocks in Payload and open Preview again.</p>
      : blocks.map((block, index) => <section key={block.id ?? `${block.blockType}-${index}`} className="specimen" data-block-type={block.blockType}>
        <p className="eyebrow">{index + 1} · {block.blockType ?? 'content block'}</p>
        <h2>{block.headline ?? block.heading ?? 'Untitled demo block'}</h2>
        {block.supportingCopy && <p>{block.supportingCopy}</p>}
      </section>)}
  </main>;
}
