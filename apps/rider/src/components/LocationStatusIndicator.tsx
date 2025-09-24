import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Icon } from '../ui/Icon';
import { useTheme } from '../theme/theme';
import { useLocation } from '../hooks/useLocation';

interface LocationStatusIndicatorProps {
    showText?: boolean;
    onPress?: () => void;
}

export const LocationStatusIndicator: React.FC<LocationStatusIndicatorProps> = ({ 
    showText = true, 
    onPress 
}) => {
    const theme = useTheme();
    const { isLocationReady, isLocationEnabled, isLocationPermissionGranted } = useLocation();

    const getStatusInfo = () => {
        if (isLocationReady) {
            return {
                icon: 'location',
                color: '#10b981',
                text: 'Location Active',
                bgColor: '#10b981' + '15'
            };
        } else if (!isLocationEnabled) {
            return {
                icon: 'location-off',
                color: '#ef4444',
                text: 'Location Disabled',
                bgColor: '#ef4444' + '15'
            };
        } else if (!isLocationPermissionGranted) {
            return {
                icon: 'location-off',
                color: '#f59e0b',
                text: 'Location Permission Required',
                bgColor: '#f59e0b' + '15'
            };
        } else {
            return {
                icon: 'location-off',
                color: '#ef4444',
                text: 'Location Error',
                bgColor: '#ef4444' + '15'
            };
        }
    };

    const status = getStatusInfo();

    return (
        <Pressable
            onPress={onPress}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 20,
                backgroundColor: status.bgColor,
                borderWidth: 1,
                borderColor: status.color + '30',
            }}
        >
            <Icon name={status.icon} size={16} color={status.color} />
            {showText && (
                <Text style={{
                    marginLeft: 6,
                    fontSize: 12,
                    fontWeight: '600',
                    color: status.color,
                }}>
                    {status.text}
                </Text>
            )}
        </Pressable>
    );
};
