import { create } from 'zustand';
import * as Location from 'expo-location';
import { Platform } from 'react-native';
import riderService from '../services/riderService';

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
    
    // 🚀 IMPROVED: Better tracking for backend updates
    lastBackendUpdate: number;
    isUpdatingBackend: boolean;
    hasInitialLocationSent: boolean; // Track if initial location was sent
    
    // Actions
    checkLocationStatus: () => Promise<void>;
    updateLocation: (shouldSendToBackend?: boolean) => Promise<void>;
    setLocationEnabled: (enabled: boolean) => void;
    setLocationPermission: (granted: boolean) => void;
    setCurrentLocation: (lat: number, lng: number) => void;
    clearLocation: () => void;
    startLocationMonitoring: () => void;
    stopLocationMonitoring: () => void;
    requestBackgroundLocation: () => Promise<void>;
    
    // 🚀 NEW: Smart location update for delivery
    updateLocationForDelivery: (orderId: string) => Promise<void>;
    
    // 🚀 NEW: Send initial location when rider comes online
    sendInitialLocation: () => Promise<void>;
    
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
    lastBackendUpdate: 0,
    isUpdatingBackend: false,
    hasInitialLocationSent: false,
    
    // Computed value
    get isLocationReady() {
        const state = get();
        return state.isLocationEnabled && 
               state.isLocationPermissionGranted && 
               state.currentLocation !== null;
    },

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
            
            // If both are enabled, get current location (local only)
            if (isLocationEnabled && isLocationPermissionGranted) {
                await get().updateLocation(false); // Don't send to backend on status check
            }
        } catch (error: any) {
            set({
                error: error.message || 'Failed to check location status',
                isLoading: false,
            });
        }
    },

    updateLocation: async (shouldSendToBackend: boolean = false) => {
        try {
            const { isLocationEnabled, isLocationPermissionGranted, isUpdatingBackend } = get();
            
            if (!isLocationEnabled || !isLocationPermissionGranted) {
                return;
            }
            
            // 🚀 CRITICAL: Prevent multiple simultaneous backend updates
            if (shouldSendToBackend && isUpdatingBackend) {
                console.log('📍 Backend update already in progress, skipping...');
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
            
            //  CRITICAL: Only send to backend when explicitly requested and not recently sent
            if (shouldSendToBackend) {
                const now = Date.now();
                const { lastBackendUpdate } = get();
                
                // Only send if it's been more than 30 seconds since last update
                if (now - lastBackendUpdate > 30000) {
                    set({ isUpdatingBackend: true });
                    
                    try {
                        console.log('📍 Sending location to backend:', { latitude, longitude });
                        await riderService.updateRiderLocation({ latitude, longitude });
                        set({ lastBackendUpdate: now });
                    } catch (error) {
                        console.error('❌ Failed to update location on backend:', error);
                    } finally {
                        set({ isUpdatingBackend: false });
                    }
                } else {
                    console.log('📍 Location update too frequent, skipping backend update');
                }
            } else {
                console.log('📍 Location updated locally only:', { latitude, longitude });
            }
            
        } catch (error: any) {
            set({
                error: error.message || 'Failed to get current location',
                isLoading: false,
                isUpdatingBackend: false,
            });
        }
    },

    // 🚀 NEW: Send initial location when rider comes online (only once)
    sendInitialLocation: async () => {
        try {
            const { 
                isLocationEnabled, 
                isLocationPermissionGranted, 
                isUpdatingBackend, 
                hasInitialLocationSent,
                currentLocation 
            } = get();
            
            if (!isLocationEnabled || !isLocationPermissionGranted) {
                console.log('📍 Location not ready, cannot send initial location');
                return;
            }
            
            // Only send once per session
            if (hasInitialLocationSent) {
                console.log('📍 Initial location already sent this session');
                return;
            }
            
            // Prevent multiple simultaneous updates
            if (isUpdatingBackend) {
                console.log('📍 Backend update already in progress, skipping initial location...');
                return;
            }
            
            set({ isUpdatingBackend: true });
            
            // Get fresh location
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            
            const { latitude, longitude } = location.coords;
            
            // Update local location
            set({
                currentLocation: { latitude, longitude },
            });
            
            // Send to backend
            console.log(' Sending initial location to backend:', { latitude, longitude });
            await riderService.updateRiderLocation({ latitude, longitude });
            
            set({ 
                lastBackendUpdate: Date.now(),
                isUpdatingBackend: false,
                hasInitialLocationSent: true // Mark as sent
            });
            
        } catch (error: any) {
            console.error('❌ Failed to send initial location:', error);
            set({ isUpdatingBackend: false });
        }
    },

    // 🚀 NEW: Smart location update for delivery orders
    updateLocationForDelivery: async (orderId: string) => {
        try {
            const { isLocationEnabled, isLocationPermissionGranted, isUpdatingBackend } = get();
            
            if (!isLocationEnabled || !isLocationPermissionGranted) {
                return;
            }
            
            // Prevent multiple simultaneous updates
            if (isUpdatingBackend) {
                console.log('📍 Backend update already in progress, skipping...');
                return;
            }
            
            set({ isUpdatingBackend: true });
            
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            
            const { latitude, longitude } = location.coords;
            
            // Update local location
            set({
                currentLocation: { latitude, longitude },
            });
            
            // Send to backend with order context
            console.log(`📍 Sending location update for order ${orderId}:`, { latitude, longitude });
            await riderService.updateRiderLocation({ latitude, longitude });
            
            set({ 
                lastBackendUpdate: Date.now(),
                isUpdatingBackend: false 
            });
            
        } catch (error: any) {
            console.error('❌ Failed to update location for delivery:', error);
            set({ isUpdatingBackend: false });
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
            lastBackendUpdate: 0,
            isUpdatingBackend: false,
            hasInitialLocationSent: false, // Reset when clearing location
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
                timeInterval: 15000, // Check every 15 seconds
                distanceInterval: 100, // Update every 100 meters
            },
            (location) => {
                const { latitude, longitude } = location.coords;
                set({ 
                    currentLocation: { latitude, longitude },
                    isLocationEnabled: true,
                    error: null 
                });
                // 🚀 CRITICAL: Don't send to backend automatically during monitoring
                console.log('📍 Location updated locally via monitoring:', { latitude, longitude });
            },
            (error) => {
                console.log('Location monitoring error:', error);
                set({ 
                    error: error,
                    isLocationEnabled: false,
                    currentLocation: null 
                });
            }
        );

        // Also monitor app state changes to detect when location is turned off
        const checkLocationStatus = async () => {
            try {
                const isLocationEnabled = await Location.hasServicesEnabledAsync();
                const { status } = await Location.getForegroundPermissionsAsync();
                const isLocationPermissionGranted = status === 'granted';

                set({
                    isLocationEnabled,
                    isLocationPermissionGranted,
                });

                // If location is disabled, clear current location
                if (!isLocationEnabled || !isLocationPermissionGranted) {
                    set({ currentLocation: null });
                }
            } catch (error) {
                set({ 
                    isLocationEnabled: false,
                    currentLocation: null,
                    error: 'Location services unavailable'
                });
            }
        };

        // Check location status periodically
        const intervalId = setInterval(checkLocationStatus, 60000); // Check every 60 seconds

        // Store cleanup function
        set({ 
            isMonitoring: true,
            // Store cleanup functions (you'll need to handle these)
        });
    },

    stopLocationMonitoring: () => {
        set({ isMonitoring: false });
        // Stop watching and clear intervals
    },

    requestBackgroundLocation: async () => {
        try {
            if (Platform.OS === 'ios') {
                const { status } = await Location.requestBackgroundPermissionsAsync();
                if (status === 'granted') {
                    // Start background location updates
                    Location.startLocationUpdatesAsync('background-location', {
                        accuracy: Location.Accuracy.Balanced,
                        timeInterval: 60000, // 1 minute
                        distanceInterval: 1000, // 1 km
                    });
                }
            }
        } catch (error) {
            console.error('Background location error:', error);
        }
    },
}));

// In your components, create a selector
export const useIsLocationReady = () => {
    return useLocationStore((state) => 
        state.isLocationEnabled && 
        state.isLocationPermissionGranted && 
        state.currentLocation !== null
    );
};