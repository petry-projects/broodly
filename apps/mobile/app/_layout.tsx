import '../global.css';
import React, { useEffect, useState } from 'react';
import { Slot } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as UrqlProvider } from 'urql';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { GluestackUIProvider } from '../components/ui/gluestack-ui-provider';
import { createGraphQLClient } from '../src/services/graphql/client';
import {
  createQueryClient,
  queryPersister,
} from '../src/services/query/query-client';
import { GraphQLErrorBoundary } from '../src/services/graphql/graphql-error-boundary';
import { OfflineBanner } from '../src/features/connectivity/components/OfflineBanner';
import { startConnectivityListener } from '../src/services/connectivity/connectivity-listener';
import { AuthGuard } from '../src/services/auth/auth-guard';

export default function RootLayout() {
  const [queryClient] = useState(() => createQueryClient());
  const [graphqlClient] = useState(() => createGraphQLClient());

  useEffect(() => {
    const unsubscribe = startConnectivityListener();
    return unsubscribe;
  }, []);

  return (
    <SafeAreaProvider>
      <GluestackUIProvider mode="light">
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: queryPersister }}
        >
          <UrqlProvider value={graphqlClient}>
            <GraphQLErrorBoundary>
              <OfflineBanner />
              <AuthGuard>
                <Slot />
              </AuthGuard>
            </GraphQLErrorBoundary>
          </UrqlProvider>
        </PersistQueryClientProvider>
      </GluestackUIProvider>
    </SafeAreaProvider>
  );
}
