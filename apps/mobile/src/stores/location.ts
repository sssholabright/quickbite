import { create } from 'zustand';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

interface LocationState {
    isLocationEnabled: boolean;
    isLocationPermissionGranted: boolean;
    currentLocation: {
        latitude: number;
        longitude: number;
    } | null;
    isLoading: boolean;
    error: string | null;
    isMonitoring: boolean;
    
    // Actions
    checkLocationStatus: () => Promise<void>;
    updateLocation: (shouldSendToBackend?: boolean) => Promise<void>;
    setLocationEnabled: (enabled: boolean) => void;
    setLocationPermission: (granted: boolean) => void;
    setCurrentLocation: (lat: number, lng: number) => void;
    clearLocation: () => void;
    startLocationMonitoring: () => void;
    stopLocationMonitoring: () => void;
    requestLocationPermission: () => Promise<boolean>;
    
    // Computed value
    isLocationReady: boolean;
}

export const useLocationStore = create<LocationState>((set, get) => ({
    isLocationEnabled: false,
    isLocationPermissionGranted: false,
    currentLocation: null,
    isLoading: false,
    error: null,
    isMonitoring: false,
    
    // Computed value
    get isLocationReady() {
        const state = get();
        return state.isLocationEnabled && 
               state.isLocationPermissionGranted && 
               state.currentLocation !== null;
    },

    // Update checkLocationStatus to be faster
    checkLocationStatus: async () => {
        try {
            set({ isLoading: true, error: null });
            
            // Check if location services are enabled
            const isLocationEnabled = await Location.hasServicesEnabledAsync();
            
            // Check permission status
            const { status } = await Location.getForegroundPermissionsAsync();
            const isLocationPermissionGranted = status === 'granted';
            
            set({
                isLocationEnabled,
                isLocationPermissionGranted,
                isLoading: false,
            });
            
            // 🚀 ENHANCED: If location services are enabled but permission not granted, auto-request
            if (isLocationEnabled && !isLocationPermissionGranted) {
                console.log('📍 Location services enabled but permission not granted, auto-requesting...');
                await get().requestLocationPermission();
            }
            // If both are enabled, get current location quickly
            else if (isLocationEnabled && isLocationPermissionGranted) {
                // 🚀 ENHANCED: Use faster location accuracy for quick check
                try {
                    const location = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced, // Faster than High
                        timeInterval: 30000, // Use cached location if less than 30 seconds old
                    });
                    
                    const { latitude, longitude } = location.coords;
                    set({
                        currentLocation: { latitude, longitude },
                    });
                    
                    console.log('📍 Quick location update:', { latitude, longitude });
                } catch (error) {
                    console.log('📍 Quick location failed, will retry:', error);
                    // Don't set error, just log it
                }
            }
        } catch (error: any) {
            set({
                error: error.message || 'Failed to check location status',
                isLoading: false,
            });
        }
    },

    // Update requestLocationPermission to also check and update location services status
    requestLocationPermission: async () => {
        try {
            set({ isLoading: true, error: null });
            
            // 🚀 ENHANCED: Use the same approach as CheckoutScreen
            const { status } = await Location.requestForegroundPermissionsAsync();
            const isLocationPermissionGranted = status === 'granted';
            
            // 🚀 NEW: Also check location services status after permission request
            const isLocationEnabled = await Location.hasServicesEnabledAsync();
            
            set({
                isLocationEnabled,
                isLocationPermissionGranted,
                isLoading: false,
            });
            
            if (isLocationPermissionGranted && isLocationEnabled) {
                // Get current location after permission granted
                try {
                    const location = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.Balanced,
                    });
                    
                    const { latitude, longitude } = location.coords;
                    set({
                        currentLocation: { latitude, longitude },
                    });
                    
                    console.log('📍 Location obtained after permission:', { latitude, longitude });
                } catch (error) {
                    console.log('📍 Failed to get location after permission:', error);
                    // Don't set error, just log it
                }
            }
            
            return isLocationPermissionGranted;
        } catch (error: any) {
            set({
                error: error.message || 'Failed to request location permission',
                isLoading: false,
            });
            return false;
        }
    },

    updateLocation: async (shouldSendToBackend: boolean = false) => {
        try {
            const { isLocationEnabled, isLocationPermissionGranted } = get();
            
            if (!isLocationEnabled || !isLocationPermissionGranted) {
                return;
            }
            
            set({ isLoading: true, error: null });
            
            // Get current location
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            
            const { latitude, longitude } = location.coords;
            
            set({
                currentLocation: { latitude, longitude },
                isLoading: false,
            });
            
            console.log('📍 Location updated:', { latitude, longitude });
            
        } catch (error: any) {
            set({
                error: error.message || 'Failed to get current location',
                isLoading: false,
            });
        }
    },

    setLocationEnabled: (enabled: boolean) => {
        set({ isLocationEnabled: enabled });
    },

    setLocationPermission: (granted: boolean) => {
        set({ isLocationPermissionGranted: granted });
    },

    setCurrentLocation: (lat: number, lng: number) => {
        set({ currentLocation: { latitude: lat, longitude: lng } });
    },

    clearLocation: () => {
        set({
            currentLocation: null,
            isLocationEnabled: false,
            isLocationPermissionGranted: false,
        });
    },

    startLocationMonitoring: () => {
        const { isMonitoring } = get();
        if (isMonitoring) return;

        set({ isMonitoring: true });

        // Start watching for location changes
        const watchId = Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 30000, // Check every 30 seconds
                distanceInterval: 100, // Update every 100 meters
            },
            (location) => {
                const { latitude, longitude } = location.coords;
                set({ 
                    currentLocation: { latitude, longitude },
                    isLocationEnabled: true,
                    error: null 
                });
                console.log('📍 Location updated via monitoring:', { latitude, longitude });
            },
            (error: any) => {
                console.log('Location monitoring error:', error);
                set({ 
                    error: error.message || 'Location monitoring error',
                    isLocationEnabled: false,
                    currentLocation: null 
                });
            }
        );
    },

    stopLocationMonitoring: () => {
        set({ isMonitoring: false });
    },
}));

// Selector hook
export const useIsLocationReady = () => {
    return useLocationStore((state) => 
        state.isLocationEnabled && 
        state.isLocationPermissionGranted && 
        state.currentLocation !== null
    );
};
