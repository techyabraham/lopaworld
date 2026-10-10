import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';
import { Campaigns } from './src/collections/Campaigns';
import { Labels } from './src/collections/Labels';
import { Media } from './src/collections/Media';
import { Pages } from './src/collections/Pages';
import { SizeGuides } from './src/collections/SizeGuides';
import { Stories } from './src/collections/Stories';
import { Users } from './src/collections/Users';
import { AnnouncementBar } from './src/globals/AnnouncementBar';
import { HomepageLayout } from './src/globals/HomepageLayout';
import { Navigation } from './src/globals/Navigation';
import { SEODefaults } from './src/globals/SEODefaults';

const payloadSecret = process.env.PAYLOAD_SECRET;
if (!payloadSecret) throw new Error('Missing required environment variable: PAYLOAD_SECRET');
if (!process.env.PREVIEW_SECRET) throw new Error('Missing required environment variable: PREVIEW_SECRET');

export default buildConfig({
  admin: {
    user: 'users',
    importMap: { baseDir: process.cwd() },
  },
  collections: [Users, Media, Labels, Campaigns, Stories, SizeGuides, Pages],
  globals: [HomepageLayout, Navigation, AnnouncementBar, SEODefaults],
  editor: lexicalEditor(),
  secret: payloadSecret,
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL ?? '' },
    schemaName: 'payload',
  }),
  typescript: { outputFile: './src/payload-types.ts' },
});
