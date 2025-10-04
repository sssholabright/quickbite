import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useTheme } from '../../theme/theme';
import { useAuthStore } from '../../stores/auth';
import { SafeAreaWrapper } from '../../ui/SafeAreaWrapper';
import { Icon } from '../../ui/Icon';
import { useNavigation } from '@react-navigation/native';

export default function UnauthorizedScreen() {
    const theme = useTheme();
    const { user, logout } = useAuthStore();
    const navigation = useNavigation();

    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const getRoleDisplayName = (role: string) => {
        switch (role) {
            case 'VENDOR':
                return 'Vendor';
            case 'RIDER':
                return 'Rider';
            case 'ADMIN':
                return 'Admin';
            default:
                return role;
        }
    };

    const getRoleDescription = (role: string) => {
        switch (role) {
            case 'VENDOR':
                return 'Vendors should use the vendor dashboard to manage their restaurant and orders.';
            case 'RIDER':
                return 'Riders should use the rider app to manage deliveries and track orders.';
            case 'ADMIN':
                return 'Admins should use the admin panel to manage the platform.';
            default:
                return 'This role is not supported in the mobile app.';
        }
    };

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'VENDOR':
                return 'store';
            case 'RIDER':
                return 'bike';
            case 'ADMIN':
                return 'shield';
            default:
                return 'person';
        }
    };

    return (
        <SafeAreaWrapper 
            edges={["top", "bottom"]}
            backgroundColor={theme.colors.background}
        >
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 24,
                backgroundColor: theme.colors.background
            }}>
                {/* Icon */}
                <View style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: theme.colors.danger + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 32
                }}>
                    <Icon 
                        name={getRoleIcon(user?.role || '')} 
                        size={60} 
                        color={theme.colors.danger} 
                    />
                </View>

                {/* Title */}
                <Text style={{
                    fontSize: 28,
                    fontWeight: '700',
                    color: theme.colors.text,
                    textAlign: 'center',
                    marginBottom: 16
                }}>
                    Access Restricted
                </Text>

                {/* Subtitle */}
                <Text style={{
                    fontSize: 16,
                    color: theme.colors.muted,
                    textAlign: 'center',
                    marginBottom: 32,
                    lineHeight: 24
                }}>
                    You're logged in as a {getRoleDisplayName(user?.role || '')}, but this app is designed for customers only.
                </Text>

                {/* Description */}
                <View style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 32,
                    borderWidth: 1,
                    borderColor: theme.colors.border
                }}>
                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.text,
                        textAlign: 'center',
                        lineHeight: 20
                    }}>
                        {getRoleDescription(user?.role || '')}
                    </Text>
                </View>

                {/* User Info */}
                <View style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 32,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    width: '100%'
                }}>
                    <Text style={{
                        fontSize: 12,
                        color: theme.colors.muted,
                        textAlign: 'center',
                        marginBottom: 8
                    }}>
                        Logged in as:
                    </Text>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.text,
                        textAlign: 'center',
                        marginBottom: 4
                    }}>
                        {user?.name}
                    </Text>
                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.muted,
                        textAlign: 'center'
                    }}>
                        {user?.email}
                    </Text>
                </View>

                {/* Logout Button */}
                <Pressable
                    onPress={handleLogout}
                    style={{
                        backgroundColor: theme.colors.primary,
                        paddingHorizontal: 32,
                        paddingVertical: 16,
                        borderRadius: 12,
                        width: '100%',
                        alignItems: 'center',
                        shadowColor: theme.colors.primary,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8
                    }}
                >
                    <Text style={{
                        color: 'white',
                        fontSize: 16,
                        fontWeight: '600'
                    }}>
                        Logout & Switch Account
                    </Text>
                </Pressable>

                {/* Help Text */}
                <Text style={{
                    fontSize: 12,
                    color: theme.colors.muted,
                    textAlign: 'center',
                    marginTop: 24,
                    lineHeight: 18
                }}>
                    Need help? Contact support if you believe this is an error.
                </Text>
            </View>
        </SafeAreaWrapper>
    );
}
