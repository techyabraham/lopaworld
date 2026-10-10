'use client';

import { useEffect } from 'react';
import type { StoreAnalyticsEvent } from '@lopaworld/types';
import { trackStoreEvent } from '../../lib/analytics';

export function TrackEvent({ name, params }: StoreAnalyticsEvent) {
  useEffect(() => { trackStoreEvent({ name, params }); }, [name, params]);
  return null;
}
