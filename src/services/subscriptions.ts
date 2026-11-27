import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import type PurchasesT from 'react-native-purchases';
import type RevenueCatUIT from 'react-native-purchases-ui';
import { supabase, ensureSession } from './supabase';

/** RevenueCat entitlement that unlocks unlimited solves. Must match the RevenueCat dashboard. */
export const PLUS_ENTITLEMENT = 'plus';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  revenuecatIosKey?: string;
  revenuecatAndroidKey?: string;
};

function apiKey(): string {
  if (Platform.OS === 'ios') return process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || extra.revenuecatIosKey || '';
  if (Platform.OS === 'android') return process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || extra.revenuecatAndroidKey || '';
  return '';
}

/**
 * Store purchases need a native build (EAS / dev client): not web, not Expo Go,
 * and not before the RevenueCat keys are set.
 */
export function purchasesAvailable(): boolean {
  return (
    Platform.OS !== 'web' &&
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
    apiKey() !== ''
  );
}

// Loaded lazily: the native modules throw at import time on web and in Expo Go.
function sdk(): { Purchases: typeof PurchasesT; RevenueCatUI: typeof RevenueCatUIT } {
  return {
    Purchases: require('react-native-purchases').default,
    RevenueCatUI: require('react-native-purchases-ui').default,
  };
}

let configured: Promise<void> | null = null;

/** Configures RevenueCat with the Supabase user id, so the webhook can credit the right account. */
function configure(): Promise<void> {
  if (!configured) {
    configured = (async () => {
      await ensureSession();
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error('sign_in_failed: no user');
      sdk().Purchases.configure({ apiKey: apiKey(), appUserID: data.user.id });
    })().catch((err) => {
      configured = null;
      throw err;
    });
  }
  return configured;
}

export async function hasPlus(): Promise<boolean> {
  if (!purchasesAvailable()) return false;
  await configure();
  const info = await sdk().Purchases.getCustomerInfo();
  return PLUS_ENTITLEMENT in info.entitlements.active;
}

/** Shows the RevenueCat paywall. Resolves true if the user bought or restored Plus. */
export async function showPaywall(): Promise<boolean> {
  if (!purchasesAvailable()) return false;
  await configure();
  const result = await sdk().RevenueCatUI.presentPaywall({ displayCloseButton: true });
  return result === 'PURCHASED' || result === 'RESTORED';
}

export interface Plan {
  id: string;
  /** e.g. "Monthly", "3 months", "Yearly" */
  label: string;
  /** Store price as the store formats it, e.g. "$9.99". */
  price: string;
  /** e.g. "/month" */
  period: string;
  /** Free-trial text from the store, if the plan has one. */
  trial?: string;
}

const PERIOD: Record<string, { label: string; period: string; order: number }> = {
  WEEKLY: { label: 'Weekly', period: '/week', order: 0 },
  MONTHLY: { label: 'Monthly', period: '/month', order: 1 },
  TWO_MONTH: { label: '2 months', period: '/2 months', order: 2 },
  THREE_MONTH: { label: '3 months', period: '/3 months', order: 3 },
  SIX_MONTH: { label: '6 months', period: '/6 months', order: 4 },
  ANNUAL: { label: 'Yearly', period: '/year', order: 5 },
};

let packages: Record<string, unknown> = {};

/** The Plus plans set up in RevenueCat, with real store prices. Empty where purchases are unavailable. */
export async function getPlans(): Promise<Plan[]> {
  if (!purchasesAvailable()) return [];
  await configure();
  const offerings = await sdk().Purchases.getOfferings();
  const list = offerings.current?.availablePackages ?? [];
  packages = {};
  return list
    .map((p) => {
      packages[p.identifier] = p;
      const meta = PERIOD[p.packageType] ?? { label: p.product.title, period: '', order: 9 };
      const intro = p.product.introPrice;
      const trial =
        intro && intro.price === 0 ? `${intro.periodNumberOfUnits}-${intro.periodUnit.toLowerCase()} free trial` : undefined;
      return { id: p.identifier, label: meta.label, price: p.product.priceString, period: meta.period, trial, order: meta.order };
    })
    .sort((a, b) => a.order - b.order)
    .map(({ order, ...plan }) => plan);
}

/** Buys a plan from getPlans(). Resolves true when Plus is active, false if the user cancelled. */
export async function buyPlan(id: string): Promise<boolean> {
  const pkg = packages[id];
  if (!pkg) throw new Error('That plan is no longer available. Please reopen this page.');
  try {
    const { customerInfo } = await sdk().Purchases.purchasePackage(pkg as never);
    return PLUS_ENTITLEMENT in customerInfo.entitlements.active;
  } catch (err: any) {
    if (err?.userCancelled) return false;
    throw err;
  }
}

/** Restores an earlier purchase on this store account. Resolves true if Plus is active afterwards. */
export async function restorePlus(): Promise<boolean> {
  if (!purchasesAvailable()) return false;
  await configure();
  const info = await sdk().Purchases.restorePurchases();
  return PLUS_ENTITLEMENT in info.entitlements.active;
}
