import "react-native-gesture-handler";
import RootNavigator from "./src/navigation/RootNavigator";
import { QueryProvider } from "./src/providers/QueryProvider";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './src/stores/auth';
// import { useSocket } from './src/hooks/useSocket';
import React from 'react';
import { useLocationMonitor } from './src/hooks/useLocationMonitor';

const queryClient = new QueryClient();

function AppContent() {
  const { hydrate } = useAuthStore();
  
  // Initialize socket at app level - persists across navigation
  // useSocket();

  useEffect(() => {
    hydrate();
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
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <QueryProvider>
          <AppContent />
        </QueryProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}