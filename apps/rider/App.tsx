import "react-native-gesture-handler";
import RootNavigator from "./src/navigation/RootNavigator";
import { QueryProvider } from "./src/providers/QueryProvider";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './src/stores/auth';
import { SocketProvider } from './src/contexts/SocketContext'; // ✅ NEW
import React from 'react';
import { useLocationMonitor } from './src/hooks/useLocationMonitor';
import { useRiderStore } from "./src/stores/rider";

const queryClient = new QueryClient();

function AppContent() {
  const { hydrate } = useAuthStore();
  const { initializeNotifications } = useRiderStore();

  useEffect(() => {
    hydrate();
    initializeNotifications();
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      <RootNavigator />
    </>
  );
}

export default function App() {
  // Initialize location monitoring
  useLocationMonitor();

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <QueryProvider>
          <SocketProvider> {/* ✅ WRAP WITH SOCKET PROVIDER */}
            <AppContent />
          </SocketProvider>
        </QueryProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}