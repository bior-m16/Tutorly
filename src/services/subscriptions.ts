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
