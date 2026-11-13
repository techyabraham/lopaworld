// pnpm test:lhci, pass 1 of 2 (ADR-015): applied ("devtools") throttling, mobile defaults
// (Moto G Power, slow 4G). Gates the §7 budgets: performance >= 90, LCP <= 2.0 s, CLS <= 0.05.
const urls = ['/', '/l/trybe', '/shop', '/p/test-agbada'].map((path) => `http://localhost:${process.env.LHCI_PORT ?? 3000}${path}`);

module.exports = {
  ci: {
    collect: {
      url: urls,
      numberOfRuns: 3,
      startServerCommand: 'node scripts/lhci-server.mjs',
      startServerReadyPattern: 'lhci server ready',
      startServerReadyTimeout: 180000,
      settings: {
        onlyCategories: ['performance'],
        throttlingMethod: 'devtools',
        chromeFlags: '--headless=new --no-sandbox',
      },
    },
    assert: {
      // Median of the three runs per URL.
      aggregationMethod: 'median-run',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.05 }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci/applied' },
  },
};
