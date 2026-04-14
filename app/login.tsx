import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

import { useCashierSession, useCashierTheme } from "@/context/cashier-session";
import { ApiError, fetchPublicStore, loginCashier } from "@/lib/api";
import { createCashierPalette } from "@/lib/colors";
import { CashierSession } from "@/lib/types";

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize = "none",
  theme,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "number-pad" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  theme: ReturnType<typeof useCashierTheme>;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: theme.muted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.muted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[
          styles.field,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            color: theme.text,
          },
        ]}
      />
    </View>
  );
}

export default function LoginScreen() {
  const theme = useCashierTheme();
  const { hydrated, session, login } = useCashierSession();
  const [storeCode, setStoreCode] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && session) {
      router.replace("/cashier");
    }
  }, [hydrated, session]);

  const softTheme = useMemo(
    () => createCashierPalette(theme.primary, theme.secondary, "light"),
    [theme.primary, theme.secondary],
  );

  const handleSubmit = async () => {
    const trimmedStoreCode = storeCode.trim();
    const trimmedUsername = username.trim();
    const trimmedPin = pin.trim();

    if (!trimmedStoreCode || !trimmedUsername || trimmedPin.length < 4) {
      setError("Please fill in your store code, username, and 4-digit PIN.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const authResponse = await loginCashier({
        username: trimmedUsername,
        pin: trimmedPin,
        storeCode: trimmedStoreCode,
      });

      let resolvedSession: CashierSession = authResponse.data;

      try {
        const storeResponse = await fetchPublicStore(trimmedStoreCode);
        const store = storeResponse.data.store;
        resolvedSession = {
          ...resolvedSession,
          store: {
            ...resolvedSession.store,
            ...store,
            primary_color:
              store.primary_color || resolvedSession.store.primary_color,
            secondary_color:
              store.secondary_color || resolvedSession.store.secondary_color,
          },
        };
      } catch {
        // Fall back to the cashier login payload if the public store lookup is unavailable.
      }

      await login(resolvedSession);
      router.replace("/cashier");
    } catch (caughtError) {
      console.error("Login error:", caughtError); // Add this
      const message =
        caughtError instanceof ApiError
          ? caughtError.message
          : "Unable to log in right now.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <LinearGradient
      colors={[softTheme.background, theme.primarySoft, theme.secondarySoft]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            entering={FadeInDown.duration(600)}
            style={styles.headerCard}
          >
            <Text style={[styles.kicker, { color: theme.primary }]}>
              JumpQ cashier portal
            </Text>
            <Text style={[styles.title, { color: theme.text }]}>
              Sign in to start verifying pickups.
            </Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              Use the store code, your cashier username, and PIN to unlock the
              scanner dashboard.
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(100).duration(600)}
            style={styles.formCard}
          >
            <Field
              label="Store code"
              value={storeCode}
              onChangeText={setStoreCode}
              placeholder="JUMP-STORE01"
              theme={theme}
            />
            <Field
              label="Cashier username"
              value={username}
              onChangeText={setUsername}
              placeholder="sarahj"
              theme={theme}
            />
            <Field
              label="4-digit PIN"
              value={pin}
              onChangeText={(value) =>
                setPin(value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="1234"
              secureTextEntry
              keyboardType="number-pad"
              theme={theme}
            />

            {error ? (
              <View
                style={[
                  styles.errorBox,
                  { backgroundColor: "rgba(239,68,68,0.12)" },
                ]}
              >
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              onPress={handleSubmit}
              disabled={busy}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: theme.primary,
                  opacity: pressed || busy ? 0.9 : 1,
                },
              ]}
            >
              {busy ? (
                <ActivityIndicator color={theme.contrastOnPrimary} />
              ) : (
                <Text
                  style={[
                    styles.primaryButtonText,
                    { color: theme.contrastOnPrimary },
                  ]}
                >
                  Log in
                </Text>
              )}
            </Pressable>

            <Text style={[styles.helperText, { color: theme.muted }]}>
              Tip: if you are testing on a device, make sure your API URL points
              to your computer or LAN address, not only localhost.
            </Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: "center",
    gap: 16,
  },
  headerCard: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    gap: 12,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.1,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  formCard: {
    borderRadius: 28,
    padding: 22,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.42)",
    gap: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  field: {
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  errorBox: {
    borderRadius: 16,
    padding: 12,
  },
  errorText: {
    color: "#b91c1c",
    fontWeight: "700",
  },
  primaryButton: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "800",
  },
  helperText: {
    fontSize: 13,
    lineHeight: 19,
  },
});
