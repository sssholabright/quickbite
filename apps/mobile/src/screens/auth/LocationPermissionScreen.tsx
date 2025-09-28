import React, { useEffect, useState } from 'react';
import { Alert, Linking, Platform, Pressable, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { useTheme } from '../../theme/theme';
import { SafeAreaWrapper } from '../../ui/SafeAreaWrapper';
import { Icon } from '../../ui/Icon';
import { CTAButton } from '../../ui/CTAButton';
import { RootStackParamList } from '../../navigation/types';
import { useLocationStore } from '../../stores/location';

type LocationPermissionNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LocationPermission'>;

export default function LocationPermissionScreen() {
    const theme = useTheme();
    const navigation = useNavigation<LocationPermissionNavigationProp>();
    const { 
        isLocationEnabled, 
        isLocationPermissionGranted, 
        checkLocationStatus,
        requestLocationPermission,
        isLocationReady
    } = useLocationStore();
    
    const [locationStatus, setLocationStatus] = useState<'checking' | 'granted' | 'denied' | 'updating'>('checking');

    // Update the useEffect to auto-request permission immediately
    useEffect(() => {
        // Auto-request permission immediately when screen loads
        handleRequestPermission();
    }, []);

    // Monitor location readiness and show granted state
    useEffect(() => {
        if (isLocationReady) {
            setLocationStatus('granted');
        }
    }, [isLocationReady]);

    const handleRequestPermission = async () => {
        try {
            setLocationStatus('checking');
            
            const granted = await requestLocationPermission();
            
            if (granted) {
                setLocationStatus('updating');
                // Location will be updated automatically in the store
            } else {
                setLocationStatus('denied');
            }
        } catch (error) {
            console.error('Error requesting location permission:', error);
            setLocationStatus('denied');
        }
    };

    const openLocationSettings = () => {
        if (Platform.OS === 'ios') {
            Linking.openURL('app-settings:');
        } else {
            Linking.openSettings();
        }
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
                            Getting Your Location...
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.muted,
                            textAlign: 'center',
                            lineHeight: 20
                        }}>
                            Finding your current location
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
                            Location access is required to use QuickBite. Please enable location services and allow access.
                        </Text>
                        
                        <View style={{ width: '100%', gap: 12 }}>
                            <CTAButton
                                title="Enable Location Access"
                                onPress={handleRequestPermission}
                            />
                            
                            <Pressable
                                onPress={openLocationSettings}
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
