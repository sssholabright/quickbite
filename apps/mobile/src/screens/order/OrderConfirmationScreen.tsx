import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { SafeAreaWrapper } from '../../ui/SafeAreaWrapper';
import { useTheme } from '../../theme/theme';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { Icon } from '../../ui/Icon';
import { CTAButton } from '../../ui/CTAButton';
import AlertModal from '../../ui/AlertModal';

type OrderConfirmationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OrderConfirmation'>;
type OrderConfirmationRouteProp = RouteProp<RootStackParamList, 'OrderConfirmation'>;

interface AlertState {
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onConfirm?: () => void;
    onCancel?: () => void;
    showCancel?: boolean;
    confirmText?: string;
    cancelText?: string;
}

export default function OrderConfirmationScreen() {
    const theme = useTheme();
    const navigation = useNavigation<OrderConfirmationScreenNavigationProp>();
    const route = useRoute<OrderConfirmationRouteProp>();
    const { orderId, pickupCode, vendor, items, total } = route.params;

    // Alert modal state
    const [alert, setAlert] = useState<AlertState>({
        visible: false,
        title: '',
        message: '',
        type: 'info'
    });

    // Helper function to show alert
    const showAlert = (alertData: Omit<AlertState, 'visible'>) => {
        setAlert({
            ...alertData,
            visible: true
        });
    };

    // Helper function to hide alert
    const hideAlert = () => {
        setAlert(prev => ({ ...prev, visible: false }));
    };

    const handleViewOrder = () => {
        navigation.replace('OrderDetail', { orderId });
    };

    const handleBackToHome = () => {
        showAlert({
            title: 'Leave Order Details?',
            message: 'Are you sure you want to go back to home? You can always view your order details later.',
            type: 'info',
            confirmText: 'Yes, Go Home',
            cancelText: 'Stay Here',
            showCancel: true,
            onConfirm: () => {
                hideAlert();
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'AppTabs' }],
                });
            },
            onCancel: hideAlert
        });
    };

    const handleShareOrder = () => {
        showAlert({
            title: 'Share Order',
            message: `Order ${pickupCode} has been placed successfully! Share this with your friends.`,
            type: 'success',
            confirmText: 'OK',
            onConfirm: hideAlert
        });
    };

    return (
        <SafeAreaWrapper>
            <View style={{ flex: 1, padding: 16 }}>
                {/* Success Icon */}
                <View style={{ 
                    alignItems: 'center', 
                    marginTop: 60,
                    marginBottom: 32
                }}>
                    <View style={{
                        width: 120,
                        height: 120,
                        borderRadius: 60,
                        backgroundColor: theme.colors.primary + '20',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 24
                    }}>
                        <Icon name="check" size={60} color={theme.colors.primary} />
                    </View>

                    <Text style={{
                        fontSize: 24,
                        fontWeight: '700',
                        color: theme.colors.text,
                        textAlign: 'center',
                        marginBottom: 8
                    }}>
                        Order Placed!
                    </Text>

                    <Text style={{
                        fontSize: 16,
                        color: theme.colors.muted,
                        textAlign: 'center',
                        lineHeight: 24
                    }}>
                        Your order has been placed successfully. We'll notify you when it's ready for pickup.
                    </Text>
                </View>

                {/* Order Details */}
                <View style={{
                    backgroundColor: theme.colors.background,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 32
                }}>
                    <View style={{ alignItems: 'center', marginBottom: 20 }}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '700',
                            color: theme.colors.text,
                            marginBottom: 4
                        }}>
                            {pickupCode}
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.muted
                        }}>
                            Order ID: {pickupCode}
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                        <Text style={{ fontSize: 14, color: theme.colors.muted }}>Total Amount</Text>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: theme.colors.text }}>
                            ₦{total.toLocaleString('en-NG')}
                        </Text>
                    </View>

                    <View style={{ 
                        height: 1, 
                        backgroundColor: theme.colors.border, 
                        marginBottom: 16 
                    }} />

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Icon name="clock" size={16} color={theme.colors.muted} />
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.muted,
                            marginLeft: 8
                        }}>
                            Estimated preparation time: 15-30 minutes
                        </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Icon name="map-pin" size={16} color={theme.colors.muted} />
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.muted,
                            marginLeft: 8
                        }}>
                            We'll notify you when your order is ready
                        </Text>
                    </View>

                    {/* Share button */}
                    <Pressable
                        onPress={handleShareOrder}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                            backgroundColor: theme.colors.primary + '15',
                            marginTop: 8
                        }}
                    >
                        <Icon name="share" size={16} color={theme.colors.primary} />
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.primary,
                            fontWeight: '600',
                            marginLeft: 6
                        }}>
                            Share Order
                        </Text>
                    </Pressable>
                </View>

                {/* Action Buttons */}
                <View style={{ gap: 12 }}>
                    <CTAButton
                        title="View Order Details"
                        onPress={handleViewOrder}
                    />
                    
                    <CTAButton
                        title="Back to Home"
                        onPress={handleBackToHome}
                    />
                </View>

                {/* Alert Modal */}
                <AlertModal
                    visible={alert.visible}
                    title={alert.title}
                    message={alert.message}
                    type={alert.type}
                    onConfirm={alert.onConfirm || hideAlert}
                    onCancel={alert.onCancel}
                    confirmText={alert.confirmText}
                    cancelText={alert.cancelText}
                    showCancel={alert.showCancel}
                />
            </View>
        </SafeAreaWrapper>
    );
}