import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useTheme, useThemeMode, useSetThemeMode, useEffectiveThemeMode } from '../theme/theme';
import { Icon } from '../ui/Icon';
import notificationService from '../services/notificationService';
import AlertModal from '../ui/AlertModal';

type SettingsNav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<SettingsNav>();
    const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
    
    // AlertModal states
    const [alertModal, setAlertModal] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info' as 'success' | 'error' | 'warning' | 'info',
        onConfirm: () => {},
        onCancel: undefined as (() => void) | undefined,
        confirmText: 'OK',
        cancelText: 'Cancel',
        showCancel: false,
    });
    
    const currentThemeMode = useThemeMode();
    const setThemeMode = useSetThemeMode();
    const effectiveMode = useEffectiveThemeMode();

    useEffect(() => {
        checkNotificationStatus();
    }, []);

    const showAlert = (
        title: string,
        message: string,
        type: 'success' | 'error' | 'warning' | 'info' = 'info',
        onConfirm?: () => void,
        onCancel?: () => void,
        confirmText: string = 'OK',
        cancelText: string = 'Cancel',
        showCancel: boolean = false
    ) => {
        setAlertModal({
            visible: true,
            title,
            message,
            type,
            onConfirm: onConfirm || (() => setAlertModal(prev => ({ ...prev, visible: false }))),
            onCancel: onCancel || (() => setAlertModal(prev => ({ ...prev, visible: false }))),
            confirmText,
            cancelText,
            showCancel,
        });
    };

    const checkNotificationStatus = async () => {
        try {
            const permissions = await notificationService.getPermissionStatus();
            setNotificationPermission(permissions.status);
        } catch (error) {
            console.error('Error checking notification status:', error);
        }
    };

    const handleRequestNotificationPermission = async () => {
        try {
            const permissions = await notificationService.requestPermissions();
            setNotificationPermission(permissions.status);
            
            if (permissions.status === 'granted') {
                showAlert(
                    'Success', 
                    'Notifications enabled! You will now receive delivery job notifications.',
                    'success'
                );
                // Re-initialize to get push token
                await notificationService.initialize();
            } else {
                showAlert(
                    'Permission Denied', 
                    'Please enable notifications manually in your device settings:\n\nSettings > Apps > QuickBite Rider > Notifications',
                    'warning'
                );
            }
        } catch (error) {
            console.error('Error requesting notification permission:', error);
            showAlert('Error', 'Failed to request notification permission', 'error');
        }
    };

    const handleNotificationToggle = async (type: 'push' | 'email' | 'sms') => {
        if (type === 'push') {
            // Handle push notification permission
            if (notificationPermission === 'granted') {
                // Show alert when trying to turn OFF
                showAlert(
                    "Disable Notifications",
                    "To disable notifications, please go to your device settings:\n\nSettings > Apps > QuickBite Rider > Notifications",
                    'info'
                );
            } else {
                // Request permission when toggling ON
                await handleRequestNotificationPermission();
            }
        } else {
            // Handle other notification types normally
            
        }
    };

    const handleThemeChange = (mode: 'system' | 'light' | 'dark') => {
        setThemeMode(mode);
        showAlert(
            'Theme Updated',
            `Theme changed to ${mode === 'system' ? 'System' : mode === 'light' ? 'Light' : 'Dark'} mode.`,
            'success'
        );
    };

    const handleComingSoon = (feature: string) => {
        showAlert(
            'Coming Soon',
            `${feature} feature will be available in a future update.`,
            'info'
        );
    };

    const renderSettingItem = (
        icon: string,
        title: string,
        disabled?: boolean,
        subtitle?: string,
        rightComponent?: React.ReactNode,
        onPress?: () => void
    ) => (
        <Pressable
            onPress={disabled ? () => handleComingSoon(title) : onPress}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
                opacity: disabled ? 0.5 : 1,
            }}
        >
            <View style={{
                width: 35,
                height: 35,
                borderRadius: 17.5,
                backgroundColor: theme.colors.primary + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
            }}>
                <Icon name={icon} size={18} color={disabled ? theme.colors.muted : theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: disabled ? theme.colors.muted : theme.colors.text,
                    marginBottom: subtitle ? 2 : 0,
                }}>
                    {title}
                </Text>
                {subtitle && (
                    <Text style={{
                        fontSize: 12,
                        color: disabled ? theme.colors.muted : theme.colors.text,
                    }}>
                        {subtitle}
                    </Text>
                )}
            </View>
            {rightComponent || (onPress && (
                <Icon name="chevron-forward" size={18} color={disabled ? theme.colors.muted : theme.colors.text} />
            ))}
        </Pressable>
    );

    const renderThemeOption = (mode: 'system' | 'light' | 'dark', label: string, description: string) => (
        <Pressable
            key={mode}
            onPress={() => handleThemeChange(mode)}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: currentThemeMode === mode ? theme.colors.primary : theme.colors.border,
            }}
        >
            <View style={{
                width: 20,
                height: 20,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: currentThemeMode === mode ? theme.colors.primary : theme.colors.border,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
            }}>
                {currentThemeMode === mode && (
                    <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.colors.primary,
                    }} />
                )}
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: theme.colors.text,
                    marginBottom: 2,
                }}>
                    {label}
                </Text>
                <Text style={{
                    fontSize: 12,
                    color: theme.colors.muted,
                }}>
                    {description}
                </Text>
                {mode === 'system' && currentThemeMode === 'system' && (
                    <Text style={{
                        fontSize: 10,
                        color: theme.colors.primary,
                        marginTop: 2,
                        fontWeight: '500',
                    }}>
                        Currently: {effectiveMode === 'dark' ? 'Dark' : 'Light'}
                    </Text>
                )}
            </View>
        </Pressable>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top','bottom']}>
            {/* Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
            }}>
                <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                    <Icon name="arrow-back" size={24} color={theme.colors.text} />
                </Pressable>
                <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: theme.colors.text,
                }}>
                    Settings
                </Text>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Appearance */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: 16,
                    }}>
                        Appearance
                    </Text>

                    {renderThemeOption(
                        'system',
                        'System',
                        'Follow device theme settings'
                    )}

                    {renderThemeOption(
                        'light',
                        'Light',
                        'Always use light theme'
                    )}

                    {renderThemeOption(
                        'dark',
                        'Dark',
                        'Always use dark theme'
                    )}
                </View>

                {/* Notifications */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: 16,
                    }}>
                        Notifications
                    </Text>

                    {renderSettingItem(
                        'notifications',
                        'Push Notifications',
                        false,
                        notificationPermission === 'granted' 
                            ? 'Get notified about order updates' 
                            : 'Enable to receive delivery job notifications',
                        <Switch
                            value={notificationPermission === 'granted'}
                            onValueChange={() => handleNotificationToggle('push')}
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                            thumbColor={notificationPermission === 'granted' ? theme.colors.primary : theme.colors.muted}
                        />
                    )}

                    {renderSettingItem(
                        'mail',
                        'Email Notifications',
                        true,
                        'Coming Soon',
                        <Switch
                            value={false}
                            onValueChange={() => {}}
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                            thumbColor={theme.colors.muted}
                            disabled={true}
                        />
                    )}

                    {renderSettingItem(
                        'chatbubble',
                        'SMS Notifications',
                        true,
                        'Coming Soon',
                        <Switch
                            value={false}
                            onValueChange={() => {}}
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                            thumbColor={theme.colors.muted}
                            disabled={true}
                        />
                    )}
                </View>

                {/* Preferences */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: 16,
                    }}>
                        Preferences
                    </Text>

                    {renderSettingItem(
                        'language',
                        'Language',
                        true,
                        'Coming Soon',
                        undefined,
                        () => handleComingSoon('Language')
                    )}
                </View>
            </ScrollView>

            {/* AlertModal */}
            <AlertModal
                visible={alertModal.visible}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
                onConfirm={alertModal.onConfirm}
                onCancel={alertModal.onCancel}
                confirmText={alertModal.confirmText}
                cancelText={alertModal.cancelText}
                showCancel={alertModal.showCancel}
            />
        </SafeAreaView>
    );
}