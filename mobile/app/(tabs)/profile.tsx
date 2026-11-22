import { useAuth, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import SafeScreen from "@/components/SafeScreen";
import palette from "@/lib/theme";

const MENU_ITEMS = [
  {
    id: 1,
    icon: "person-outline",
    title: "Edit Profile",
    color: palette.light.link,
    action: "/profile",
  },
  {
    id: 2,
    icon: "list-outline",
    title: "Orders",
    color: palette.primary.DEFAULT,
    action: "/orders",
  },
  {
    id: 3,
    icon: "location-outline",
    title: "Addresses",
    color: palette.accent.warning,
    action: "/addresses",
  },
  {
    id: 4,
    icon: "heart-outline",
    title: "Wishlist",
    color: palette.accent.danger,
    action: "/wishlist",
  },
] as const;

const ProfileScreen = () => {
  const { signOut } = useAuth();
  const { user } = useUser();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState("");

  const handleMenuPress = (action: (typeof MENU_ITEMS)[number]["action"]) => {
    if (action === "/profile") {
      setFirstName(user?.firstName || "");
      setLastName(user?.lastName || "");
      setProfileSaveError("");
      setShowEditProfile(true);
      return;
    }
    router.push(action);
  };

  const handleSaveProfile = async () => {
    if (!user || !firstName.trim()) {
      setProfileSaveError("Enter your first name before saving.");
      return;
    }

    try {
      setIsSavingProfile(true);
      setProfileSaveError("");
      await user.update({ firstName: firstName.trim(), lastName: lastName.trim() });
      setShowEditProfile(false);
    } catch {
      setProfileSaveError("Your profile could not be updated. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <SafeScreen>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100, alignItems: "center" }}
      >
        <View style={{ width: "100%", maxWidth: palette.layout.compactContent }}>
          <View className="px-6 pb-8 pt-6">
            <View className="bg-surface rounded-3xl p-6">
              <View className="flex-row items-center">
                <View className="relative">
                  <Image
                    source={user?.imageUrl}
                    style={{ width: 80, height: 80, borderRadius: 40 }}
                    transition={200}
                    accessibilityLabel="Your profile photo"
                  />
                  <View className="absolute -bottom-1 -right-1 bg-primary rounded-full size-7 items-center justify-center border-2 border-surface">
                    <Ionicons name="checkmark" size={16} color={palette.onPrimary} />
                  </View>
                </View>

                <View className="flex-1 ml-4">
                  <Text className="text-text-primary text-2xl font-bold mb-1">
                    {user?.firstName} {user?.lastName}
                  </Text>
                  <Text className="text-text-secondary text-sm" numberOfLines={1}>
                    {user?.emailAddresses?.[0]?.emailAddress || "No email"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View className="flex-row flex-wrap gap-2 mx-6 mb-3">
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="bg-surface rounded-2xl p-6 items-center justify-center"
                style={{ width: "48%" }}
                activeOpacity={0.7}
                onPress={() => handleMenuPress(item.action)}
                accessibilityRole="button"
                accessibilityLabel={item.title}
              >
                <View
                  className="rounded-full w-16 h-16 items-center justify-center mb-4"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <Ionicons name={item.icon} size={28} color={item.color} />
                </View>
                <Text className="text-text-primary font-bold text-base">{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="mb-3 mx-6 bg-surface rounded-2xl p-4">
            <TouchableOpacity
              className="flex-row items-center justify-between py-2"
              activeOpacity={0.7}
              onPress={() => router.push("/privacy-security")}
              accessibilityRole="button"
              accessibilityLabel="Notification, privacy, and security settings"
            >
              <View className="flex-row items-center">
                <Ionicons name="notifications-outline" size={22} color={palette.text.primary} />
                <Text className="text-text-primary font-semibold ml-3">Notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={palette.text.tertiary} />
            </TouchableOpacity>
          </View>

          <View className="mb-3 mx-6 bg-surface rounded-2xl p-4">
            <TouchableOpacity
              className="flex-row items-center justify-between py-2"
              activeOpacity={0.7}
              onPress={() => router.push("/privacy-security")}
              accessibilityRole="button"
              accessibilityLabel="Privacy and security settings"
            >
              <View className="flex-row items-center">
                <Ionicons name="shield-checkmark-outline" size={22} color={palette.text.primary} />
                <Text className="text-text-primary font-semibold ml-3">Privacy & Security</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={palette.text.tertiary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="mx-6 mb-3 bg-surface rounded-2xl py-5 flex-row items-center justify-center border-2 border-red-500/20"
            activeOpacity={0.8}
            onPress={() => {
              void signOut();
            }}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Ionicons name="log-out-outline" size={22} color={palette.accent.danger} />
            <Text className="text-red-500 font-bold text-base ml-2">Sign Out</Text>
          </TouchableOpacity>

          <Text className="mx-6 mb-3 text-center text-text-secondary text-xs">Version 1.0.0</Text>
        </View>
      </ScrollView>

      <Modal
        visible={showEditProfile}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditProfile(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: 24,
              backgroundColor: palette.overlay,
            }}
          >
            <View
              style={{
                width: "100%",
                maxWidth: palette.layout.modal,
                maxHeight: "90%",
                padding: 24,
                borderRadius: 24,
                backgroundColor: palette.background.light,
              }}
            >
              <View className="flex-row items-center justify-between mb-5">
                <Text className="text-text-primary text-xl font-bold">Edit Profile</Text>
                <TouchableOpacity
                  onPress={() => setShowEditProfile(false)}
                  disabled={isSavingProfile}
                  accessibilityRole="button"
                  accessibilityLabel="Close profile editor"
                >
                  <Ionicons name="close" size={24} color={palette.text.primary} />
                </TouchableOpacity>
              </View>

              <Text className="text-text-secondary text-sm mb-2">First name</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                placeholder="First name"
                placeholderTextColor={palette.text.tertiary}
                autoCapitalize="words"
                className="text-text-primary rounded-xl px-4 py-3 mb-4"
                style={{ backgroundColor: palette.surface.DEFAULT }}
                accessibilityLabel="First name"
              />
              <Text className="text-text-secondary text-sm mb-2">Last name</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                placeholder="Last name"
                placeholderTextColor={palette.text.tertiary}
                autoCapitalize="words"
                className="text-text-primary rounded-xl px-4 py-3"
                style={{ backgroundColor: palette.surface.DEFAULT }}
                accessibilityLabel="Last name"
              />

              {profileSaveError ? (
                <Text className="text-red-400 text-sm mt-3" accessibilityRole="alert">
                  {profileSaveError}
                </Text>
              ) : null}

              <View className="flex-row justify-end gap-3 mt-6">
                <TouchableOpacity
                  className="rounded-xl px-4 py-3"
                  onPress={() => setShowEditProfile(false)}
                  disabled={isSavingProfile}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel editing profile"
                >
                  <Text className="text-text-secondary font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-primary rounded-xl px-5 py-3"
                  onPress={() => {
                    void handleSaveProfile();
                  }}
                  disabled={isSavingProfile}
                  accessibilityRole="button"
                  accessibilityLabel="Save profile changes"
                  accessibilityState={{ disabled: isSavingProfile }}
                >
                  {isSavingProfile ? (
                    <ActivityIndicator size="small" color={palette.onPrimary} />
                  ) : (
                    <Text className="text-background font-bold">Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeScreen>
  );
};

export default ProfileScreen;
