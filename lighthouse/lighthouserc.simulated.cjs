// pnpm test:lhci, pass 2 of 2 (ADR-015): Lighthouse's default simulated throttling, which models
// CPU cost without the noise of applied 4x CPU throttling on shared runners. Gates TBT <= 200 ms.
const applied = require('./lighthouserc.applied.cjs');

module.exports = {
  ci: {
    ...applied.ci,
    collect: { ...applied.ci.collect, settings: { ...applied.ci.collect.settings, throttlingMethod: 'simulate' } },
    assert: { aggregationMethod: 'median-run', assertions: { 'total-blocking-time': ['error', { maxNumericValue: 200 }] } },
    upload: { target: 'filesystem', outputDir: '.lighthouseci/simulated' },
  },
};
