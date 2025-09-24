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
    updateLocation: () => Promise<void>;
    setLocationEnabled: (enabled: boolean) => void;
    setLocationPermission: (granted: boolean) => void;
    setCurrentLocation: (lat: number, lng: number) => void;
    clearLocation: () => void;
    startLocationMonitoring: () => void;
    stopLocationMonitoring: () => void;
    requestBackgroundLocation: () => Promise<void>;
    
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
            
            // If both are enabled, get current location
            if (isLocationEnabled && isLocationPermissionGranted) {
                await get().updateLocation();
            }
        } catch (error: any) {
            set({
                error: error.message || 'Failed to check location status',
                isLoading: false,
            });
        }
    },

    updateLocation: async () => {
        try {
            const { isLocationEnabled, isLocationPermissionGranted } = get();
            
            if (!isLocationEnabled || !isLocationPermissionGranted) {
                return;
            }
            
            set({ isLoading: true, error: null });
            
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            
            const { latitude, longitude } = location.coords;
            
            set({
                currentLocation: { latitude, longitude },
                isLoading: false,
            });
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
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 10000, // Check every 10 seconds
                distanceInterval: 100, // Update if moved 100 meters
            },
            (location) => {
                const { latitude, longitude } = location.coords;
                set({ 
                    currentLocation: { latitude, longitude },
                    isLocationEnabled: true,
                    error: null 
                });
            },
            (error) => {
                console.log('Location monitoring error:', error);
                set({ 
                    error: error, // Remove .message since error is already a string
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
        const intervalId = setInterval(checkLocationStatus, 5000); // Check every 5 seconds

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