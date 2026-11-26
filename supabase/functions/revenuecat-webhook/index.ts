// RevenueCat -> Supabase: keeps public.subscribers.plus_until in sync with the "plus" entitlement.
// Deployed with verify_jwt = false; RevenueCat authenticates with the shared secret
// REVENUECAT_WEBHOOK_AUTH, sent as the Authorization header (set in the RevenueCat webhook settings).
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const SECRET = Deno.env.get('REVENUECAT_WEBHOOK_AUTH') ?? '';
const ENTITLEMENT = 'plus';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Events that grant or extend access until expiration_at_ms.
const GRANT = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION', 'NON_RENEWING_PURCHASE']);

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });
  if (!SECRET || !timingSafeEqual(req.headers.get('Authorization') ?? '', SECRET)) {
    return new Response('unauthorized', { status: 401 });
  }

  const payload = await req.json().catch(() => null);
  const event = payload?.event;
  if (!event?.type) return new Response('bad request', { status: 400 });

  const entitlements: string[] = event.entitlement_ids ?? (event.entitlement_id ? [event.entitlement_id] : []);
  const userId: string = event.app_user_id;
  if (!entitlements.includes(ENTITLEMENT) || !UUID.test(userId ?? '')) {
    return new Response('ignored', { status: 200 });
  }

  let plusUntil: string | null | undefined;
  if (GRANT.has(event.type)) {
    // Lifetime purchases have no expiration.
    plusUntil = event.expiration_at_ms ? new Date(event.expiration_at_ms).toISOString() : '9999-12-31T00:00:00Z';
  } else if (event.type === 'EXPIRATION') {
    plusUntil = new Date().toISOString();
  } else {
    // CANCELLATION, BILLING_ISSUE, etc.: access continues until EXPIRATION arrives.
    return new Response('ok', { status: 200 });
  }

  const { error } = await admin.from('subscribers').upsert({ user_id: userId, plus_until: plusUntil });
  if (error) {
    console.error(error);
    return new Response('db error', { status: 500 });
  }
  return new Response('ok', { status: 200 });
});
