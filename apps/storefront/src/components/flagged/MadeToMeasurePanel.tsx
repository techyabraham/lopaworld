'use client';

import { useState } from 'react';
import { features } from '../../lib/env';

// Phase 3 feature, presentational only (design brief §1, §5.5). Renders only when
// NEXT_PUBLIC_FEATURE_MTM is on, or in /dev/ui with `preview`. Every business fact below is a
// TODO_CONFIRM placeholder: lead times, measurements and fitting options are not confirmed (D4).
export function MadeToMeasurePanel({ preview = false }: { preview?: boolean }) {
  const [mode, setMode] = useState<'rtw' | 'mtm'>('rtw');
  if (!features.madeToMeasure && !preview) return null;
  const tab = (id: 'rtw' | 'mtm', title: string, note: string) => <button type="button" role="tab" id={`mtm-tab-${id}`} aria-selected={mode === id} aria-controls={`mtm-panel-${id}`} tabIndex={mode === id ? 0 : -1} className="mtm-tab" onClick={() => setMode(id)} onKeyDown={(event) => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { const next = mode === 'rtw' ? 'mtm' : 'rtw'; setMode(next); document.getElementById(`mtm-tab-${next}`)?.focus(); } }}>
    <span className="mtm-tab-title">{title}</span><span className="mtm-tab-note">{note}</span>
  </button>;
  return <div className="mtm">
    <div role="tablist" aria-label="How do you want it?" className="mtm-tabs">
      {tab('rtw', 'Ready to wear', 'TODO_CONFIRM: dispatch time')}
      {tab('mtm', 'Made to measure', 'Cut to your Fit Profile')}
    </div>
    <div role="tabpanel" id="mtm-panel-rtw" aria-labelledby="mtm-tab-rtw" hidden={mode !== 'rtw'} className="mtm-panel-rtw">The size selector stays as it is for ready to wear.</div>
    <div role="tabpanel" id="mtm-panel-mtm" aria-labelledby="mtm-tab-mtm" hidden={mode !== 'mtm'} className="mtm-panel">
      <div className="mtm-panel-head"><span className="mtm-panel-title">Your Lopa Fit Profile</span><span className="mtm-panel-badge">TODO_CONFIRM: saved state</span></div>
      <dl className="mtm-measures">
        {['Chest', 'Waist', 'Shoulder', 'Length'].map((name) => <div key={name}><dt>{name} cm</dt><dd>—</dd></div>)}
      </dl>
      <p className="mtm-note">TODO_CONFIRM: how measurements are taken and checked (studio or video fitting).</p>
      <p className="mtm-ready"><strong>TODO_CONFIRM: ready-by date</strong>, from a confirmed lead time.</p>
    </div>
  </div>;
}
