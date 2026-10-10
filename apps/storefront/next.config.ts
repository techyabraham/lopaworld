import { withPayload } from '@payloadcms/next/withPayload';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = { transpilePackages: ['@lopaworld/ui', '@lopaworld/types'] };

export default withPayload(nextConfig);
