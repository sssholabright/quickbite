import "react-native-gesture-handler";
import RootNavigator from "./src/navigation/RootNavigator";
import { QueryProvider } from "./src/providers/QueryProvider";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './src/stores/auth';
import { useSocket } from './src/hooks/useSocket';
import { useCustomerStore } from './src/stores/customer';

const queryClient = new QueryClient();

function AppContent() {
  const { hydrate } = useAuthStore();
  const { initializeNotifications } = useCustomerStore();
  
  // Initialize socket at app level - persists across navigation
  useSocket();

  useEffect(() => {
    // Hydrate auth store and initialize notifications
    hydrate();
    initializeNotifications();
  }, [hydrate, initializeNotifications]);

  return (
    <>
      <StatusBar style="auto" />
      <RootNavigator />
    </>
  );
}

export default function App() {
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