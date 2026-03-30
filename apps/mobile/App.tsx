// Fallback entry for expo/AppEntry.js (pnpm .pnpm store resolution).
// Renders the Expo Router app directly as a React component.
import React from 'react';
import { ctx } from 'expo-router/_ctx';
import { ExpoRoot } from 'expo-router/build/ExpoRoot';

export default function App() {
  return <ExpoRoot context={ctx} />;
}
