import { Alert, Platform } from "react-native";

/** Shows a message that works in the browser as well as native apps. */
export const showMessage = (title: string, message: string) => {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`${title}\n\n${message}`);
    return;
  }

  Alert.alert(title, message);
};

interface ConfirmOptions {
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

/** Replaces destructive Alert.alert confirmations with a web-safe promise. */
export const confirmAction = (
  title: string,
  message: string,
  { confirmLabel = "OK", cancelLabel = "Cancel", destructive = false }: ConfirmOptions = {}
) =>
  new Promise<boolean>((resolve) => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      resolve(window.confirm(message));
      return;
    }

    Alert.alert(title, message, [
      { text: cancelLabel, style: "cancel", onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: destructive ? "destructive" : "default",
        onPress: () => resolve(true),
      },
    ]);
  });
