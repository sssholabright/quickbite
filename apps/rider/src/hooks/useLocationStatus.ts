import { useEffect, useState } from 'react';
import { useLocationStore } from '../stores/location';

export const useLocationStatus = () => {
    const {
        isLocationEnabled,
        isLocationPermissionGranted,
        currentLocation,
        error,
        isLoading,
        checkLocationStatus,
        updateLocation
    } = useLocationStore();

    const [lastChecked, setLastChecked] = useState<Date>(new Date());

    // Auto-refresh location status
    useEffect(() => {
        const interval = setInterval(async () => {
            await checkLocationStatus();
            setLastChecked(new Date());
        }, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, [checkLocationStatus]);

    const isLocationReady = isLocationEnabled && 
                           isLocationPermissionGranted && 
                           currentLocation !== null;

    const getStatusInfo = () => {
        if (isLoading) {
            return {
                status: 'checking',
                message: 'Checking location...',
                color: '#6b7280',
                icon: 'location'
            };
        }

        if (error) {
            return {
                status: 'error',
                message: error,
                color: '#ef4444',
                icon: 'location-off'
            };
        }

        if (!isLocationEnabled) {
            return {
                status: 'disabled',
                message: 'Location services are disabled',
                color: '#ef4444',
                icon: 'location-off'
            };
        }

        if (!isLocationPermissionGranted) {
            return {
                status: 'permission_denied',
                message: 'Location permission required',
                color: '#f59e0b',
                icon: 'location-off'
            };
        }

        if (!currentLocation) {
            return {
                status: 'no_location',
                message: 'Getting location...',
                color: '#6b7280',
                icon: 'location'
            };
        }

        return {
            status: 'ready',
            message: 'Location active',
            color: '#10b981',
            icon: 'location'
        };
    };

    return {
        ...getStatusInfo(),
        isLocationReady,
        isLocationEnabled,
        isLocationPermissionGranted,
        currentLocation,
        error,
        isLoading,
        lastChecked,
        actions: {
            checkLocationStatus,
            updateLocation
        }
    };
};
