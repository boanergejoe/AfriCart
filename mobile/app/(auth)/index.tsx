import useSocialAuth from "@/hooks/useSocialAuth";
import { View, Text, Image, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";

const AuthScreen = () => {
  const { loadingStrategy, handleSocialAuth } = useSocialAuth();

  return (
    <ScrollView
      className="flex-1 bg-white"
      style={{ flex: 1, width: "100%", backgroundColor: "#FFFFFF" }}
      contentContainerStyle={{
        width: "100%",
        flexGrow: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 32,
      }}
      showsVerticalScrollIndicator={false}
    >
      <View className="mb-6 items-center" style={{ width: "100%", marginBottom: 24 }}>
        <Text className="text-3xl font-bold text-green-800">AfriCart</Text>
        <Text className="mt-1 text-sm text-gray-500">Your marketplace, made simple.</Text>
      </View>

      {/* DEMO IMAGE */}
      <Image
        source={require("../../assets/images/auth-image.png")}
        className="w-full max-w-80"
        resizeMode="contain"
        style={{ width: "100%", maxWidth: 320, height: 320 }}
      />

      <View
        className="gap-3 mt-4"
        style={{ width: "100%", maxWidth: 360, gap: 12, marginTop: 16 }}
      >
        {/* GOOGLE SIGN IN BTN */}
        <TouchableOpacity
          className="flex-row items-center justify-center bg-white border border-gray-300 rounded-full px-6 py-2"
          onPress={() => handleSocialAuth("oauth_google")}
          disabled={loadingStrategy !== null}
          style={{
            width: "100%",
            minHeight: 54,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FFFFFF",
            borderColor: "#D1D5DB",
            borderWidth: 1,
            borderRadius: 999,
            paddingHorizontal: 24,
            paddingVertical: 10,
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2, // this is for android
          }}
        >
          {loadingStrategy === "oauth_google" ? (
            <ActivityIndicator size={"small"} color={"#4285f4"} />
          ) : (
            <View
              className="flex-row items-center justify-center"
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}
            >
              <Image
                source={require("../../assets/images/google.png")}
                className="size-8 mr-3"
                resizeMode="contain"
                style={{ width: 32, height: 32, marginRight: 12 }}
              />
              <Text
                className="text-black font-medium text-base"
                style={{ color: "#111827", fontWeight: "500", fontSize: 16 }}
              >
                Continue with Google
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* APPLE SIGN IN BTN */}
        <TouchableOpacity
          className="flex-row items-center justify-center bg-white border border-gray-300 rounded-full px-6 py-3"
          onPress={() => handleSocialAuth("oauth_apple")}
          disabled={loadingStrategy !== null}
          style={{
            width: "100%",
            minHeight: 54,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FFFFFF",
            borderColor: "#D1D5DB",
            borderWidth: 1,
            borderRadius: 999,
            paddingHorizontal: 24,
            paddingVertical: 10,
            shadowColor: "#000000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2, // this is for android
          }}
        >
          {loadingStrategy === "oauth_apple" ? (
            <ActivityIndicator size={"small"} color={"#4285f4"} />
          ) : (
            <View
              className="flex-row items-center justify-center"
              style={{ flexDirection: "row", alignItems: "center", justifyContent: "center" }}
            >
              <Image
                source={require("../../assets/images/apple.png")}
                className="size-7 mr-3"
                resizeMode="contain"
                style={{ width: 28, height: 28, marginRight: 12 }}
              />
              <Text
                className="text-black font-medium text-base"
                style={{ color: "#111827", fontWeight: "500", fontSize: 16 }}
              >
                Continue with Apple
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <Text
        className="text-center text-gray-500 text-xs leading-4 mt-6 px-2"
        style={{
          width: "100%",
          maxWidth: 360,
          textAlign: "center",
          color: "#6B7280",
          fontSize: 12,
          lineHeight: 16,
          marginTop: 24,
          paddingHorizontal: 8,
        }}
      >
        By signing up, you agree to our <Text style={{ color: "#3B82F6" }}>Terms</Text>
        {", "}
        <Text style={{ color: "#3B82F6" }}>Privacy Policy</Text>
        {", and "}
        <Text style={{ color: "#3B82F6" }}>Cookie Use</Text>
      </Text>
    </ScrollView>
  );
};

export default AuthScreen;
