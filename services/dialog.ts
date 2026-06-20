import { Alert, Platform } from "react-native";

// React Native's Alert is a no-op on react-native-web, so confirmations and
// notices silently do nothing in the browser. These helpers fall back to the
// browser's native dialogs on web and use Alert everywhere else.

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export function confirmDialog({
  title,
  message,
  confirmLabel = "OK",
  cancelLabel = "Cancel",
  destructive = false
}: ConfirmOptions): Promise<boolean> {
  if (Platform.OS === "web") {
    const accepted =
      typeof window !== "undefined" && window.confirm(message ? `${title}\n\n${message}` : title);
    return Promise.resolve(accepted);
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: "cancel", onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: destructive ? "destructive" : "default",
        onPress: () => resolve(true)
      }
    ]);
  });
}

export function alertDialog(title: string, message?: string) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") {
      window.alert(message ? `${title}\n\n${message}` : title);
    }
    return;
  }
  Alert.alert(title, message);
}
