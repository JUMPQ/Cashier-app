import { CameraView, useCameraPermissions } from "expo-camera";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  ScrollView,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCashierSession, useCashierTheme } from "@/context/cashier-session";
import { ApiError, collectPickupOrder, verifyPickupCode } from "@/lib/api";
import { VerifiedPickup } from "@/lib/types";

function formatMoney(amount?: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(amount ?? 0));
}

function statusLabel(status?: string) {
  if (!status) {
    return "Unknown";
  }

  return status.replaceAll("_", " ");
}

function ActionChip({
  label,
  onPress,
  active = false,
  theme,
}: Readonly<{
  label: string;
  onPress: () => void;
  active?: boolean;
  theme: ReturnType<typeof useCashierTheme>;
}>) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? theme.primarySoft : theme.surface,
          borderColor: active ? theme.primary : theme.border,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: theme.text }]}>{label}</Text>
    </Pressable>
  );
}

function ItemRow({
  name,
  quantity,
  theme,
}: Readonly<{
  name: string;
  quantity: number;
  theme: ReturnType<typeof useCashierTheme>;
}>) {
  return (
    <View
      style={[
        styles.itemRow,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
      ]}
    >
      <View style={styles.itemLeft}>
        <View
          style={[styles.itemBullet, { backgroundColor: theme.secondary }]}
        />
        <Text style={[styles.itemName, { color: theme.text }]}>{name}</Text>
      </View>
      <Text style={[styles.itemQuantity, { color: theme.primary }]}>
        {quantity}×
      </Text>
    </View>
  );
}

export default function CashierDashboardScreen() {
  const theme = useCashierTheme();
  const { hydrated, session, logout } = useCashierSession();
  const insets = useSafeAreaInsets();
  const [pickupCode, setPickupCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifiedPickup, setVerifiedPickup] = useState<VerifiedPickup | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const scanLockRef = useRef(false);

  useEffect(() => {
    if (hydrated && !session) {
      router.replace("/login");
    }
  }, [hydrated, session]);

  const badgeMessage = useMemo(() => {
    if (message) {
      return message;
    }

    if (verifiedPickup) {
      return `Ready to mark ${verifiedPickup.code} as verified.`;
    }

    return "Scan a QR code or type a pickup code to check the item list.";
  }, [message, verifiedPickup]);

  const openScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Camera permission needed",
          "Allow camera access to scan pickup QR codes.",
        );
        return;
      }
    }

    setCameraVisible(true);
  };

  const runVerification = async (code: string) => {
    if (!session) {
      return;
    }

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      setMessage("Enter or scan a pickup code first.");
      return;
    }

    setBusy(true);
    setMessage(null);

    try {
      const response = await verifyPickupCode(session.token, trimmedCode);
      setPickupCode(trimmedCode);
      setVerifiedPickup(response.data);
      setMessage(
        response.message ?? "Pickup verified. Review the items below.",
      );
      console.log("Verified pickup:", response.data);
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof ApiError
          ? caughtError.message
          : "Could not verify that pickup.";
      setVerifiedPickup(null);
      setMessage(errorMessage);
    } finally {
      setBusy(false);
    }
  };

  const handleScan = (data: string) => {
    if (scanLockRef.current) {
      return;
    }

    scanLockRef.current = true;
    setCameraVisible(false);
    setPickupCode(data);
    void runVerification(data).finally(() => {
      setTimeout(() => {
        scanLockRef.current = false;
      }, 1200);
    });
  };

  const handleMarkVerified = async () => {
    if (!session || !verifiedPickup) {
      return;
    }

    setVerifying(true);
    setMessage(null);

    try {
      const response = await collectPickupOrder(
        session.token,
        verifiedPickup.code,
      );
      setMessage(`Pickup ${response.data.code} marked verified and collected.`);
      setVerifiedPickup(null);
      setPickupCode("");
    } catch (caughtError) {
      const errorMessage =
        caughtError instanceof ApiError
          ? caughtError.message
          : "Could not mark the pickup verified.";
      setMessage(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (!hydrated || !session) {
    return null;
  }

  return (
    <LinearGradient
      colors={[theme.background, theme.primarySoft, theme.secondarySoft]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.backdrop} pointerEvents="none" />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          entering={FadeInDown.duration(650)}
          style={styles.headerCard}
        >
          <View style={styles.headerTopRow}>
            <View>
              <Text style={[styles.kicker, { color: theme.primary }]}>
                Welcome back
              </Text>
              <Text style={[styles.title, { color: theme.text }]}>
                {session.cashier.name}
              </Text>
              <Text style={[styles.subtitle, { color: theme.muted }]}>
                {session.store.store_name} · {session.store.store_code}
              </Text>
            </View>

            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [
                styles.logoutButton,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Text style={[styles.logoutButtonText, { color: theme.text }]}>
                Logout
              </Text>
            </Pressable>
          </View>

          <View
            style={[
              styles.statusBanner,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.statusText, { color: theme.text }]}>
              {badgeMessage}
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(100).duration(650)}
          style={styles.mainCard}
        >
          <View style={styles.chipRow}>
            <ActionChip
              label={cameraVisible ? "Scanner open" : "Scan QR"}
              onPress={() => void openScanner()}
              active={cameraVisible}
              theme={theme}
            />
            <ActionChip
              label="Clear"
              onPress={() => {
                setPickupCode("");
                setVerifiedPickup(null);
                setMessage(null);
              }}
              theme={theme}
            />
            <ActionChip
              label="Verified queue"
              onPress={() =>
                setMessage(
                  "Keep scanning and verify each completed pickup one by one.",
                )
              }
              theme={theme}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.fieldLabel, { color: theme.muted }]}>
              Pickup code
            </Text>
            <View
              style={[
                styles.codeInputRow,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <TextInput
                value={pickupCode}
                onChangeText={setPickupCode}
                placeholder="PICK-ABCD1234"
                placeholderTextColor={theme.muted}
                autoCapitalize="characters"
                style={[styles.codeInput, { color: theme.text }]}
              />
              <Pressable
                onPress={() => void runVerification(pickupCode)}
                disabled={busy}
                style={({ pressed }) => [
                  styles.lookupButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: busy || pressed ? 0.9 : 1,
                  },
                ]}
              >
                {busy ? (
                  <ActivityIndicator color={theme.contrastOnPrimary} />
                ) : (
                  <Text
                    style={[
                      styles.lookupButtonText,
                      { color: theme.contrastOnPrimary },
                    ]}
                  >
                    Verify
                  </Text>
                )}
              </Pressable>
            </View>
          </View>

          {message ? (
            <View
              style={[
                styles.messageBox,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.border,
                },
              ]}
            >
              <Text style={[styles.messageText, { color: theme.text }]}>
                {message}
              </Text>
            </View>
          ) : null}

          {verifiedPickup ? (
            <Animated.View
              entering={FadeInDown.duration(400)}
              style={styles.resultCard}
            >
              <View style={styles.resultTopRow}>
                <View>
                  <Text style={[styles.resultLabel, { color: theme.muted }]}>
                    Pickup
                  </Text>
                  <Text style={[styles.resultCode, { color: theme.text }]}>
                    {verifiedPickup.code}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: theme.primarySoft },
                  ]}
                >
                  <Text style={[styles.statusPillText, { color: theme.primary }]}>
                    {statusLabel(verifiedPickup.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.summaryRow}>
                <View
                  style={[
                    styles.summaryCard,
                    { backgroundColor: theme.surfaceAlt },
                  ]}
                >
                  <Text style={[styles.summaryValue, { color: theme.text }]}>
                    {verifiedPickup.totalItems ?? 0}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: theme.muted }]}>
                    items
                  </Text>
                </View>
                <View
                  style={[
                    styles.summaryCard,
                    { backgroundColor: theme.surfaceAlt },
                  ]}
                >
                  <Text style={[styles.summaryValue, { color: theme.text }]}>
                    {formatMoney(verifiedPickup.totalAmount)}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: theme.muted }]}>
                    total
                  </Text>
                </View>
              </View>

              <View style={styles.customerBlock}>
                <Text style={[styles.customerTitle, { color: theme.text }]}>
                  Customer
                </Text>
                <Text style={[styles.customerText, { color: theme.muted }]}>
                  {verifiedPickup.customerName || "Unknown customer"}
                </Text>
                {verifiedPickup.customerPhone ? (
                  <Text style={[styles.customerText, { color: theme.muted }]}>
                    {verifiedPickup.customerPhone}
                  </Text>
                ) : null}
              </View>

              <View style={styles.itemListHeader}>
                <Text style={[styles.customerTitle, { color: theme.text }]}>
                  Items to hand over
                </Text>
                <Text style={[styles.customerText, { color: theme.muted }]}>
                  {verifiedPickup.items.length} line item(s)
                </Text>
              </View>

              <View style={styles.itemList}>
                {verifiedPickup.items.map((item, index) => (
                  <View key={`${item.name}-${index}`} style={styles.itemRowWrap}>
                    <ItemRow
                      name={item.name}
                      quantity={item.quantity}
                      theme={theme}
                    />
                  </View>
                ))}
              </View>

              <Pressable
                onPress={() => void handleMarkVerified()}
                disabled={verifying}
                style={({ pressed }) => [
                  styles.verifyButton,
                  {
                    backgroundColor: theme.secondary,
                    opacity: pressed || verifying ? 0.92 : 1,
                  },
                ]}
              >
                {verifying ? (
                  <ActivityIndicator color={theme.contrastOnSecondary} />
                ) : (
                  <Text
                    style={[
                      styles.verifyButtonText,
                      { color: theme.contrastOnSecondary },
                    ]}
                  >
                    Mark verified
                  </Text>
                )}
              </Pressable>
            </Animated.View>
          ) : null}

          <View
            style={[
              styles.footerNote,
              {
                borderColor: theme.border,
                backgroundColor: theme.surface,
              },
            ]}
          >
            <Text style={[styles.footerText, { color: theme.muted }]}>
              Use the camera scanner or type the code manually. Once items match,
              tap{" "}
              <Text style={{ color: theme.primary, fontWeight: "800" }}>
                Mark verified
              </Text>{" "}
              to finish the handoff.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={cameraVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setCameraVisible(false)}
      >
        <View style={[styles.scannerModal, { backgroundColor: theme.overlay }]}>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
            onBarcodeScanned={(event) => {
              if (!event.data) {
                return;
              }

              handleScan(event.data);
            }}
          />

          <View style={styles.scannerOverlay} pointerEvents="none" />

          <View style={styles.scannerHeader}>
            <Pressable
              onPress={() => setCameraVisible(false)}
              style={styles.scannerCloseButton}
            >
              <Text style={styles.scannerCloseText}>Close</Text>
            </Pressable>
            <Text style={styles.scannerTitle}>Scan pickup QR</Text>
            <Text style={styles.scannerSubtitle}>
              Hold the code inside the frame and the app will fetch the items
              instantly.
            </Text>
          </View>

          <View style={styles.frameWrapper}>
            <View
              style={[
                styles.frameCorner,
                styles.frameTopLeft,
                { borderColor: theme.secondary },
              ]}
            />
            <View
              style={[
                styles.frameCorner,
                styles.frameTopRight,
                { borderColor: theme.secondary },
              ]}
            />
            <View
              style={[
                styles.frameCorner,
                styles.frameBottomLeft,
                { borderColor: theme.secondary },
              ]}
            />
            <View
              style={[
                styles.frameCorner,
                styles.frameBottomRight,
                { borderColor: theme.secondary },
              ]}
            />
          </View>

          <View style={styles.scannerFooter}>
            <Text style={styles.scannerFooterText}>
              If scanning is unavailable, use the manual code box on the
              previous screen.
            </Text>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(255,255,255,0.34)",
  },
  headerCard: {
    borderRadius: 28,
    padding: 20,
    gap: 14,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  kicker: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
  },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  logoutButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
  statusBanner: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  statusText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  mainCard: {
    marginTop: 14,
    borderRadius: 28,
    padding: 18,
    gap: 18,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "700",
  },
  inputGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
  },
  codeInputRow: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  codeInput: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    letterSpacing: 0.8,
  },
  lookupButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    minWidth: 92,
    alignItems: "center",
    justifyContent: "center",
  },
  lookupButtonText: {
    fontSize: 14,
    fontWeight: "800",
  },
  messageBox: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  resultCard: {
    gap: 16,
    borderRadius: 24,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.86)",
  },
  resultTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  resultCode: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },
  statusPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  summaryValue: {
    fontSize: 17,
    fontWeight: "800",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  customerBlock: {
    gap: 4,
  },
  customerTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  customerText: {
    fontSize: 14,
    lineHeight: 20,
  },
  itemListHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    alignItems: "center",
  },
  itemList: {
    gap: 10,
  },
  itemRowWrap: {
    width: "100%",
  },
  itemRow: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  itemBullet: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: "800",
  },
  verifyButton: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: "center",
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: "800",
  },
  footerNote: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },
  footerText: {
    fontSize: 13,
    lineHeight: 19,
  },
  scannerModal: {
    flex: 1,
    justifyContent: "space-between",
    padding: 24,
  },
  scannerOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(2, 6, 23, 0.28)",
  },
  scannerHeader: {
    zIndex: 2,
    gap: 8,
  },
  scannerCloseButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  scannerCloseText: {
    color: "#0f172a",
    fontWeight: "800",
  },
  scannerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
  },
  scannerSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 300,
  },
  frameWrapper: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 320,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  frameCorner: {
    position: "absolute",
    width: 56,
    height: 56,
    borderWidth: 4,
  },
  frameTopLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 18,
  },
  frameTopRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 18,
  },
  frameBottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 18,
  },
  frameBottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 18,
  },
  scannerFooter: {
    zIndex: 2,
    alignItems: "center",
  },
  scannerFooterText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 320,
  },
});
