import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";

import SafeScreen from "@/components/SafeScreen";
import { showMessage as showInfo } from "@/lib/alerts";
import palette from "@/lib/theme";

type SettingIcon = keyof typeof Ionicons.glyphMap;

type SecurityOption = {
  id: string;
  icon: SettingIcon;
  title: string;
  description: string;
  type: "navigation" | "toggle";
  value?: boolean;
};

type AccountOption = {
  id: string;
  icon: SettingIcon;
  title: string;
  description: string;
};

function PrivacyAndSecurityScreen() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(false);
  // Order emails are always sent; the switch is read-only until preferences are built.
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [shareData, setShareData] = useState(false);

  const securitySettings: SecurityOption[] = [
    {
      id: "password",
      icon: "lock-closed-outline",
      title: "Change Password",
      description: "Update your account password",
      type: "navigation",
    },
    {
      id: "two-factor",
      icon: "shield-checkmark-outline",
      title: "Two-Factor Authentication",
      description: "Coming soon — managed in Clerk account settings",
      type: "toggle",
      value: twoFactorEnabled,
    },
    {
      id: "biometric",
      icon: "finger-print-outline",
      title: "Biometric Login",
      description: "Coming soon — device sign-in is not enabled",
      type: "toggle",
      value: biometricEnabled,
    },
  ];

  const privacySettings: SecurityOption[] = [
    {
      id: "push",
      icon: "notifications-outline",
      title: "Push Notifications",
      description: "Coming soon",
      type: "toggle",
      value: pushNotifications,
    },
    {
      id: "email",
      icon: "mail-outline",
      title: "Email Notifications",
      description: "Always on — order emails are sent by AfriCart",
      type: "toggle",
      value: emailNotifications,
    },
    {
      id: "marketing",
      icon: "megaphone-outline",
      title: "Marketing Emails",
      description: "Coming soon",
      type: "toggle",
      value: marketingEmails,
    },
    {
      id: "data",
      icon: "analytics-outline",
      title: "Share Usage Data",
      description: "Coming soon",
      type: "toggle",
      value: shareData,
    },
  ];

  const accountSettings: AccountOption[] = [
    {
      id: "activity",
      icon: "time-outline",
      title: "Account Activity",
      description: "View recent login activity",
    },
    {
      id: "devices",
      icon: "phone-portrait-outline",
      title: "Connected Devices",
      description: "Manage devices with access",
    },
    {
      id: "data-download",
      icon: "download-outline",
      title: "Download Your Data",
      description: "Get a copy of your data",
    },
  ];

  const handleToggle = (id: string, value: boolean) => {
    switch (id) {
      case "two-factor":
        setTwoFactorEnabled(value);
        break;
      case "biometric":
        setBiometricEnabled(value);
        break;
      case "push":
        setPushNotifications(value);
        break;
      case "email":
        setEmailNotifications(value);
        break;
      case "marketing":
        setMarketingEmails(value);
        break;
      case "data":
        setShareData(value);
        break;
    }
  };

  const handleUnavailable = (title: string, description: string) => {
    showInfo("Not available yet", `${title} ${description}`);
  };

  const renderSetting = (setting: SecurityOption) => (
    <View key={setting.id} className="bg-surface rounded-2xl p-4 mb-3">
      <View className="flex-row items-center">
        <View className="bg-primary/20 rounded-full w-12 h-12 items-center justify-center mr-4">
          <Ionicons name={setting.icon} size={24} color={palette.primary.DEFAULT} />
        </View>
        <View className="flex-1">
          <Text className="text-text-primary font-bold text-base mb-1">{setting.title}</Text>
          <Text className="text-text-secondary text-sm">{setting.description}</Text>
        </View>
        {setting.type === "toggle" ? (
          <Switch
            value={setting.value}
            disabled
            onValueChange={(value) => handleToggle(setting.id, value)}
            thumbColor={palette.text.primary}
            trackColor={{ false: palette.surface.DEFAULT, true: palette.primary.DEFAULT }}
            accessibilityLabel={setting.title}
            accessibilityRole="switch"
            accessibilityState={{ checked: setting.value }}
          />
        ) : (
          <TouchableOpacity
            onPress={() =>
              showInfo(
                "Password changes",
                "Use the sign-in method you chose on the sign-in page to manage your account."
              )
            }
            accessibilityRole="button"
            accessibilityLabel={setting.title}
          >
            <Ionicons name="chevron-forward" size={20} color={palette.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeScreen>
      <View
        className="px-6 pb-5 border-b border-surface flex-row items-center"
        style={{ width: "100%", maxWidth: palette.layout.compactContent, alignSelf: "center" }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-4"
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={28} color={palette.text.primary} />
        </TouchableOpacity>
        <Text className="text-text-primary text-2xl font-bold">Privacy & Security</Text>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80, alignItems: "center" }}
      >
        <View style={{ width: "100%", maxWidth: palette.layout.compactContent }}>
          <View className="px-6 pt-6">
            <Text className="text-text-primary text-lg font-bold mb-4">Security</Text>
            {securitySettings.map(renderSetting)}
          </View>

          <View className="px-6 pt-4">
            <Text className="text-text-primary text-lg font-bold mb-4">Privacy</Text>
            {privacySettings.map(renderSetting)}
          </View>

          <View className="px-6 pt-4">
            <Text className="text-text-primary text-lg font-bold mb-4">Account</Text>
            {accountSettings.map((setting) => (
              <TouchableOpacity
                key={setting.id}
                className="bg-surface rounded-2xl p-4 mb-3"
                activeOpacity={0.7}
                onPress={() =>
                  handleUnavailable(
                    setting.title,
                    "is not available in this build. Contact support if you need help."
                  )
                }
                accessibilityRole="button"
                accessibilityLabel={setting.title}
              >
                <View className="flex-row items-center">
                  <View className="bg-primary/20 rounded-full w-12 h-12 items-center justify-center mr-4">
                    <Ionicons name={setting.icon} size={24} color={palette.primary.DEFAULT} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-text-primary font-bold text-base mb-1">
                      {setting.title}
                    </Text>
                    <Text className="text-text-secondary text-sm">{setting.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={palette.text.tertiary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View className="px-6 pt-4">
            <TouchableOpacity
              className="bg-surface rounded-2xl p-5 flex-row items-center justify-between border-2 border-red-500/20"
              activeOpacity={0.7}
              onPress={() =>
                showInfo(
                  "Delete account",
                  "Contact support from the app to permanently remove your account and its data."
                )
              }
              accessibilityRole="button"
              accessibilityLabel="Delete account"
            >
              <View className="flex-row items-center">
                <View className="bg-red-500/20 rounded-full w-12 h-12 items-center justify-center mr-4">
                  <Ionicons name="trash-outline" size={24} color={palette.accent.danger} />
                </View>
                <View>
                  <Text className="text-red-500 font-bold text-base mb-1">Delete Account</Text>
                  <Text className="text-text-secondary text-sm">
                    Permanently delete your account
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={palette.accent.danger} />
            </TouchableOpacity>
          </View>

          <View className="px-6 pt-6 pb-4">
            <View className="bg-primary/10 rounded-2xl p-4 flex-row">
              <Ionicons
                name="information-circle-outline"
                size={24}
                color={palette.primary.DEFAULT}
              />
              <Text className="text-text-secondary text-sm ml-3 flex-1">
                We take your privacy seriously. Your data is encrypted and stored securely. Some
                preferences in this build are shown for reference and are not saved.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeScreen>
  );
}

export default PrivacyAndSecurityScreen;
