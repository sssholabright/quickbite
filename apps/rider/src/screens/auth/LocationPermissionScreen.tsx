import React, { useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/theme';
import { SafeAreaWrapper } from '../../ui/SafeAreaWrapper';
import { Icon } from '../../ui/Icon';
import { CTAButton } from '../../ui/CTAButton';
import { useAuthStore } from '../../stores/auth';
import { RootStackParamList } from '../../navigation/types';
import { z } from 'zod';
import { useLocationStore } from '../../stores/location';

type LocationPermissionNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LocationPermission'>;

export const updateProfileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phone: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
    avatar: z.string().url('Avatar must be a valid URL').optional(),
    currentLat: z.number().optional(),
    currentLng: z.number().optional(),
});

export default function LocationPermissionScreen() {
    const theme = useTheme();
    const navigation = useNavigation<LocationPermissionNavigationProp>();
    const { updateProfile, isUpdatingProfile } = useAuthStore();
    const { 
        isLocationEnabled, 
        isLocationPermissionGranted, 
        checkLocationStatus,
        setLocationEnabled,
        setLocationPermission,
        isLocationReady
    } = useLocationStore();
    
    const [locationStatus, setLocationStatus] = useState<'checking' | 'granted' | 'denied' | 'updating'>('checking');
    const [profileUpdated, setProfileUpdated] = useState(false);

    useEffect(() => {
        requestLocationPermission();
    }, []);

    // Monitor location readiness and show granted state
    useEffect(() => {
        if (isLocationReady) {
            setLocationStatus('granted');
        }
    }, [isLocationReady]);

    const requestLocationPermission = async () => {
        try {
            setLocationStatus('checking');
            
            const { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status === 'granted') {
                setLocationPermission(true);
                setLocationStatus('updating');
                await getCurrentLocationAndUpdate();
            } else {
                setLocationPermission(false);
                setLocationStatus('denied');
            }
        } catch (error) {
            console.error('Error requesting location permission:', error);
            setLocationStatus('denied');
        }
    };

    const getCurrentLocationAndUpdate = async () => {
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const { latitude, longitude } = location.coords;
            
            // Update both stores
            await updateProfile({
                currentLat: latitude,
                currentLng: longitude,
            });
            
            // Update location store - this is what triggers the redirect
            const { setCurrentLocation, setLocationEnabled, setLocationPermission } = useLocationStore.getState();
            setCurrentLocation(latitude, longitude);
            setLocationEnabled(true);
            setLocationPermission(true);

            setLocationStatus('granted');
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert(
                'Location Error',
                'Unable to get your current location. Please try again.',
                [{ text: 'OK', onPress: () => setLocationStatus('denied') }]
            );
        }
    };

    const openLocationSettings = () => {
        if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
        } else {
            Linking.openSettings();
        }
    };

    const handleSkip = () => {
        Alert.alert(
            'Skip Location Permission',
            'You can enable location later in settings. This will help us show you nearby delivery opportunities.',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Skip', 
                    onPress: async () => {
                        try {
                            // Update profile with null location to allow navigation
                            await updateProfile({
                                currentLat: undefined,
                                currentLng: undefined,
                            });
                        } catch (error) {
                            console.error('Error updating profile:', error);
                            // Still allow navigation even if update fails
                        }
                    }
                }
            ]
        );
    };

    const renderContent = () => {
        switch (locationStatus) {
            case 'checking':
                return (
                    <View style={{ alignItems: 'center' }}>
                        <View style={{
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            backgroundColor: theme.colors.surface,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 24,
                            borderWidth: 2,
                            borderColor: theme.colors.border
                        }}>
                            <Icon name="location" size={32} color={theme.colors.primary} />
                        </View>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600',
                            color: theme.colors.text,
                            marginBottom: 8,
                            textAlign: 'center'
                        }}>
                            Requesting Location Access...
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.muted,
                            textAlign: 'center',
                            lineHeight: 20
                        }}>
                            Please allow location access to continue
                        </Text>
                    </View>
                );

            case 'updating':
                return (
                    <View style={{ alignItems: 'center' }}>
                        <View style={{
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            backgroundColor: theme.colors.surface,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 24,
                            borderWidth: 2,
                            borderColor: theme.colors.border
                        }}>
                            <Icon name="location" size={32} color={theme.colors.primary} />
                        </View>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600',
                            color: theme.colors.text,
                            marginBottom: 8,
                            textAlign: 'center'
                        }}>
                            Updating Location...
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.muted,
                            textAlign: 'center',
                            lineHeight: 20
                        }}>
                            Getting your current location and updating your profile
                        </Text>
                    </View>
                );

            case 'granted':
                return (
                    <View style={{ alignItems: 'center' }}>
                        <View style={{
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            backgroundColor: '#10b981' + '15',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 24,
                            borderWidth: 2,
                            borderColor: '#10b981'
                        }}>
                            <Icon name="checkmark-circle" size={32} color="#10b981" />
                        </View>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600',
                            color: theme.colors.text,
                            marginBottom: 8,
                            textAlign: 'center'
                        }}>
                            Location Enabled!
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.muted,
                            textAlign: 'center',
                            lineHeight: 20
                        }}>
                            Redirecting to the app...
                        </Text>
                    </View>
                );

            case 'denied':
                return (
                    <View style={{ alignItems: 'center' }}>
                        <View style={{
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            backgroundColor: '#ef4444' + '15',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 24,
                            borderWidth: 2,
                            borderColor: '#ef4444'
                        }}>
                            <Icon name="location-off" size={32} color="#ef4444" />
                        </View>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600',
                            color: theme.colors.text,
                            marginBottom: 8,
                            textAlign: 'center'
                        }}>
                            Location Required
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.muted,
                            textAlign: 'center',
                            lineHeight: 20,
                            marginBottom: 24
                        }}>
                            Location access is required to use the rider app. Please enable location services and allow access.
                        </Text>
                        
                        <View style={{ width: '100%', gap: 12 }}>
                            <CTAButton
                                title="Enable Location Access"
                                onPress={requestLocationPermission}
                                loading={isUpdatingProfile}
                            />
                            
                            <Pressable
                                onPress={() => {
                                    if (Platform.OS === 'ios') {
                                        Linking.openURL('app-settings:');
                                    } else {
                                        Linking.openSettings();
                                    }
                                }}
                                style={{
                                    paddingVertical: 12,
                                    borderRadius: 12,
                                    backgroundColor: theme.colors.background,
                                    borderWidth: 1,
                                    borderColor: theme.colors.border,
                                    alignItems: 'center'
                                }}
                            >
                                <Text style={{ color: theme.colors.text, fontWeight: '600' }}>
                                    Open Settings
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <SafeAreaWrapper>
            <View style={{ 
                flex: 1, 
                backgroundColor: theme.colors.background,
                justifyContent: 'center',
                paddingHorizontal: 24
            }}>
                {renderContent()}
            </View>
        </SafeAreaWrapper>
    );
}
