import React, { useEffect, useState } from 'react';
import SplashScreen from '@/components/splash-screen';
import OnboardingScreen from './index';
import { useCashierSession } from '@/context/cashier-session';

export default function SplashOrOnboarding() {
  const { hydrated } = useCashierSession();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Show splash for at least 1.5s, then show onboarding
    const timer = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }
  return <OnboardingScreen />;
}
