import { createHash, createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PaystackPaymentProviderService from './service.js';

// Placeholder test values only; no request leaves the process (fetch is stubbed).
const secretKey = 'sk_test_unit_placeholder';
const options = { secretKey, callbackUrl: 'https://shop.example/checkout/return', channels: ['card', 'bank_transfer'] };
const sessionId = 'payses_unit_01';

const reference = (amountMinor: number, attempt = 0) =>
  `lw${createHash('sha256').update(`${sessionId}:${amountMinor}:${attempt}`).digest('hex').slice(0, 28)}`;

type Call = { url: string; method: string; body?: Record<string, unknown>; headers: Record<string, string> };
let calls: Call[];
let routes: Record<string, (body?: Record<string, unknown>) => { status?: number; json: unknown }>;

function paystack(handlers: typeof routes) {
  routes = handlers;
  calls = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit = {}) => {
    const path = new URL(url).pathname;
    const body = init.body ? JSON.parse(String(init.body)) as Record<string, unknown> : undefined;
    calls.push({ url, method: init.method ?? 'GET', body, headers: init.headers as Record<string, string> });
    const route = routes[`${init.method ?? 'GET'} ${path}`];
    if (!route) throw new Error(`Unexpected Paystack call: ${init.method} ${path}`);
    const { status = 200, json } = route(body);
    return new Response(JSON.stringify(json), { status, headers: { 'content-type': 'application/json' } });
  }));
}

const ok = <T>(data: T) => ({ json: { status: true, message: 'ok', data } });
const transaction = (overrides: Record<string, unknown> = {}) => ({
  id: 9001, reference: reference(1500000), status: 'success', amount: 1500000, currency: 'NGN', channel: 'card', paid_at: '2026-11-05T10:00:00Z',
  metadata: JSON.stringify({ session_id: sessionId, expected_amount_minor: 1500000, currency_code: 'NGN', attempt: 0 }),
  ...overrides,
});
const session = (overrides: Record<string, unknown> = {}) => ({
  reference: reference(1500000), expected_amount_minor: 1500000, currency_code: 'NGN', session_id: sessionId, email: 'guest@example.com', attempt: 0, ...overrides,
});
const verifyRoute = (data: unknown) => ({ [`GET /transaction/verify/${encodeURIComponent(reference(1500000))}`]: () => ok(data) });

const provider = () => new PaystackPaymentProviderService({}, options);

beforeEach(() => paystack({}));
afterEach(() => vi.unstubAllGlobals());

describe('validateOptions', () => {
  it('accepts complete configuration', () => {
    expect(() => PaystackPaymentProviderService.validateOptions(options)).not.toThrow();
    expect(() => PaystackPaymentProviderService.validateOptions({ ...options, callbackUrl: 'http://localhost:3000/checkout/return' })).not.toThrow();
  });

  it.each([
    ['a missing secret key', { ...options, secretKey: ' ' }, /PAYSTACK_SECRET_KEY/],
    ['a non-HTTPS callback outside localhost', { ...options, callbackUrl: 'http://shop.example/return' }, /PAYSTACK_CALLBACK_URL/],
    ['no approved channels', { ...options, channels: [] }, /PAYSTACK_CHANNELS/],
  ])('rejects %s', (_, invalid, message) => {
    expect(() => PaystackPaymentProviderService.validateOptions(invalid)).toThrow(message);
  });
});

describe('initiatePayment', () => {
  const initialized = (body?: Record<string, unknown>) => ok({ reference: body?.reference, authorization_url: 'https://checkout.paystack.com/abc', access_code: 'abc' });

  it('initialises an NGN transaction in kobo with a deterministic reference', async () => {
    paystack({ 'POST /transaction/initialize': initialized });

    const result = await provider().initiatePayment({ amount: 15000, currency_code: 'ngn', data: { email: 'guest@example.com', session_id: sessionId } } as never);

    expect(calls).toHaveLength(1);
    expect(calls[0].headers.authorization).toBe(`Bearer ${secretKey}`);
    expect(calls[0].body).toMatchObject({
      email: 'guest@example.com', amount: '1500000', currency: 'NGN', reference: reference(1500000),
      callback_url: options.callbackUrl, channels: options.channels,
    });
    expect(JSON.parse(String(calls[0].body?.metadata))).toEqual({ session_id: sessionId, expected_amount_minor: 1500000, currency_code: 'NGN', attempt: 0 });
    expect(result).toEqual({
      id: reference(1500000),
      data: expect.objectContaining({ reference: reference(1500000), authorization_url: 'https://checkout.paystack.com/abc', expected_amount_minor: 1500000, currency_code: 'NGN', session_id: sessionId, attempt: 0 }),
    });
  });

  it.each([
    [1999.995, 200000],
    ['1999.995', 200000],
    [12345.675, 1234568],
    [0.1 + 0.2, 30],
    [99.99, 9999],
    [150000, 15000000],
  ])('converts %s naira to %i kobo (toMinorUnits, half-up)', async (amount, kobo) => {
    paystack({ 'POST /transaction/initialize': initialized });

    await provider().initiatePayment({ amount, currency_code: 'NGN', data: { email: 'guest@example.com', session_id: sessionId } } as never);

    expect(calls[0].body?.amount).toBe(String(kobo));
  });

  it('falls back to the customer email and idempotency key from context', async () => {
    paystack({ 'POST /transaction/initialize': initialized });

    await provider().initiatePayment({ amount: 15000, currency_code: 'NGN', data: {}, context: { customer: { email: 'ctx@example.com' }, idempotency_key: sessionId } } as never);

    expect(calls[0].body).toMatchObject({ email: 'ctx@example.com', reference: reference(1500000) });
  });

  it.each([
    ['a non-NGN currency', { amount: 100, currency_code: 'usd', data: { email: 'guest@example.com', session_id: sessionId } }, /Only NGN/],
    ['an invalid email', { amount: 100, currency_code: 'ngn', data: { email: 'not-an-email', session_id: sessionId } }, /checkout email/],
    ['a missing session', { amount: 100, currency_code: 'ngn', data: { email: 'guest@example.com' } }, /payment session/],
    ['a zero total', { amount: 0, currency_code: 'ngn', data: { email: 'guest@example.com', session_id: sessionId } }, /total is invalid/],
  ])('rejects %s without calling Paystack', async (_, input, message) => {
    await expect(provider().initiatePayment(input as never)).rejects.toThrow(message);
    expect(calls).toHaveLength(0);
  });

  it('surfaces a Paystack API refusal as an error', async () => {
    paystack({ 'POST /transaction/initialize': () => ({ status: 400, json: { status: false, message: 'Invalid key' } }) });

    await expect(provider().initiatePayment({ amount: 100, currency_code: 'NGN', data: { email: 'guest@example.com', session_id: sessionId } } as never)).rejects.toThrow('Invalid key');
  });
});

describe('authorizePayment', () => {
  it('captures a verified successful transaction', async () => {
    paystack(verifyRoute(transaction()));

    const result = await provider().authorizePayment({ data: session() } as never);

    expect(result).toEqual({ status: 'captured', data: expect.objectContaining({ transaction_id: 9001, channel: 'card', paid_at: '2026-11-05T10:00:00Z' }) });
  });

  it.each([
    ['abandoned', 'error'],
    ['failed', 'error'],
    ['ongoing', 'pending_authorization'],
  ])('maps a %s transaction to %s', async (status, expected) => {
    paystack(verifyRoute(transaction({ status })));

    expect((await provider().authorizePayment({ data: session() } as never)).status).toBe(expected);
  });

  it.each([
    ['amount', { amount: 1400000 }],
    ['currency', { currency: 'USD' }],
    ['reference', { reference: reference(1500000, 1) }],
  ])('rejects a verified transaction whose %s does not match the session', async (_, mismatch) => {
    paystack(verifyRoute(transaction(mismatch)));

    await expect(provider().authorizePayment({ data: session() } as never)).rejects.toThrow(/does not match the current checkout/);
  });

  it('rejects an incomplete session without calling Paystack', async () => {
    await expect(provider().authorizePayment({ data: { reference: reference(1500000) } } as never)).rejects.toThrow(/incomplete/);
    expect(calls).toHaveLength(0);
  });
});

describe('updatePayment', () => {
  it('keeps a pending session when the amount is unchanged', async () => {
    paystack(verifyRoute(transaction({ status: 'ongoing' })));

    const result = await provider().updatePayment({ amount: 15000, currency_code: 'ngn', data: session() } as never);

    expect(result).toEqual({ status: 'pending', data: session() });
    expect(calls.map(({ method }) => method)).toEqual(['GET']);
  });

  it('reports captured when the unchanged session already succeeded', async () => {
    paystack(verifyRoute(transaction()));

    expect(await provider().updatePayment({ amount: 15000, currency_code: 'NGN', data: session() } as never)).toEqual({ status: 'captured', data: { ...session(), transaction_id: 9001 } });
  });

  it('starts a new attempt with a new reference after a failed transaction', async () => {
    paystack({
      ...verifyRoute(transaction({ status: 'failed' })),
      'POST /transaction/initialize': (body) => ok({ reference: body?.reference, authorization_url: 'https://checkout.paystack.com/retry', access_code: 'retry' }),
    });

    const result = await provider().updatePayment({ amount: 15000, currency_code: 'NGN', data: session() } as never);

    expect(calls[1].body?.reference).toBe(reference(1500000, 1));
    expect(result).toEqual({ status: 'pending', data: expect.objectContaining({ reference: reference(1500000, 1), attempt: 1 }) });
  });

  it('re-initialises without verifying when the cart total changed', async () => {
    paystack({ 'POST /transaction/initialize': (body) => ok({ reference: body?.reference, authorization_url: 'https://checkout.paystack.com/new', access_code: 'new' }) });

    await provider().updatePayment({ amount: 16000, currency_code: 'NGN', data: session() } as never);

    expect(calls.map(({ method }) => method)).toEqual(['POST']);
    expect(calls[0].body).toMatchObject({ amount: '1600000', reference: reference(1600000, 1) });
  });
});

describe('capturePayment, cancelPayment, deletePayment', () => {
  it('capture marks the data captured without calling Paystack', async () => {
    expect(await provider().capturePayment({ data: session() } as never)).toEqual({ data: { ...session(), captured: true } });
    expect(calls).toHaveLength(0);
  });

  it('cancel and delete never record a cancellation Paystack did not make', async () => {
    expect(await provider().cancelPayment({ data: session() } as never)).toEqual({ data: session() });
    expect(await provider().deletePayment({ data: session() } as never)).toEqual({ data: session() });
    expect(calls).toHaveLength(0);
  });
});

describe('refundPayment', () => {
  it('refunds a verified transaction in kobo', async () => {
    paystack({ ...verifyRoute(transaction()), 'POST /refund': (body) => ok({ id: 77, status: 'pending', amount: Number(body?.amount), transaction: { reference: body?.transaction } }) });

    const result = await provider().refundPayment({ amount: 5000.5, data: session() } as never);

    expect(calls[1].body).toEqual({ transaction: reference(1500000), amount: '500050', currency: 'NGN' });
    expect(result.data).toMatchObject({ refund_id: 77, refund_status: 'pending', refunded_amount_minor: 500050 });
  });

  it.each([
    ['more than was paid', 15000.01, transaction()],
    ['a zero amount', 0, transaction()],
    ['an unsuccessful transaction', 100, transaction({ status: 'failed' })],
  ])('rejects refunding %s', async (_, amount, verified) => {
    paystack(verifyRoute(verified));

    await expect(provider().refundPayment({ amount, data: session() } as never)).rejects.toThrow(/refund amount is invalid/);
    expect(calls.some(({ url }) => url.endsWith('/refund'))).toBe(false);
  });

  it('rejects a refund when the verified transaction does not match the session', async () => {
    paystack(verifyRoute(transaction({ amount: 1 })));

    await expect(provider().refundPayment({ amount: 100, data: session() } as never)).rejects.toThrow(/does not match/);
  });

  it('requires a stored reference', async () => {
    await expect(provider().refundPayment({ amount: 100, data: {} } as never)).rejects.toThrow(/reference is required/);
  });
});

describe('retrievePayment and getPaymentStatus', () => {
  it('retrieve returns the verified transaction details', async () => {
    paystack(verifyRoute(transaction()));

    expect((await provider().retrievePayment({ data: session() } as never)).data).toMatchObject({ transaction_id: 9001, status: 'success', amount: 1500000, currency: 'NGN' });
  });

  it('retrieve without a reference returns the data unchanged', async () => {
    expect(await provider().retrievePayment({ data: { note: 'x' } } as never)).toEqual({ data: { note: 'x' } });
  });

  it.each([
    ['success', 'captured'],
    ['failed', 'error'],
    ['abandoned', 'error'],
    ['ongoing', 'pending'],
  ])('status maps %s to %s', async (status, expected) => {
    paystack(verifyRoute(transaction({ status })));

    expect((await provider().getPaymentStatus({ data: session() } as never)).status).toBe(expected);
  });

  it('status without a reference is an error', async () => {
    expect(await provider().getPaymentStatus({ data: {} } as never)).toEqual({ status: 'error' });
  });
});

describe('getWebhookActionAndData', () => {
  const event = (name = 'charge.success', ref = reference(1500000)) => ({ event: name, data: { reference: ref } });
  const signed = (data: Record<string, unknown>, key = secretKey) => {
    const rawData = JSON.stringify(data);
    return { data, rawData, headers: { 'X-Paystack-Signature': createHmac('sha512', key).update(rawData).digest('hex') } };
  };

  it('captures a correctly signed charge.success after verifying with Paystack', async () => {
    paystack(verifyRoute(transaction()));

    const result = await provider().getWebhookActionAndData(signed(event()) as never);

    expect(result.action).toBe('captured');
    expect(result.data?.session_id).toBe(sessionId);
    expect(Number(result.data?.amount)).toBe(15000);
  });

  it('returns the same result for a duplicate delivery and makes no other Paystack call', async () => {
    paystack(verifyRoute(transaction()));
    const payload = signed(event());

    const first = await provider().getWebhookActionAndData(payload as never);
    const second = await provider().getWebhookActionAndData(payload as never);

    expect(second.action).toBe(first.action);
    expect(second.data?.session_id).toBe(first.data?.session_id);
    expect(Number(second.data?.amount)).toBe(Number(first.data?.amount));
    expect(calls.every(({ method, url }) => method === 'GET' && url.includes('/transaction/verify/'))).toBe(true);
  });

  it('rejects a payload signed with another key', async () => {
    await expect(provider().getWebhookActionAndData(signed(event(), 'sk_test_someone_else') as never)).rejects.toThrow(/signature is invalid/);
    expect(calls).toHaveLength(0);
  });

  it('rejects a payload whose body was altered after signing', async () => {
    const payload = signed(event());

    await expect(provider().getWebhookActionAndData({ ...payload, rawData: payload.rawData.replace('charge.success', 'charge.failed') } as never)).rejects.toThrow(/signature is invalid/);
  });

  it('rejects a payload without a signature header', async () => {
    const payload = signed(event());

    await expect(provider().getWebhookActionAndData({ ...payload, headers: {} } as never)).rejects.toThrow(/signature is invalid/);
  });

  it('ignores unsupported events', async () => {
    expect(await provider().getWebhookActionAndData(signed(event('transfer.success')) as never)).toEqual({ action: 'not_supported' });
    expect(calls).toHaveLength(0);
  });

  it.each([
    ['the paid amount differs from the expected amount', transaction({ amount: 100 })],
    ['the currency is not NGN', transaction({ currency: 'USD', metadata: JSON.stringify({ session_id: sessionId, expected_amount_minor: 1500000, currency_code: 'USD', attempt: 0 }) })],
    ['the reference does not derive from the session metadata', transaction({ metadata: JSON.stringify({ session_id: 'payses_other', expected_amount_minor: 1500000, currency_code: 'NGN', attempt: 0 }) })],
    ['the metadata is missing', transaction({ metadata: null })],
  ])('rejects a webhook when %s', async (_, verified) => {
    paystack(verifyRoute(verified));

    await expect(provider().getWebhookActionAndData(signed(event()) as never)).rejects.toThrow(/does not match its checkout session/);
  });

  it('reports charge.failed as failed for the session', async () => {
    paystack(verifyRoute(transaction({ status: 'failed' })));

    const result = await provider().getWebhookActionAndData(signed(event('charge.failed')) as never);

    expect(result.action).toBe('failed');
    expect(result.data?.session_id).toBe(sessionId);
  });

  it('rejects a webhook without a reference', async () => {
    await expect(provider().getWebhookActionAndData(signed({ event: 'charge.success', data: {} }) as never)).rejects.toThrow(/reference is missing/);
  });
});
