import "react-native-gesture-handler";
import React, { useEffect } from 'react';
import RootNavigator from "./src/navigation/RootNavigator";
import { QueryProvider } from "./src/providers/QueryProvider";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './src/stores/auth';
import { useSocket } from './src/hooks/useSocket';
import { useCustomerStore } from './src/stores/customer';
import { useLocationStore } from './src/stores/location';

const queryClient = new QueryClient();

function AppContent() {
  const { hydrate } = useAuthStore();
  const { initializeNotifications } = useCustomerStore();
  const { checkLocationStatus, requestLocationPermission } = useLocationStore();
  
  // Initialize socket at app level - persists across navigation
  useSocket();

  useEffect(() => {
    // Hydrate auth store and initialize notifications
    hydrate();
    initializeNotifications();
    
    // 🚀 ENHANCED: Auto-request location permission on app start
    initializeLocation();
  }, [hydrate, initializeNotifications]);

  // 🚀 ENHANCED: Auto-request location permission
  const initializeLocation = async () => {
    try {
      console.log('📍 Auto-initializing location...');
      
      // Check location status first
      await checkLocationStatus();
      
      // Get current state after checking
      const { isLocationEnabled, isLocationPermissionGranted } = useLocationStore.getState();
      
      // If location services are enabled but permission not granted, request it
      if (isLocationEnabled && !isLocationPermissionGranted) {
        console.log('📍 Auto-requesting location permission...');
        await requestLocationPermission();
      }
      
      console.log('✅ Location auto-initialization complete');
    } catch (error) {
      console.error('❌ Location auto-initialization failed:', error);
    }
  };

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