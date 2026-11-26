import { AlertButton } from 'react-native';
import { LimitReachedError, friendlyError } from '../services/claudeService';
import { purchasesAvailable, showPaywall } from '../services/subscriptions';
import { showAlert } from './alert';

/**
 * Shows an error. For the free daily limit, also offers Tutorly Plus where purchases
 * work and calls onUpgraded after a purchase so the caller can retry.
 */
export function showErrorOrPaywall(title: string, err: unknown, onUpgraded?: () => void): void {
  if (!(err instanceof LimitReachedError)) {
    showAlert(title, friendlyError(err));
    return;
  }
  const buttons: AlertButton[] = [{ text: 'Not now', style: 'cancel' }];
  if (purchasesAvailable()) {
    buttons.push({
      text: 'Get Tutorly Plus',
      onPress: async () => {
        if (await showPaywall().catch(() => false)) {
          // The store confirms to the backend within seconds.
          setTimeout(() => onUpgraded?.(), 2000);
        }
      },
    });
  }
  showAlert(
    'Daily limit reached',
    `${err.message} Tutorly Plus gives you unlimited solutions, quizzes and practice.`,
    buttons,
  );
}
