import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useCashierSession, useCashierTheme } from "@/context/cashier-session";

function FeatureChip({
  label,
  theme,
}: Readonly<{
  label: string;
  theme: ReturnType<typeof useCashierTheme>;
}>) {
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={[styles.chipDot, { backgroundColor: theme.secondary }]} />
      <Text style={[styles.chipText, { color: theme.text }]}>{label}</Text>
    </View>
  );
}

export default function OnboardingScreen() {
  const theme = useCashierTheme();
  const { hydrated, session } = useCashierSession();
  const insets = useSafeAreaInsets();
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(withTiming(1, { duration: 5000 }), -1, true);
  }, [float]);

  useEffect(() => {
    if (hydrated && session) {
      router.replace("/cashier");
    }
  }, [hydrated, session]);

  const bobStyle = useAnimatedStyle(() => {
    const offset = interpolate(float.value, [0, 1], [0, 18]);

    return {
      transform: [{ translateY: offset }],
    };
  });

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + 16, backgroundColor: '#222' },
      ]}
    >
      {/* Decorative orbs removed for a cleaner, dark look */}

      <Animated.View
        entering={FadeInDown.duration(700)}
        style={styles.heroCard}
      >
        <View
          style={[
            styles.badge,
            { backgroundColor: '#393939', borderColor: '#444' },
          ]}
        >
          <Text style={[styles.badgeText, { color: '#fff' }]}>Cashier mode</Text>
        </View>

        <Text style={[styles.title, { color: '#fff' }]}> 
          Scan, verify, and hand over with confidence.
        </Text>
        <Text style={[styles.subtitle, { color: '#ccc' }]}> 
          A focused cashier experience with QR scanning, pickup code lookup,
          item review, and a one-tap verified handoff.
        </Text>

        {/* Feature chips removed as requested */}

        <Animated.View
          entering={FadeInUp.delay(150).duration(700)}
          style={styles.actionGroup}
        >
          <Pressable
            onPress={() => router.push("/login")}
            style={({ pressed }) => [
              styles.primaryButton,
              {
                backgroundColor: pressed ? '#393939' : '#111',
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <Text style={[styles.primaryButtonText, { color: '#fff' }]}> 
              Log in
            </Text>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  orb: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 999,
    opacity: 0.7,
  },
  heroCard: {
    borderRadius: 32,
    padding: 24,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    gap: 20,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
  },
  actionGroup: {
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
  },
});
