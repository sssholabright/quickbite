import { useEffect } from 'react';
import { useLocationStore } from '../stores/location';

export const useLocation = () => {
    const {
        isLocationEnabled,
        isLocationPermissionGranted,
        currentLocation,
        isLoading,
        error,
        checkLocationStatus,
        updateLocation,
        setLocationEnabled,
        setLocationPermission,
        setCurrentLocation,
        clearLocation,
    } = useLocationStore();

    // Auto-check location status when hook is used
    useEffect(() => {
        checkLocationStatus();
    }, [checkLocationStatus]);

    return {
        isLocationEnabled,
        isLocationPermissionGranted,
        currentLocation,
        isLoading,
        error,
        isLocationReady: isLocationEnabled && isLocationPermissionGranted && currentLocation !== null,
        actions: {
            checkLocationStatus,
            updateLocation,
            setLocationEnabled,
            setLocationPermission,
            setCurrentLocation,
            clearLocation,
        }
    };
};