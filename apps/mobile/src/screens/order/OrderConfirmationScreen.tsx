import { Animated, ScrollView, Text, View } from "react-native";
import { SafeAreaWrapper } from "../../ui/SafeAreaWrapper";
import { useTheme } from "../../theme/theme";
import { Icon } from "../../ui/Icon";
import { CTAButton } from "../../ui/CTAButton";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { RootStackParamList } from "../../navigation/types";
import { Dimensions } from "react-native";
import { useEffect, useState } from "react";
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import OrderSummary from "../../components/orders/OrderSummary";
import StatusStep from "../../components/orders/StatusStep";

type OrderConfirmationRouteProp = RouteProp<RootStackParamList, 'OrderConfirmation'>;
type OrderConfirmationNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OrderConfirmation'>;

export default function OrderConfirmationScreen() {
    const theme = useTheme()
    const navigation = useNavigation<OrderConfirmationNavigationProp>();
    const route = useRoute<OrderConfirmationRouteProp>();
    const { orderId, pickupCode, vendor, items, total } = route.params;

    const [currentStatus, setCurrentStatus] = useState<'pending' | 'preparing' | 'ready' | 'picked'>('pending');
    const [pulseAnim] = useState(new Animated.Value(1));

    // Simulate status updates
    useEffect(() => {
        const timers = [
        setTimeout(() => setCurrentStatus('preparing'), 3000),
        setTimeout(() => setCurrentStatus('ready'), 8000),
        setTimeout(() => setCurrentStatus('picked'), 15000),
        ];

        return () => timers.forEach(clearTimeout);
    }, []);

    // Pulse animation for current status
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();

        return () => pulse.stop();
    }, [currentStatus]);

    const statusSteps = [
        { key: 'pending', label: 'Order Submitted', icon: 'time', time: 'Just now' },
        { key: 'preparing', label: 'Preparing', icon: 'restaurant', time: '~5 mins' },
        { key: 'ready', label: 'Ready for Pickup', icon: 'checkmark-circle', time: '~10 mins' },
        { key: 'picked', label: 'Picked Up', icon: 'checkmark-done', time: 'Complete' },
    ];

    const getStatusColor = (status: string) => {
        if (status === currentStatus) return theme.colors.primary;
        if (statusSteps.findIndex(s => s.key === status) < statusSteps.findIndex(s => s.key === currentStatus)) {
            return theme.colors.primary;
        }
        return theme.colors.muted;
    };

    const renderStatusStep = (step: any, index: number) => {
        return <StatusStep step={step} currentStatus={currentStatus} statusSteps={statusSteps} pulseAnim={pulseAnim} />
    }

    const renderOrderSummary = () => (
        <OrderSummary items={items} vendor={vendor} total={total} />
    )


    return (
        <SafeAreaWrapper>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={{ alignItems: 'center', marginBottom: 32 }}>
                    <Text style={{
                        fontSize: 24,
                        fontWeight: '700',
                        color: theme.colors.text,
                        marginBottom: 8,
                    }}>
                        Order Placed
                    </Text>
                    <Text style={{
                        fontSize: 16,
                        color: theme.colors.muted,
                        textAlign: 'center',
                    }}>
                        We've sent this to {vendor.name}
                    </Text>
                </View>

                {/* Success State */}
                <View style={{ alignItems: 'center', marginBottom: 32 }}>
                    <View style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: theme.colors.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                    }}>
                        <Icon name="checkmark" size={40} color="white" />
                    </View>
                
                    <Text style={{
                        fontSize: 20,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: 8,
                    }}>
                        Your order is confirmed!
                    </Text>

                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.muted,
                    }}>
                        Order #{orderId}
                    </Text>
                </View>

                {/* Pickup Code */}
                <View style={{
                    backgroundColor: theme.colors.primary,
                    borderRadius: 16,
                    padding: 24,
                    alignItems: 'center',
                    marginBottom: 32,
                }}>
                    <Text style={{
                        fontSize: 16,
                        color: 'white',
                        marginBottom: 8,
                        opacity: 0.9,
                    }}>
                        Pickup Code
                    </Text>
                    <Text style={{
                        fontSize: 48,
                        fontWeight: '700',
                        color: 'white',
                        letterSpacing: 4,
                        marginBottom: 8,
                    }}>
                        {pickupCode}
                    </Text>
                    <Text style={{
                        fontSize: 14,
                        color: 'white',
                        opacity: 0.8,
                    }}>
                        Show this code at pickup
                    </Text>
                </View>

                {/* Order Summary */}
                {renderOrderSummary()}

                {/* Live Status Tracker */}
                <View style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                }}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: 20,
                    }}>
                        Order Status
                    </Text>

                    {statusSteps.map((step, index) => renderStatusStep(step, index))}
                </View>

                {/* Notifications */}
                <View style={{
                    backgroundColor: theme.colors.background,
                    borderRadius: 12,
                    padding: 16,
                    alignItems: 'center',
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                }}>
                    <Icon name="notifications" size={24} color={theme.colors.primary} style={{ marginBottom: 8 }} />
                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.text,
                        textAlign: 'center',
                    }}>
                        We'll notify you when your order is ready
                    </Text>
                </View>
            </ScrollView>

            {/* Sticky Footer */}
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
                    title="Track in My Orders"
                    onPress={() => navigation.navigate('AppTabs', { screen: 'Orders' } as any)}
                />
            </View>
        </SafeAreaWrapper>
    )
}