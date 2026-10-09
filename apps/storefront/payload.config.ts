import { postgresAdapter } from '@payloadcms/db-postgres';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { buildConfig } from 'payload';

const payloadSecret = process.env.PAYLOAD_SECRET;
if (!payloadSecret) {
  throw new Error('Missing required environment variable: PAYLOAD_SECRET');
}

export default buildConfig({
  admin: {
    user: 'users',
    importMap: { baseDir: process.cwd() },
  },
  collections: [
    {
      slug: 'users',
      auth: true,
      fields: [{ name: 'name', type: 'text' }],
    },
  ],
  editor: lexicalEditor(),
  secret: payloadSecret,
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL ?? '' },
    schemaName: 'payload',
  }),
  typescript: { outputFile: './src/payload-types.ts' },
});
