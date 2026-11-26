import { Alert, AlertButton, Platform } from 'react-native';

/**
 * Alert.alert that also works on web, where React Native Web's Alert does nothing.
 * On web: one button -> window.alert; otherwise window.confirm, where OK runs the
 * first non-cancel button and Cancel runs the cancel button.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }
  const text = message ? `${title}\n\n${message}` : title;
  if (!buttons || buttons.length <= 1) {
    window.alert(text);
    buttons?.[0]?.onPress?.();
    return;
  }
  const cancel = buttons.find((b) => b.style === 'cancel');
  const confirm = buttons.find((b) => b !== cancel) ?? buttons[0];
  if (window.confirm(text)) confirm.onPress?.();
  else cancel?.onPress?.();
}
