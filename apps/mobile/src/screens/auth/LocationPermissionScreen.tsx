import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Linking } from 'react-native';
import { SafeAreaWrapper } from '../../ui/SafeAreaWrapper';
import { Icon } from '../../ui/Icon';
import { useTheme } from '../../theme/theme';
import { useLocationStore } from '../../stores/location';
import * as Location from 'expo-location';
import { CTAButton } from '../../ui/CTAButton';

export default function LocationPermissionScreen() {
    const theme = useTheme();
    const { 
        isLocationEnabled, 
        isLocationPermissionGranted, 
        currentLocation,
        requestLocationPermission,
        checkLocationStatus,
        isLoading 
    } = useLocationStore();
    
    const [isRequesting, setIsRequesting] = useState(false);

    // Check location status when component mounts
    useEffect(() => {
        checkLocationStatus();
    }, [checkLocationStatus]);

    const handleRequestPermission = async () => {
        try {
            setIsRequesting(true);
            
            console.log('📍 Requesting location permission...');
            
            // 🚀 ENHANCED: Use the same approach as CheckoutScreen
            const { status } = await Location.requestForegroundPermissionsAsync();
            
            console.log('📍 Permission status:', status);
            
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Location permission is required for delivery. Please enable location access in your device settings.',
                    [
                        {
                            text: 'Cancel',
                            style: 'cancel',
                        },
                        {
                            text: 'Open Settings',
                            onPress: () => Linking.openSettings(),
                        },
                    ]
                );
                return;
            }

            console.log('📍 Permission granted, checking location services...');
            
            // 🚀 NEW: Refresh location status after permission granted
            await checkLocationStatus();

            console.log('📍 Getting current location...');
            
            // Get current location after permission granted
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });
            
            const { latitude, longitude } = location.coords;
            
            console.log('📍 Location obtained:', { latitude, longitude });
            
            // Update location in store
            useLocationStore.getState().setCurrentLocation(latitude, longitude);
            
            console.log('📍 Location stored, checking store state...');
            
            // Check final state
            const finalState = useLocationStore.getState();
            console.log('📍 Final location state:', {
                isLocationEnabled: finalState.isLocationEnabled,
                isLocationPermissionGranted: finalState.isLocationPermissionGranted,
                currentLocation: finalState.currentLocation,
                isLocationReady: finalState.isLocationReady
            });
            
        } catch (error) {
            console.error('Error requesting location permission:', error);
            Alert.alert(
                'Location Error',
                'Could not get your current location. Please check your location settings and try again.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsRequesting(false);
        }
    };

    return (
        <SafeAreaWrapper edges={["top", "bottom"]}>
            <View style={styles.container}>
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Icon 
                            name="location" 
                            size={80} 
                            color={theme.colors.primary} 
                        />
                    </View>
                    
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        Location Access Required
                    </Text>
                    
                    <Text style={[styles.description, { color: theme.colors.muted }]}>
                        We need access to your location to provide accurate delivery services and show you nearby restaurants.
                    </Text>
                    
                    <View style={styles.statusContainer}>
                        <View style={styles.statusItem}>
                            <Icon 
                                name={isLocationEnabled ? "checkmark-circle" : "close-circle"} 
                                size={20} 
                                color={isLocationEnabled ? theme.colors.primary : theme.colors.danger} 
                            />
                            <Text style={[styles.statusText, { color: theme.colors.text }]}>
                                Location Services: {isLocationEnabled ? 'Enabled' : 'Disabled'}
                            </Text>
                        </View>
                        
                        <View style={styles.statusItem}>
                            <Icon 
                                name={isLocationPermissionGranted ? "checkmark-circle" : "close-circle"} 
                                size={20} 
                                color={isLocationPermissionGranted ? theme.colors.primary : theme.colors.danger} 
                            />
                            <Text style={[styles.statusText, { color: theme.colors.text }]}>
                                App Permission: {isLocationPermissionGranted ? 'Granted' : 'Denied'}
                            </Text>
                        </View>
                        
                        {currentLocation && (
                            <View style={styles.statusItem}>
                                <Icon 
                                    name="checkmark-circle" 
                                    size={20} 
                                    color={theme.colors.primary} 
                                />
                                <Text style={[styles.statusText, { color: theme.colors.text }]}>
                                    Current Location: Available
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
                
                <View style={styles.buttonContainer}>
                    <CTAButton
                        title={isRequesting ? "Requesting Permission..." : "Allow Location Access"}
                        onPress={handleRequestPermission}
                        disabled={isRequesting || isLoading}
                        style={styles.primaryButton}
                    />
                </View>
            </View>
        </SafeAreaWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 24,
        paddingVertical: 32,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 16,
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    statusContainer: {
        width: '100%',
        marginBottom: 32,
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    statusText: {
        fontSize: 16,
        marginLeft: 12,
    },
    buttonContainer: {
        gap: 16,
    },
    primaryButton: {
        marginBottom: 8,
    },
});
