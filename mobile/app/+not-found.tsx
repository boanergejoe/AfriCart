import { Link } from "expo-router";
import Head from "expo-router/head";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

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
          backgroundColor: "#111111",
        }}
      >
        <Ionicons name="bag-handle-outline" size={40} color="#20C65A" />
        <Text style={{ marginTop: 16, fontSize: 64, fontWeight: "800", color: "#FFFFFF" }}>
          404
        </Text>
        <Text style={{ marginTop: 8, fontSize: 22, fontWeight: "700", color: "#FFFFFF" }}>
          Page not found
        </Text>
        <Text
          style={{
            maxWidth: 320,
            marginTop: 8,
            textAlign: "center",
            fontSize: 15,
            lineHeight: 22,
            color: "#A3A3A3",
          }}
        >
          The link may be broken, or the page may have moved.
        </Text>
        <Link href="/" asChild>
          <Pressable
            accessibilityRole="button"
            style={{
              marginTop: 24,
              borderRadius: 999,
              paddingHorizontal: 24,
              paddingVertical: 12,
              backgroundColor: "#16A34A",
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF" }}>
              Back to shop
            </Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}
