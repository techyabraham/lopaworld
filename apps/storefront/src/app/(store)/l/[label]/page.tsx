import { LabelLandingPage } from '../../../../components/storefront/LabelLandingPage';

export const dynamic = 'force-dynamic';
export default async function LabelPage({ params }: { params: Promise<{ label: string }> }) {
  const { label } = await params;
  return <LabelLandingPage slug={label} />;
}
