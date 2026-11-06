// Public feature flags (inlined at build time). Both default off: made-to-measure arrives in
// Phase 3 and group orders in Phase 4; until then their UI renders only in /dev/ui.
export const features = {
  madeToMeasure: process.env.NEXT_PUBLIC_FEATURE_MTM === 'true',
  groupOrders: process.env.NEXT_PUBLIC_FEATURE_GROUP_ORDERS === 'true',
} as const;
