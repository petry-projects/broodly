// Fallback entry for expo/AppEntry.js (pnpm .pnpm store resolution).
// Renders the Expo Router app directly as a React component.
//
// NOTE: This file uses expo-router internal module paths (_ctx, build/ExpoRoot)
// as a pnpm workspace resolution workaround. Tested with
// expo-router@55.0.9-canary-20260328-bdc6273. If upgrading expo-router, check
// whether ctx and ExpoRoot are exported from the public 'expo-router' entry
// and prefer that over internal paths.
import React from 'react';
import { ctx } from 'expo-router/_ctx';
import { ExpoRoot } from 'expo-router/build/ExpoRoot';

export default function App() {
  return <ExpoRoot context={ctx} />;
}
