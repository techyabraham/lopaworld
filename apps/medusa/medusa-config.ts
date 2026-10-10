import { defineConfig, loadEnv } from '@medusajs/framework/utils';

loadEnv(process.env.NODE_ENV ?? 'development', process.cwd());

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export default defineConfig({
  modules: paystackOptions() ? [{
    resolve: '@medusajs/medusa/payment',
    options: { providers: [{ resolve: '@lopaworld/payment-paystack', id: 'paystack', options: paystackOptions() }] },
  }] : [],
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

function paystackOptions() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  const callbackUrl = process.env.PAYSTACK_CALLBACK_URL;
  const channels = process.env.PAYSTACK_CHANNELS?.split(',').map((channel) => channel.trim()).filter(Boolean);
  if (!secretKey || secretKey.startsWith('replace-') || !callbackUrl || !channels?.length) return null;
  return { secretKey, callbackUrl, channels };
}
