import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useLocationStore } from '../stores/location';
import * as Location from 'expo-location';

export const useLocationMonitor = () => {
    const { 
        checkLocationStatus, 
        startLocationMonitoring, 
        stopLocationMonitoring,
        isMonitoring 
    } = useLocationStore();

    useEffect(() => {
        // Start monitoring when hook is mounted
        startLocationMonitoring();

        // Monitor app state changes
        const handleAppStateChange = async (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                // App became active, check location status (local only)
                await checkLocationStatus();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppStateChange);

        // Cleanup
        return () => {
            subscription?.remove();
            stopLocationMonitoring();
        };
    }, [startLocationMonitoring, stopLocationMonitoring, checkLocationStatus]);

    return { isMonitoring };
};