import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";

import { createCashierPalette } from "@/lib/colors";
import { CashierSession } from "@/lib/types";

const SESSION_STORAGE_KEY = "@jumpq-cashier/session";

type SessionContextValue = {
  hydrated: boolean;
  session: CashierSession | null;
  login: (nextSession: CashierSession) => Promise<void>;
  logout: () => Promise<void>;
};

const CashierSessionContext = createContext<SessionContextValue | undefined>(
  undefined,
);

export function CashierSessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<CashierSession | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(SESSION_STORAGE_KEY)
      .then((stored) => {
        if (!mounted || !stored) {
          return;
        }

        setSession(JSON.parse(stored) as CashierSession);
      })
      .catch(() => {
        // Keep the app resilient if session parsing fails.
      })
      .finally(() => {
        if (mounted) {
          setHydrated(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const login = async (nextSession: CashierSession) => {
    setSession(nextSession);
    await AsyncStorage.setItem(
      SESSION_STORAGE_KEY,
      JSON.stringify(nextSession),
    );
  };

  const logout = async () => {
    setSession(null);
    await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      hydrated,
      session,
      login,
      logout,
    }),
    [hydrated, session],
  );

  return (
    <CashierSessionContext.Provider value={value}>
      {children}
    </CashierSessionContext.Provider>
  );
}

export function useCashierSession() {
  const context = useContext(CashierSessionContext);

  if (!context) {
    throw new Error(
      "useCashierSession must be used within CashierSessionProvider",
    );
  }

  return context;
}

export function useCashierTheme() {
  const { session } = useCashierSession();
  const colorScheme = (useColorScheme() ?? "light") as "light" | "dark";

  return useMemo(
    () =>
      createCashierPalette(
        session?.store.primary_color,
        session?.store.secondary_color,
        colorScheme,
      ),
    [colorScheme, session?.store.primary_color, session?.store.secondary_color],
  );
}
