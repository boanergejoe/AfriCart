import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import Head from "expo-router/head";
import { Pressable, Text, View } from "react-native";

import palette from "@/lib/theme";

export default function NotFoundScreen() {
  return (
    <>
      <Head>
        <title>AfriCart</title>
      </Head>
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          backgroundColor: palette.background.DEFAULT,
        }}
      >
        <Ionicons name="bag-handle-outline" size={40} color={palette.primary.DEFAULT} />
        <Text
          style={{ marginTop: 16, fontSize: 64, fontWeight: "800", color: palette.text.primary }}
        >
          404
        </Text>
        <Text
          style={{ marginTop: 8, fontSize: 22, fontWeight: "700", color: palette.text.primary }}
        >
          Page not found
        </Text>
        <Text
          style={{
            maxWidth: 320,
            marginTop: 8,
            textAlign: "center",
            fontSize: 15,
            lineHeight: 22,
            color: palette.text.secondary,
          }}
        >
          The link may be broken, or the page may have moved.
        </Text>
        <Link href="/" asChild>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to shop"
            style={{
              marginTop: 24,
              borderRadius: 999,
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: palette.primary.dark,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: palette.text.primary }}>
              Back to shop
            </Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}
