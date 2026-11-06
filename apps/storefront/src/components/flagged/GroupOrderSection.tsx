import { features } from '../../lib/env';

// Phase 4 feature, presentational only (design brief §1, §5.2 canvas "Dress the whole party").
// Renders only when NEXT_PUBLIC_FEATURE_GROUP_ORDERS is on, or in /dev/ui with `preview`. The copy
// is TODO_CONFIRM: how group orders, split payment and the roster work is not decided (D5, Phase 4),
// and WhatsApp sharing waits for D5.
export function GroupOrderSection({ preview = false }: { preview?: boolean }) {
  if (!features.groupOrders && !preview) return null;
  return <section className="group-order" aria-labelledby="group-order-heading">
    <div className="group-order-media" aria-hidden="true" />
    <div className="group-order-copy">
      <p className="lw-eyebrow group-order-eyebrow">Group orders</p>
      <h2 id="group-order-heading" className="lw-display group-order-title">Dress the<br />whole party.</h2>
      <p className="group-order-body">TODO_CONFIRM: how a host chooses one fabric and style, how guests add their sizes, and who pays.</p>
      <dl className="group-order-facts">
        <div><dt>1 link</dt><dd>TODO_CONFIRM</dd></div>
        <div><dt>Split</dt><dd>TODO_CONFIRM</dd></div>
        <div><dt>Live</dt><dd>TODO_CONFIRM</dd></div>
      </dl>
      <span className="lw-button group-order-cta" aria-disabled="true">Start a group order</span>
    </div>
  </section>;
}
