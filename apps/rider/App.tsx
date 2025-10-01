import "react-native-gesture-handler";
import RootNavigator from "./src/navigation/RootNavigator";
import { QueryProvider } from "./src/providers/QueryProvider";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './src/stores/auth';
import { SocketProvider } from './src/contexts/SocketContext';
import React from 'react';
import { useLocationMonitor } from './src/hooks/useLocationMonitor';
import { useRiderStore } from "./src/stores/rider";
// 🚀 NEW: Import auto-logout setup
import { setAutoLogoutCallback } from './src/services/api';

const queryClient = new QueryClient();

function AppContent() {
  const { hydrate, autoLogout } = useAuthStore();
  const { initializeNotifications } = useRiderStore();

  useEffect(() => {
    hydrate();
    initializeNotifications();
    
    // 🚀 NEW: Set up auto-logout callback
    setAutoLogoutCallback(() => {
      console.log('🔄 Auto-logout callback triggered');
      autoLogout();
    });
  }, [hydrate, autoLogout, initializeNotifications]);

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
          <SocketProvider>
            <AppContent />
          </SocketProvider>
        </QueryProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}