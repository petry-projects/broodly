import NetInfo from '@react-native-community/netinfo';
import { useConnectivityStore } from '../../store/connectivity-store';

/**
 * Subscribes to NetInfo connectivity changes and syncs
 * to the Zustand connectivity store.
 *
 * Returns an unsubscribe function for cleanup.
 */
export function startConnectivityListener(): () => void {
  const unsubscribe = NetInfo.addEventListener((state) => {
    const store = useConnectivityStore.getState();
    if (state.isConnected) {
      store.setOnline();
    } else {
      store.setOffline();
    }
  });

  return unsubscribe;
}
