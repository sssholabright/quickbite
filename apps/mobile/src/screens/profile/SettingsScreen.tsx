import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Switch, Alert, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useTheme, useThemeMode, useSetThemeMode, useEffectiveThemeMode } from '../../theme/theme';
import { Icon } from '../../ui/Icon';
import { mockSettings } from '../../lib/mockProfile';

type SettingsNav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<SettingsNav>();
    const [settings, setSettings] = useState(mockSettings);
    
    const currentThemeMode = useThemeMode();
    const setThemeMode = useSetThemeMode();
    const effectiveMode = useEffectiveThemeMode();

    const handleNotificationToggle = (type: 'push' | 'email' | 'sms') => {
        setSettings(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [type]: !prev.notifications[type]
            }
        }));
    };

    const handleThemeChange = (mode: 'system' | 'light' | 'dark') => {
        setThemeMode(mode);
    };

    const handleContactSupport = () => {
        Alert.alert(
            'Contact Support',
            'How would you like to contact us?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Email', onPress: () => Linking.openURL('mailto:support@quickbite.com') },
                { text: 'WhatsApp', onPress: () => Linking.openURL('https://wa.me/2348012345678') }
            ]
        );
    };

    const renderSettingItem = (
        icon: string,
        title: string,
        subtitle?: string,
        rightComponent?: React.ReactNode,
        onPress?: () => void
    ) => (
        <Pressable
            onPress={onPress}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
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
                <Icon name={icon} size={18} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: theme.colors.text,
                    marginBottom: subtitle ? 2 : 0,
                }}>
                    {title}
                </Text>
                {subtitle && (
                    <Text style={{
                        fontSize: 12,
                        color: theme.colors.muted,
                    }}>
                        {subtitle}
                    </Text>
                )}
            </View>
            {rightComponent || (onPress && (
                <Icon name="chevron-forward" size={18} color={theme.colors.muted} />
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
                        'Get notified about order updates',
                        <Switch
                            value={settings.notifications.push}
                            onValueChange={() => handleNotificationToggle('push')}
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                            thumbColor={settings.notifications.push ? theme.colors.primary : theme.colors.muted}
                        />
                    )}

                    {renderSettingItem(
                        'mail',
                        'Email Notifications',
                        'Receive updates via email',
                        <Switch
                            value={settings.notifications.email}
                            onValueChange={() => handleNotificationToggle('email')}
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                            thumbColor={settings.notifications.email ? theme.colors.primary : theme.colors.muted}
                        />
                    )}

                    {renderSettingItem(
                        'chatbubble',
                        'SMS Notifications',
                        'Get text message updates',
                        <Switch
                            value={settings.notifications.sms}
                            onValueChange={() => handleNotificationToggle('sms')}
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                            thumbColor={settings.notifications.sms ? theme.colors.primary : theme.colors.muted}
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
                        settings.preferences.language,
                        undefined,
                        () => console.log('Change language')
                    )}

                    {renderSettingItem(
                        'location',
                        'Default Address',
                        'Set your preferred delivery address',
                        undefined,
                        () => navigation.navigate('AddressManagement' as any)
                    )}
                </View>

                {/* Help & Support */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: 16,
                    }}>
                        Help & Support
                    </Text>

                    {renderSettingItem(
                        'help-circle',
                        'FAQ',
                        'Frequently asked questions',
                        undefined,
                        () => console.log('Open FAQ')
                    )}

                    {renderSettingItem(
                        'chatbubble-ellipses',
                        'Contact Support',
                        'Get help from our team',
                        undefined,
                        handleContactSupport
                    )}
                </View>

                {/* About */}
                <View style={{ marginBottom: 24 }}>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: 16,
                    }}>
                        About
                    </Text>

                    {renderSettingItem(
                        'information-circle',
                        'App Version',
                        '1.0.0',
                        undefined,
                        () => console.log('Show version info')
                    )}

                    {renderSettingItem(
                        'document-text',
                        'Terms of Service',
                        'Read our terms and conditions',
                        undefined,
                        () => console.log('Open terms')
                    )}

                    {renderSettingItem(
                        'shield-checkmark',
                        'Privacy Policy',
                        'How we protect your data',
                        undefined,
                        () => console.log('Open privacy policy')
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
