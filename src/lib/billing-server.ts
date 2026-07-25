import {
  createCipheriv,
  createHash,
  createSign,
  randomBytes,
} from 'node:crypto';
import type { PlanId } from '@/lib/subscriptions';

export type StoreProvider = 'google_play' | 'cafebazaar' | 'myket';

export type PurchaseVerificationInput = {
  provider: StoreProvider;
  productId: string;
  purchaseToken: string;
  packageName: string;
  orderId?: string;
};

export type VerifiedPurchase = {
  provider: StoreProvider;
  planId: Exclude<PlanId, 'free'>;
  productId: string;
  packageName: string;
  orderId: string | null;
  activeUntil: Date;
  autoRenewing: boolean;
  status: 'active' | 'grace_period' | 'cancelled_active';
  rawState: string;
};

type GoogleServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

type CachedGoogleToken = { token: string; expiresAt: number };
let cachedGoogleToken: CachedGoogleToken | null = null;

function base64url(value: string | Buffer) {
  return Buffer.from(value).toString('base64url');
}

function getPlanForProduct(provider: StoreProvider, productId: string): Exclude<PlanId, 'free'> {
  const prefix = provider === 'google_play'
    ? 'GOOGLE_PLAY'
    : provider === 'cafebazaar'
      ? 'CAFEBAZAAR'
      : 'MYKET';
  const products: Record<Exclude<PlanId, 'free'>, string | undefined> = {
    plus: process.env[`${prefix}_PLUS_PRODUCT_ID`],
    pro: process.env[`${prefix}_PRO_PRODUCT_ID`],
  };
  const entry = Object.entries(products).find(([, configuredId]) => configuredId === productId);
  if (!entry) throw new Error(`Unknown ${provider} subscription product.`);
  return entry[0] as Exclude<PlanId, 'free'>;
}

async function getGoogleAccessToken() {
  if (cachedGoogleToken && cachedGoogleToken.expiresAt > Date.now() + 60_000) {
    return cachedGoogleToken.token;
  }

  const raw = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('Google Play service account is not configured.');
  const serviceAccount = JSON.parse(raw) as GoogleServiceAccount;
  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error('Google Play service account JSON is invalid.');
  }

  const now = Math.floor(Date.now() / 1_000);
  const tokenUri = serviceAccount.token_uri || 'https://oauth2.googleapis.com/token';
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = base64url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: tokenUri,
    iat: now,
    exp: now + 3_600,
  }));
  const unsigned = `${header}.${claims}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${base64url(signer.sign(serviceAccount.private_key))}`;

  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => null) as { access_token?: string; expires_in?: number; error_description?: string } | null;
  if (!response.ok || !payload?.access_token) {
    throw new Error(payload?.error_description || 'Failed to authorize with Google Play.');
  }
  cachedGoogleToken = {
    token: payload.access_token,
    expiresAt: Date.now() + (payload.expires_in || 3_600) * 1_000,
  };
  return payload.access_token;
}

async function acknowledgeGoogleSubscription(params: {
  packageName: string;
  productId: string;
  purchaseToken: string;
  accessToken: string;
}) {
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(params.packageName)}/purchases/subscriptions/${encodeURIComponent(params.productId)}/tokens/${encodeURIComponent(params.purchaseToken)}:acknowledge`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
    cache: 'no-store',
  });
  if (!response.ok && response.status !== 409) {
    throw new Error(`Google Play acknowledgement failed with status ${response.status}.`);
  }
}

async function verifyGooglePlay(input: PurchaseVerificationInput): Promise<VerifiedPurchase> {
  const configuredPackage = process.env.GOOGLE_PLAY_PACKAGE_NAME;
  if (!configuredPackage || input.packageName !== configuredPackage) {
    throw new Error('Google Play package name does not match this application.');
  }
  const planId = getPlanForProduct('google_play', input.productId);
  const accessToken = await getGoogleAccessToken();
  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(input.packageName)}/purchases/subscriptionsv2/tokens/${encodeURIComponent(input.purchaseToken)}`;
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => null) as any;
  if (!response.ok || !payload) {
    throw new Error(payload?.error?.message || `Google Play verification failed with status ${response.status}.`);
  }

  const lineItems = Array.isArray(payload.lineItems) ? payload.lineItems : [];
  const matchingItem = lineItems.find((item: any) => item?.productId === input.productId);
  if (!matchingItem?.expiryTime) throw new Error('Google Play response does not contain the expected subscription item.');
  const activeUntil = new Date(matchingItem.expiryTime);
  if (!Number.isFinite(activeUntil.getTime()) || activeUntil.getTime() <= Date.now()) {
    throw new Error('Google Play subscription is expired.');
  }

  const state = String(payload.subscriptionState || '');
  const allowedStates = new Set([
    'SUBSCRIPTION_STATE_ACTIVE',
    'SUBSCRIPTION_STATE_IN_GRACE_PERIOD',
    'SUBSCRIPTION_STATE_CANCELED',
  ]);
  if (!allowedStates.has(state)) throw new Error(`Google Play subscription is not entitled: ${state || 'unknown state'}.`);

  if (payload.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING') {
    await acknowledgeGoogleSubscription({
      packageName: input.packageName,
      productId: input.productId,
      purchaseToken: input.purchaseToken,
      accessToken,
    });
  }

  return {
    provider: 'google_play',
    planId,
    productId: input.productId,
    packageName: input.packageName,
    orderId: matchingItem.latestSuccessfulOrderId || input.orderId || null,
    activeUntil,
    autoRenewing: Boolean(matchingItem.autoRenewingPlan?.autoRenewEnabled),
    status: state === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD'
      ? 'grace_period'
      : state === 'SUBSCRIPTION_STATE_CANCELED'
        ? 'cancelled_active'
        : 'active',
    rawState: state,
  };
}

async function verifyNormalizedIranianStore(
  provider: 'cafebazaar' | 'myket',
  input: PurchaseVerificationInput,
): Promise<VerifiedPurchase> {
  const prefix = provider === 'cafebazaar' ? 'CAFEBAZAAR' : 'MYKET';
  const verifierUrl = process.env[`${prefix}_VERIFIER_URL`];
  const verifierToken = process.env[`${prefix}_VERIFIER_TOKEN`];
  const configuredPackage = process.env[`${prefix}_PACKAGE_NAME`];
  if (!verifierUrl || !verifierToken || !configuredPackage) {
    throw new Error(`${provider} server verification is not configured.`);
  }
  if (input.packageName !== configuredPackage) {
    throw new Error(`${provider} package name does not match this application.`);
  }
  const planId = getPlanForProduct(provider, input.productId);
  const response = await fetch(verifierUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${verifierToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
    cache: 'no-store',
  });
  const payload = await response.json().catch(() => null) as {
    valid?: boolean;
    productId?: string;
    packageName?: string;
    expiresAt?: string;
    autoRenewing?: boolean;
    status?: string;
    orderId?: string;
    error?: string;
  } | null;
  if (!response.ok || !payload?.valid) throw new Error(payload?.error || `${provider} purchase verification failed.`);
  if (payload.productId !== input.productId || payload.packageName !== input.packageName) {
    throw new Error(`${provider} verifier returned mismatched purchase data.`);
  }
  const activeUntil = new Date(payload.expiresAt || '');
  if (!Number.isFinite(activeUntil.getTime()) || activeUntil.getTime() <= Date.now()) {
    throw new Error(`${provider} subscription is expired.`);
  }
  return {
    provider,
    planId,
    productId: input.productId,
    packageName: input.packageName,
    orderId: payload.orderId || input.orderId || null,
    activeUntil,
    autoRenewing: Boolean(payload.autoRenewing),
    status: payload.status === 'grace_period' ? 'grace_period' : payload.status === 'cancelled_active' ? 'cancelled_active' : 'active',
    rawState: payload.status || 'active',
  };
}

export async function verifyStorePurchase(input: PurchaseVerificationInput) {
  if (input.provider === 'google_play') return verifyGooglePlay(input);
  return verifyNormalizedIranianStore(input.provider, input);
}

export function purchaseTokenHash(provider: StoreProvider, purchaseToken: string) {
  return createHash('sha256').update(`${provider}:${purchaseToken}`).digest('hex');
}

export function encryptPurchaseToken(purchaseToken: string) {
  const configuredKey = process.env.BILLING_TOKEN_ENCRYPTION_KEY;
  if (!configuredKey) throw new Error('BILLING_TOKEN_ENCRYPTION_KEY is not configured.');
  const key = Buffer.from(configuredKey, 'base64');
  if (key.length !== 32) throw new Error('BILLING_TOKEN_ENCRYPTION_KEY must be a 32-byte base64 key.');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(purchaseToken, 'utf8'), cipher.final()]);
  return {
    ciphertext: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    version: 1,
  };
}
