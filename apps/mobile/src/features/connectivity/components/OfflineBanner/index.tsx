import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../../../../components/ui/text';
import { useConnectivityStore } from '../../../../store/connectivity-store';

/**
 * Global offline indicator banner.
 * Renders a Sky Blue info banner when the device is offline.
 * Placed in root layout for global visibility.
 */
export function OfflineBanner() {
  const isOnline = useConnectivityStore((s) => s.isOnline);

  if (isOnline) return null;

  return (
    <View
      className="flex-row items-center bg-info-500 px-4 py-3 gap-2"
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      accessibilityLabel="You are offline. Showing cached data."
    >
      <Ionicons name="cloud-offline-outline" size={20} color="#FFFFFF" />
      <Text size="sm" className="text-background-0 font-medium">
        You are offline. Showing cached data.
      </Text>
    </View>
  );
}
