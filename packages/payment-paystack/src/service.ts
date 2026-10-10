import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { AbstractPaymentProvider, BigNumber, MedusaError } from '@medusajs/framework/utils';
import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from '@medusajs/framework/types';

type Options = {
  secretKey: string;
  callbackUrl: string;
  channels: string[];
};

type PaystackTransaction = {
  id: number;
  reference: string;
  status: string;
  amount: number;
  currency: string;
  metadata?: unknown;
  paid_at?: string | null;
  channel?: string;
};

type PaystackEnvelope<T> = { status: boolean; message?: string; data: T };
type TransactionInitialized = { reference: string; authorization_url: string; access_code: string };
type StoredSession = {
  reference?: string;
  authorization_url?: string;
  access_code?: string;
  expected_amount_minor?: number;
  currency_code?: string;
  session_id?: string;
  email?: string;
  transaction_id?: number;
  attempt?: number;
  [key: string]: unknown;
};

const api = 'https://api.paystack.co';

export default class PaystackPaymentProviderService extends AbstractPaymentProvider<Options> {
  static identifier = 'paystack';

  constructor(container: Record<string, unknown>, options: Options) {
    super(container, options);
  }

  static validateOptions(options: Record<string, unknown>) {
    if (typeof options.secretKey !== 'string' || !options.secretKey.trim()) throw new MedusaError(MedusaError.Types.INVALID_DATA, 'PAYSTACK_SECRET_KEY is required.');
    if (typeof options.callbackUrl !== 'string' || !options.callbackUrl.startsWith('https://') && !options.callbackUrl.startsWith('http://localhost')) throw new MedusaError(MedusaError.Types.INVALID_DATA, 'PAYSTACK_CALLBACK_URL must be an absolute HTTPS URL (localhost is allowed for local development).');
    if (!Array.isArray(options.channels) || !options.channels.length) throw new MedusaError(MedusaError.Types.INVALID_DATA, 'PAYSTACK_CHANNELS must list the payment channels approved by Lopaworld.');
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const amountMinor = toMinorUnits(input.amount);
    const currency = input.currency_code.toUpperCase();
    const email = validEmail(input.data?.email) ?? validEmail(input.context?.customer?.email);
    const sessionId = typeof input.data?.session_id === 'string' ? input.data.session_id : input.context?.idempotency_key;
    if (!email || !sessionId) throw new MedusaError(MedusaError.Types.INVALID_DATA, 'A valid checkout email and payment session are required to initialize Paystack.');
    if (currency !== 'NGN') throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Only NGN payments are enabled. International payment support is TODO_CONFIRM.');
    if (!Number.isSafeInteger(amountMinor) || amountMinor <= 0) throw new MedusaError(MedusaError.Types.INVALID_DATA, 'The checkout total is invalid.');

    const attempt = Number.isSafeInteger(input.data?.attempt) && Number(input.data?.attempt) >= 0 ? Number(input.data?.attempt) : 0;
    const reference = makeReference(sessionId, amountMinor, attempt);
    const transaction = await this.request<TransactionInitialized>('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        email,
        amount: String(amountMinor),
        currency,
        reference,
        callback_url: this.config.callbackUrl,
        channels: this.config.channels,
        metadata: JSON.stringify({ session_id: sessionId, expected_amount_minor: amountMinor, currency_code: currency, attempt }),
      }),
    });
    return {
      id: transaction.reference,
      data: { reference: transaction.reference, authorization_url: transaction.authorization_url, access_code: transaction.access_code, expected_amount_minor: amountMinor, currency_code: currency, session_id: sessionId, email, attempt },
    };
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const existing = input.data as StoredSession | undefined;
    const amountMinor = toMinorUnits(input.amount);
    if (existing?.reference && existing.expected_amount_minor === amountMinor && existing.currency_code === input.currency_code.toUpperCase()) {
      const transaction = await this.verify(existing.reference);
      assertTransactionMatches(transaction, existing);
      if (transaction.status === 'success') return { data: { ...existing, transaction_id: transaction.id }, status: 'captured' };
      if (transaction.status !== 'failed' && transaction.status !== 'abandoned') return { data: existing, status: 'pending' };
    }
    const attempt = existing && Number.isSafeInteger(existing.attempt) ? Number(existing.attempt) + 1 : 0;
    const initiated = await this.initiatePayment({ ...input, data: { ...input.data, session_id: existing?.session_id ?? input.context?.idempotency_key, attempt } });
    return { data: initiated.data, status: 'pending' };
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const session = input.data as StoredSession | undefined;
    if (!session?.reference || !Number.isSafeInteger(session.expected_amount_minor) || !session.currency_code || !session.session_id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Paystack session details are incomplete. Restart checkout to try again.');
    }
    const transaction = await this.verify(session.reference);
    assertTransactionMatches(transaction, session);
    if (transaction.status !== 'success') return { status: transaction.status === 'failed' || transaction.status === 'abandoned' ? 'error' : 'pending_authorization', data: session };
    return { status: 'captured', data: { ...session, transaction_id: transaction.id, channel: transaction.channel, paid_at: transaction.paid_at } };
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    return { data: { ...(input.data ?? {}), captured: true } };
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    // Paystack hosted attempts can be abandoned by the customer, but the transaction
    // cannot be cancelled through this provider path. Do not record a false cancellation.
    return { data: input.data };
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return { data: input.data };
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const session = input.data as StoredSession | undefined;
    if (!session?.reference) throw new MedusaError(MedusaError.Types.INVALID_DATA, 'A verified Paystack reference is required to refund this payment.');
    const transaction = await this.verify(session.reference);
    assertTransactionMatches(transaction, session);
    const amountMinor = toMinorUnits(input.amount);
    if (transaction.status !== 'success' || !Number.isSafeInteger(amountMinor) || amountMinor <= 0 || amountMinor > Number(session.expected_amount_minor)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'The Paystack transaction or refund amount is invalid.');
    }
    const amount = String(amountMinor);
    const refund = await this.request<{ id: number; status: string; transaction: { reference: string }; amount: number }>('/refund', {
      method: 'POST', body: JSON.stringify({ transaction: session.reference, amount, currency: session.currency_code ?? 'NGN' }),
    });
    return { data: { ...(input.data ?? {}), refund_id: refund.id, refund_status: refund.status, refunded_amount_minor: refund.amount } };
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const session = input.data as StoredSession | undefined;
    if (!session?.reference) return { data: input.data };
    const transaction = await this.verify(session.reference);
    assertTransactionMatches(transaction, session);
    return { data: { ...session, transaction_id: transaction.id, status: transaction.status, amount: transaction.amount, currency: transaction.currency } };
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const session = input.data as StoredSession | undefined;
    if (!session?.reference) return { status: 'error' };
    const transaction = await this.verify(session.reference);
    assertTransactionMatches(transaction, session);
    const status = transaction.status === 'success' ? 'captured' : transaction.status === 'failed' || transaction.status === 'abandoned' ? 'error' : 'pending';
    return { status, data: { ...session, transaction_id: transaction.id, status: transaction.status } };
  }

  async getWebhookActionAndData(payload: ProviderWebhookPayload['payload']): Promise<WebhookActionResult> {
    if (!this.isValidSignature(payload.rawData, payload.headers)) throw new MedusaError(MedusaError.Types.UNAUTHORIZED, 'Paystack webhook signature is invalid.');
    const event = payload.data;
    if (event.event !== 'charge.success' && event.event !== 'charge.failed') return { action: 'not_supported' };
    const eventData = asRecord(event.data);
    const reference = typeof eventData?.reference === 'string' ? eventData.reference : '';
    if (!reference) throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Paystack webhook reference is missing.');
    const transaction = await this.verify(reference);
    const metadata = asRecord(transaction.metadata) ?? parseRecord(transaction.metadata);
    const sessionId = typeof metadata?.session_id === 'string' ? metadata.session_id : '';
    const expectedAmount = metadata?.expected_amount_minor;
    const attempt = metadata?.attempt;
    const currency = typeof metadata?.currency_code === 'string' ? metadata.currency_code : '';
    if (!sessionId || !Number.isSafeInteger(expectedAmount) || !Number.isSafeInteger(attempt) || transaction.reference !== reference || reference !== makeReference(sessionId, Number(expectedAmount), Number(attempt)) || transaction.amount !== expectedAmount || currency.toUpperCase() !== 'NGN' || transaction.currency.toUpperCase() !== currency.toUpperCase()) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Paystack webhook transaction does not match its checkout session.');
    }
    if (transaction.status === 'success') {
      return { action: 'captured', data: { session_id: sessionId, amount: new BigNumber(transaction.amount / 100) } };
    }
    if (event.event === 'charge.failed') return { action: 'failed', data: { session_id: sessionId, amount: new BigNumber(expectedAmount / 100) } };
    return { action: 'pending' };
  }

  private async verify(reference: string) {
    return this.request<PaystackTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`, { method: 'GET' });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${api}${path}`, {
      ...init,
      headers: { authorization: `Bearer ${this.config.secretKey}`, 'content-type': 'application/json', ...init.headers },
      signal: AbortSignal.timeout(12_000),
    });
    const body = await response.json().catch(() => null) as PaystackEnvelope<T> | null;
    if (!response.ok || !body?.status || body.data === undefined) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, body?.message ?? `Paystack request failed (${response.status}).`);
    }
    return body.data;
  }

  private isValidSignature(rawData: string | Buffer, headers: Record<string, unknown>) {
    const signatureValue = Object.entries(headers).find(([name]) => name.toLowerCase() === 'x-paystack-signature')?.[1];
    const signature = typeof signatureValue === 'string' ? signatureValue : '';
    if (!signature) return false;
    const expected = createHmac('sha512', this.config.secretKey).update(rawData).digest();
    const received = Buffer.from(signature, 'hex');
    return expected.length === received.length && timingSafeEqual(expected, received);
  }
}

function toMinorUnits(value: InitiatePaymentInput['amount'] | RefundPaymentInput['amount']) {
  const major = new BigNumber(value).numeric;
  return Math.round((major + Number.EPSILON) * 100);
}

function makeReference(sessionId: string, amountMinor: number, attempt: number) {
  const suffix = createHash('sha256').update(`${sessionId}:${amountMinor}:${attempt}`).digest('hex').slice(0, 28);
  return `lw${suffix}`;
}

function validEmail(value: unknown): string | null {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function parseRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'string') return null;
  try { return asRecord(JSON.parse(value)); } catch { return null; }
}

function assertTransactionMatches(transaction: PaystackTransaction, session: StoredSession) {
  if (transaction.reference !== session.reference || transaction.amount !== session.expected_amount_minor || transaction.currency.toUpperCase() !== String(session.currency_code).toUpperCase()) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, 'Paystack payment amount, currency, or reference does not match the current checkout.');
  }
}
