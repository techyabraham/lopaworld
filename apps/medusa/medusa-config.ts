import { defineConfig, loadEnv } from '@medusajs/framework/utils';

loadEnv(process.env.NODE_ENV ?? 'development', process.cwd());

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export default defineConfig({
  projectConfig: {
    databaseUrl: required('DATABASE_URL'),
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: required('STORE_CORS'),
      adminCors: required('ADMIN_CORS'),
      authCors: required('AUTH_CORS'),
      jwtSecret: required('JWT_SECRET'),
      cookieSecret: required('COOKIE_SECRET'),
    },
  },
});
