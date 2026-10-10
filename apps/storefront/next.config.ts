import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';
import redirects from './redirects.json';

const nextConfig: NextConfig = {
  transpilePackages: ['@lopaworld/ui', '@lopaworld/types'],
  async redirects() {
    return redirects;
  },
};

export default withPayload(nextConfig);
