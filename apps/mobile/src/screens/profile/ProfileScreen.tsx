import React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/theme';
import { Icon } from '../../ui/Icon';
import { CTAButton } from '../../ui/CTAButton';
import { useAuthStore } from '../../stores/auth';
import { mockUser } from '../../lib/mockProfile';
import type { RootStackParamList } from '../../navigation/types';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AppTabs'>;

export default function ProfileScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<ProfileScreenNavigationProp>();
    const logout = useAuthStore((s) => s.logout);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout }
            ]
        );
    };

    const renderProfileHeader = () => (
        <View style={{
            alignItems: 'center',
            paddingVertical: 32,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            marginBottom: 24,
        }}>
            <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: theme.colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
            }}>
                <Icon name="person" size={40} color="white" />
            </View>
            <Text style={{
                fontSize: 24,
                fontWeight: '700',
                color: theme.colors.text,
                marginBottom: 8,
            }}>
                {mockUser.name}
            </Text>
            <Text style={{
                fontSize: 16,
                color: theme.colors.muted,
                marginBottom: 4,
            }}>
                {mockUser.email}
            </Text>
            <Text style={{
                fontSize: 16,
                color: theme.colors.muted,
            }}>
                {mockUser.phone}
            </Text>
        </View>
    );

    const renderQuickLink = (
        icon: string,
        title: string,
        subtitle: string,
        onPress: () => void,
        showArrow: boolean = true
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
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.colors.primary + '20',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
            }}>
                <Icon name={icon} size={20} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: theme.colors.text,
                    marginBottom: 2,
                }}>
                    {title}
                </Text>
                <Text style={{
                    fontSize: 14,
                    color: theme.colors.muted,
                }}>
                    {subtitle}
                </Text>
            </View>
            {showArrow && (
                <Icon name="chevron-forward" size={20} color={theme.colors.muted} />
            )}
        </Pressable>
    );

    return (
        <View style={{ 
            flex: 1, 
            backgroundColor: theme.colors.background,
            paddingTop: insets.top + 16,
        }}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {renderProfileHeader()}

                {/* Quick Links */}
                <View style={{ marginBottom: 32 }}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: 16,
                    }}>
                        Quick Links
                    </Text>

                    {renderQuickLink(
                        'location',
                        'Addresses',
                        'Manage your delivery addresses',
                        () => navigation.navigate('AddressManagement' as any)
                    )}

                    {renderQuickLink(
                        'card',
                        'Payment Methods',
                        'Manage your payment options',
                        () => navigation.navigate('PaymentMethods' as any)
                    )}

                    {renderQuickLink(
                        'settings',
                        'Settings',
                        'App preferences and notifications',
                        () => navigation.navigate('Settings' as any)
                    )}
                </View>

                {/* App Info */}
                <View style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    marginBottom: 32,
                }}>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: 8,
                    }}>
                        QuickBite
                    </Text>
                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.muted,
                        marginBottom: 4,
                    }}>
                        Version 1.0.0
                    </Text>
                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.muted,
                    }}>
                        Made with ❤️ for students
                    </Text>
                </View>
            </ScrollView>

            {/* Logout Button */}
            <View style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: theme.colors.surface,
                padding: 20,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
            }}>
                <CTAButton
                    title="Logout"
                    onPress={handleLogout}
                    // style={{ backgroundColor: '#FF3B30' }}
                />
            </View>
        </View>
    );
}