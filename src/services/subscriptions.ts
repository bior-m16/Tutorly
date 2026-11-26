import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import Purchases from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { supabase, ensureSession } from './supabase';

/** RevenueCat entitlement that unlocks unlimited solves. Must match the RevenueCat dashboard. */
export const PLUS_ENTITLEMENT = 'plus';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  revenuecatIosKey?: string;
  revenuecatAndroidKey?: string;
};

function apiKey(): string {
  if (Platform.OS === 'ios') return extra.revenuecatIosKey ?? '';
  if (Platform.OS === 'android') return extra.revenuecatAndroidKey ?? '';
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

let configured: Promise<void> | null = null;

/** Configures RevenueCat with the Supabase user id, so the webhook can credit the right account. */
function configure(): Promise<void> {
  if (!configured) {
    configured = (async () => {
      await ensureSession();
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error('sign_in_failed: no user');
      Purchases.configure({ apiKey: apiKey(), appUserID: data.user.id });
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
  const info = await Purchases.getCustomerInfo();
  return PLUS_ENTITLEMENT in info.entitlements.active;
}

/** Shows the RevenueCat paywall. Resolves true if the user bought or restored Plus. */
export async function showPaywall(): Promise<boolean> {
  if (!purchasesAvailable()) return false;
  await configure();
  const result = await RevenueCatUI.presentPaywall({ displayCloseButton: true });
  return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
}
