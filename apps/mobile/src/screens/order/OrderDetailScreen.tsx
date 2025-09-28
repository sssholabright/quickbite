import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Animated } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useTheme } from '../../theme/theme';
import { Icon } from '../../ui/Icon';
import { CTAButton } from '../../ui/CTAButton';
import { Order, OrderStatus } from '../../types/order';
import type { RootStackParamList } from '../../navigation/types';
import StatusStep from '../../components/orders/StatusStep';
import OrderSummary from '../../components/orders/OrderSummary';
import MapCompat from '../../components/maps/MapCompat';
import { useQueryClient } from '@tanstack/react-query';
import AlertModal from '../../ui/AlertModal';
import { useEnhancedOrder } from '../../hooks/useEnhancedOrder';
import { useRealtimeStore } from '../../stores/realtime';

type OrderDetailRouteProp = RouteProp<RootStackParamList, 'OrderDetail'>;

export default function OrderDetailScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const route = useRoute<OrderDetailRouteProp>();
    const navigation = useNavigation();
    const { orderId } = route.params;

    const formatNaira = (amount: number): string => {
        return `₦${amount.toLocaleString('en-NG')}`
    }
    
    // ALL useState hooks first
    const [showDriverInfo, setShowDriverInfo] = useState(false);
    const [pulseAnim] = useState(new Animated.Value(1));
    const [driverIdx, setDriverIdx] = useState(0);
    const [alert, setAlert] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info' as 'success' | 'error' | 'warning' | 'info'
    });

    // ALL query hooks next
    const { data: backendOrderData, isLoading, error, hasRealtimeUpdate } = useEnhancedOrder(orderId);
    const { connectionStatus } = useRealtimeStore();
    const queryClient = useQueryClient();

    // 🚀 UPDATED: Enhanced status mapping to include new delivery statuses
    const getStatusMapping = (backendStatus: string): OrderStatus => {
        switch (backendStatus) {
            case 'PENDING': return 'pending';
            case 'CONFIRMED': return 'confirmed';
            case 'PREPARING': return 'preparing';
            case 'READY_FOR_PICKUP': return 'ready_for_pickup';
            case 'ASSIGNED': return 'assigned'; // 🚀 NEW: Rider assigned status
            case 'PICKED_UP': return 'picked_up'; // 🚀 NEW: Order picked up status
            case 'OUT_FOR_DELIVERY': return 'out_for_delivery';
            case 'DELIVERED': return 'delivered';
            case 'CANCELLED': return 'cancelled';
            default: return 'pending';
        }
    };

    // 🚀 NEW: Get status display text
    const getStatusDisplayText = (order: any): string => {
        switch (order.status) {
            case 'PENDING': return 'Order placed';
            case 'CONFIRMED': return 'Order confirmed';
            case 'PREPARING': return 'Preparing your order';
            case 'READY_FOR_PICKUP': return 'Ready for pickup';
            case 'ASSIGNED': 
                return order.rider 
                    ? `Rider ${order.rider.user?.name || 'assigned'} is on the way`
                    : 'Rider assigned';
            case 'PICKED_UP': 
                return order.rider 
                    ? `${order.rider.user?.name || 'Rider'} picked up your order`
                    : 'Order picked up';
            case 'OUT_FOR_DELIVERY': 
                return order.rider 
                    ? `${order.rider.user?.name || 'Rider'} is delivering`
                    : 'Out for delivery';
            case 'DELIVERED': return 'Delivered';
            case 'CANCELLED': return 'Cancelled';
            default: return 'Processing';
        }
    };

    // 🚀 NEW: Get status color
    const getStatusColor = (status: string): string => {
        switch (status) {
            case 'PENDING': return '#f59e0b';
            case 'CONFIRMED': return theme.colors.primary;
            case 'PREPARING': return theme.colors.primary;
            case 'READY_FOR_PICKUP': return '#10b981';
            case 'ASSIGNED': return '#3b82f6';
            case 'PICKED_UP': return '#8b5cf6';
            case 'OUT_FOR_DELIVERY': return '#f59e0b';
            case 'DELIVERED': return '#10b981';
            case 'CANCELLED': return theme.colors.danger;
            default: return theme.colors.muted;
        }
    };

    // Transform backend data to match UI expectations
    const orderData: Order | null = backendOrderData ? {
        id: backendOrderData.id,
        orderId: backendOrderData.orderNumber,
        vendor: {
            id: backendOrderData.vendor.id,
            name: backendOrderData.vendor.businessName,
            logo: undefined,
            location: backendOrderData.vendor.address || 'Address not available'
        },
        // 🚀 NEW: Include rider information
        rider: backendOrderData.rider ? {
            id: backendOrderData.rider.id,
            name: backendOrderData.rider.name || 'Rider',
            phone: backendOrderData.rider.phone || '',
            vehicleType: backendOrderData.rider.vehicleType || 'Bicycle'
        } : undefined,
        items: backendOrderData.items.map((orderItem: any) => ({
            id: orderItem.id,
            name: orderItem.menuItem.name,
            price: orderItem.unitPrice,
            quantity: orderItem.quantity,
            image: orderItem.menuItem.image,
            addOns: orderItem.addOns?.map((addOn: any) => ({
                id: addOn.id,
                addOn: {
                    id: addOn.addOn.id,
                    name: addOn.addOn.name,
                    description: addOn.addOn.description,
                    price: addOn.addOn.price,
                    category: addOn.addOn.category
                },
                quantity: addOn.quantity,
                price: addOn.price
            })) || []
        })),
        status: getStatusMapping(backendOrderData.status),
        // 🚀 NEW: Enhanced status display
        statusText: getStatusDisplayText(backendOrderData),
        statusColor: getStatusColor(backendOrderData.status),
        isLiveTracking: ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(backendOrderData.status),
        total: backendOrderData.pricing.total,
        subtotal: backendOrderData.pricing.subtotal,
        fees: backendOrderData.pricing.deliveryFee + backendOrderData.pricing.serviceFee,
        paymentMethod: 'cash' as const,
        paymentStatus: 'paid' as const,
        notes: backendOrderData.specialInstructions,
        pickupTime: 'asap',
        placedAt: new Date(backendOrderData.createdAt),
        estimatedReadyAt: backendOrderData.estimatedDeliveryTime ? new Date(backendOrderData.estimatedDeliveryTime) : undefined,
        estimatedDeliveryTime: backendOrderData.estimatedDeliveryTime ? new Date(backendOrderData.estimatedDeliveryTime) : undefined
    } : null;

  

    // ALL useEffect hooks together
    useEffect(() => {
        if (!orderData?.status) return;
        
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
    }, [orderData?.status, pulseAnim]);

    // WebSocket listeners for real-time updates
    useEffect(() => {
        if (!backendOrderData) return;

        const handleOrderStatusUpdate = (data: any) => {
            if (data.orderId === orderId) {
                console.log('Order status updated:', data);
                queryClient.invalidateQueries({ queryKey: ['order', orderId] });
                
                const statusMessages = {
                    'CONFIRMED': {
                        title: 'Order Confirmed ✅',
                        message: `Order confirmed by ${backendOrderData?.vendor.businessName || 'restaurant'}.`,
                        type: 'success' as const
                    },
                    'PREPARING': {
                        title: 'Preparing Your Food 👨‍🍳',
                        message: `${backendOrderData?.vendor.businessName || 'Restaurant'} is preparing your food.`,
                        type: 'info' as const
                    },
                    'READY_FOR_PICKUP': {
                        title: 'Ready for Pickup 🍱',
                        message: 'Your food is ready for pickup.',
                        type: 'info' as const
                    },
                    'ASSIGNED': {
                        title: 'Rider Assigned ✅',
                        message: `Rider ${data.rider?.name || 'assigned'} is on the way to pick up your order.`,
                        type: 'success' as const
                    },
                    'PICKED_UP': {
                        title: 'Picked Up ✅',
                        message: 'Your rider has picked up your order. On the way!',
                        type: 'info' as const
                    },
                    'DELIVERED': {
                        title: 'Order Delivered 📦',
                        message: 'Order delivered. Enjoy your meal!',
                        type: 'success' as const
                    },
                    'CANCELLED': {
                        title: 'Order Cancelled ❌',
                        message: 'Order cancelled. Refund in progress.',
                        type: 'error' as const
                    }
                };

                const statusUpdate = statusMessages[data.status as keyof typeof statusMessages];
                if (statusUpdate) {
                    setAlert({
                        visible: true,
                        ...statusUpdate
                    });
                }
            }
        };

        const handleDeliveryUpdate = (data: any) => {
            if (data.orderId === orderId) {
                console.log('Delivery update:', data);
                queryClient.invalidateQueries({ queryKey: ['order', orderId] });
            }
        };

        return () => {
            // No socket listeners to off here as socket is removed.
        };
    }, [backendOrderData, orderId, queryClient]);

    const hideAlert = () => {
        setAlert(prev => ({ ...prev, visible: false }));
    };

    // Add this helper function after the existing helper functions
    const getRelativeTime = (timestamp: string) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now.getTime() - time.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return time.toLocaleDateString();
    };

    // NOW conditional returns
    if (isLoading) {
        return (
            <View style={{ 
                flex: 1, 
                justifyContent: 'center', 
                alignItems: 'center',
                backgroundColor: theme.colors.background,
            }}>
                <Text style={{ color: theme.colors.text }}>Loading order...</Text>
            </View>
        );
    }

    if (error || !orderData) {
        return (
            <View style={{ 
                flex: 1, 
                justifyContent: 'center', 
                alignItems: 'center',
                backgroundColor: theme.colors.background,
            }}>
                <Text style={{ color: theme.colors.text }}>Order not found</Text>
            </View>
        );
    }

    // 🚀 UPDATED: Enhanced status steps to include new delivery statuses
    const getStatusSteps = (currentBackendStatus: string) => {
        const steps = [
            { 
                key: 'pending', 
                label: 'Order Placed', 
                icon: 'time', 
                time: backendOrderData?.createdAt ? getRelativeTime(backendOrderData.createdAt.toString()) : '',
                description: 'Order placed. Waiting for vendor confirmation.',
                active: ['PENDING'].includes(currentBackendStatus)
            },
            { 
                key: 'confirmed', 
                label: 'Confirmed', 
                icon: 'checkmark-circle', 
                time: ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(currentBackendStatus) 
                    ? (backendOrderData?.updatedAt ? getRelativeTime(backendOrderData.updatedAt.toString()) : '') 
                    : '',
                description: `Order confirmed by ${orderData.vendor.name}.`,
                active: ['CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(currentBackendStatus)
            },
            { 
                key: 'preparing', 
                label: 'Preparing', 
                icon: 'restaurant', 
                time: ['PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(currentBackendStatus)
                    ? (backendOrderData?.updatedAt ? getRelativeTime(backendOrderData.updatedAt.toString()) : '')
                    : '',
                description: `${orderData.vendor.name} is preparing your food.`,
                active: ['PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(currentBackendStatus)
            },
            { 
                key: 'ready_for_pickup',
                label: 'Ready for Pickup', 
                icon: 'bag', 
                time: ['READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(currentBackendStatus)
                    ? (backendOrderData?.updatedAt ? getRelativeTime(backendOrderData.updatedAt.toString()) : '')
                    : '',
                description: 'Your food is ready for pickup.',
                active: ['READY_FOR_PICKUP', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(currentBackendStatus)
            },
            { 
                key: 'assigned',
                label: 'Rider Assigned', 
                icon: 'person', 
                time: ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(currentBackendStatus)
                    ? (backendOrderData?.updatedAt ? getRelativeTime(backendOrderData.updatedAt.toString()) : '')
                    : '',
                description: backendOrderData?.rider ? `Rider ${backendOrderData.rider.name || 'assigned'} is on the way` : 'Rider assigned to your order.',
                active: ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(currentBackendStatus)
            },
            { 
                key: 'picked_up',
                label: 'Picked Up', 
                icon: 'bicycle', 
                time: ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(currentBackendStatus)
                    ? (backendOrderData?.updatedAt ? getRelativeTime(backendOrderData.updatedAt.toString()) : '')
                    : '',
                description: backendOrderData?.rider ? `Your rider ${backendOrderData.rider.name || 'assigned'} has picked up your order. On the way!` : 'Order picked up for delivery.',
                active: ['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(currentBackendStatus)
            },
            { 
                key: 'delivered', 
                label: 'Delivered', 
                icon: 'checkmark-done', 
                time: ['DELIVERED'].includes(currentBackendStatus)
                    ? (backendOrderData?.updatedAt ? getRelativeTime(backendOrderData.updatedAt.toString()) : '')
                    : '',
                description: 'Order delivered. Enjoy your meal!',
                active: ['DELIVERED'].includes(currentBackendStatus)
            },
        ];

        // Filter out cancelled status from normal flow
        if (currentBackendStatus === 'CANCELLED') {
            return [{
                key: 'cancelled',
                label: 'Order Cancelled',
                icon: 'close-circle',
                time: backendOrderData?.updatedAt ? getRelativeTime(backendOrderData.updatedAt.toString()) : 'Cancelled',
                description: 'Order cancelled. Refund in progress.',
                active: true
            }];
        }

        return steps;
    };

    const statusSteps = getStatusSteps(backendOrderData?.status || 'PENDING');
    const currentStep = statusSteps.find(step => step.active);

    const getActionButton = () => {
        switch (backendOrderData?.status) {
            case 'PENDING':
                return (
                    <CTAButton
                        title="Cancel Order"
                        onPress={() => {
                            setAlert({
                                visible: true,
                                title: 'Cancel Order',
                                message: 'Are you sure you want to cancel this order?',
                                type: 'warning'
                            });
                        }}
                    />
                );
            case 'ASSIGNED':
            case 'PICKED_UP':
            case 'OUT_FOR_DELIVERY':
                return (
                    <CTAButton
                        title="Track Delivery"
                        onPress={() => setShowDriverInfo(true)}
                    />
                );
            case 'DELIVERED':
                return (
                    <CTAButton
                        title="Reorder"
                        onPress={() => console.log('Reorder')}
                    />
                );
            default:
                return null;
        }
    };

    //  ENHANCED: Improved rider info display
    const renderDriverInfo = () => (
        <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: theme.colors.border,
        }}>
            <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: theme.colors.text,
                marginBottom: 16,
            }}>
                Rider Information
            </Text>

            {backendOrderData?.rider ? (
                <>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 12,
                    }}>
                        <View style={{
                            width: 50,
                            height: 50,
                            borderRadius: 25,
                            backgroundColor: theme.colors.background,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                        }}>
                            <Icon name="person" size={24} color={theme.colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: theme.colors.text,
                                marginBottom: 2,
                            }}>
                                {backendOrderData.rider.name || 'Rider'}
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                color: theme.colors.muted,
                            }}>
                                {backendOrderData.rider.vehicleType || 'Bicycle'} • Rider
                            </Text>
                        </View>
                        <Pressable
                            onPress={() => console.log('Call rider:', backendOrderData.rider?.phone)}
                            style={{
                                backgroundColor: theme.colors.primary,
                                borderRadius: 20,
                                padding: 8,
                            }}
                        >
                            <Icon name="call" size={16} color="white" />
                        </Pressable>
                    </View>

                    <View style={{
                        backgroundColor: theme.colors.background,
                        borderRadius: 8,
                        padding: 12,
                    }}>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.muted,
                            marginBottom: 4,
                        }}>
                            Estimated Arrival
                        </Text>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: theme.colors.primary,
                        }}>
                            {backendOrderData.estimatedDeliveryTime ? 
                                `${Math.ceil((new Date(backendOrderData.estimatedDeliveryTime).getTime() - Date.now()) / (1000 * 60))} minutes` :
                                '8-12 minutes'
                            }
                        </Text>
                    </View>
                </>
            ) : (
                <Text style={{ color: theme.colors.muted }}>
                    Rider will be assigned soon
                </Text>
            )}
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }} edges={['top','bottom']}>
            {/* Header with real-time indicator */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
            }}>
                <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                    <Icon name="arrow-back" size={20} color={theme.colors.text} />
                </Pressable>
                <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: theme.colors.text,
                    flex: 1,
                }}>
                    Order #{orderData.orderId}
                </Text>
                
                {/* Real-time connection indicator */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                }}>
                    <View style={{
                        width: 6,
                        height: 6,
                        borderRadius: 4,
                        backgroundColor: connectionStatus === 'connected' ? '#34C759' : '#FF3B30',
                        marginRight: 4,
                    }} />
                    {hasRealtimeUpdate && (
                        <Text style={{
                            fontSize: 8,
                            color: theme.colors.primary,
                            fontWeight: '600',
                        }}>
                            LIVE
                        </Text>
                    )}
                </View>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 80 }}
                showsVerticalScrollIndicator={false}
            >
                {/*  ENHANCED: Current Status Banner with live tracking indicator */}
                <View style={{
                    backgroundColor: orderData.isLiveTracking ? '#3b82f6' + '15' : theme.colors.primary + '15',
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: orderData.isLiveTracking ? '#3b82f6' + '30' : theme.colors.primary + '30',
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                        <Icon name={currentStep?.icon || 'time'} size={24} color={orderData.isLiveTracking ? '#3b82f6' : theme.colors.primary} />
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: orderData.isLiveTracking ? '#3b82f6' : theme.colors.primary,
                            marginLeft: 12,
                        }}>
                            {currentStep?.label}
                        </Text>
                        {orderData.isLiveTracking && (
                            <View style={{
                                backgroundColor: '#3b82f6',
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 8,
                                marginLeft: 8,
                            }}>
                                <Text style={{
                                    fontSize: 10,
                                    fontWeight: '600',
                                    color: 'white',
                                }}>
                                    LIVE
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.text,
                        lineHeight: 20,
                    }}>
                        {currentStep?.description}
                    </Text>
                </View>

                {/* Status Timeline */}
                <View style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                }}>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: 20,
                    }}>
                        Order Timeline
                    </Text>

                    {statusSteps.map((step, index) => (
                        <StatusStep
                            key={step.key}
                            step={step}
                            currentStatus={orderData.status}
                            statusSteps={statusSteps}
                            pulseAnim={pulseAnim}
                        />
                    ))}
                </View>

                {/* 🚀 ENHANCED: Rider Info (show for assigned, picked up, or out for delivery) */}
                {backendOrderData?.status && ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(backendOrderData.status) && renderDriverInfo()}

                {/* Order Summary - Use transformed data */}
                <OrderSummary
                    items={orderData.items}
                    vendor={{
                        name: orderData.vendor.name,
                        distance: orderData.vendor.location || 'Address not provided',
                        eta: orderData.estimatedReadyAt ? 
                            `Ready by ${orderData.estimatedReadyAt.toLocaleTimeString()}` :
                            'ASAP'
                    }}
                    total={orderData.total}
                />

                {/* Payment Info - Use backend pricing data */}
                <View style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                }}>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: 16,
                    }}>
                        Payment Info
                    </Text>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                    }}>
                        <Text style={{ fontSize: 12, color: theme.colors.muted }}>
                            Subtotal
                        </Text>
                        <Text style={{ fontSize: 14, color: theme.colors.text }}>
                            {formatNaira(backendOrderData?.pricing.subtotal || 0)}
                        </Text>
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                    }}>
                        <Text style={{ fontSize: 12, color: theme.colors.muted }}>
                            Delivery Fee
                        </Text>
                        <Text style={{ fontSize: 14, color: theme.colors.text }}>
                            {formatNaira(backendOrderData?.pricing.deliveryFee || 0)}
                        </Text>
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                    }}>
                        <Text style={{ fontSize: 12, color: theme.colors.muted }}>
                            Service Fee
                        </Text>
                        <Text style={{ fontSize: 14, color: theme.colors.text }}>
                            {formatNaira(backendOrderData?.pricing.serviceFee || 0)}
                        </Text>
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingTop: 8,
                        borderTopWidth: 1,
                        borderTopColor: theme.colors.border,
                    }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text }}>
                            Total
                        </Text>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.primary }}>
                            {formatNaira(backendOrderData?.pricing.total || 0)}
                        </Text>
                    </View>
                </View>

                {/* Special Instructions */}
                {backendOrderData?.specialInstructions && (
                    <View style={{
                        backgroundColor: theme.colors.surface,
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 20,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                    }}>
                        <Text style={{
                            fontSize: 14,
                            fontWeight: '600',
                            color: theme.colors.text,
                            marginBottom: 8,
                        }}>
                            Special Instructions
                        </Text>
                        <Text style={{
                            fontSize: 12,
                            color: theme.colors.text,
                        }}>
                            {backendOrderData.specialInstructions}
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Action Button */}
            {getActionButton() && (
                <View style={{
                    position: 'absolute',
                    bottom: 0, left: 0, right: 0,
                    backgroundColor: theme.colors.surface,
                    padding: 16,
                    paddingBottom: insets.bottom + 12,
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border,
                }}>
                    {getActionButton()}
                </View>
            )}

            {/* Alert Modal for status updates */}
            <AlertModal
                visible={alert.visible}
                title={alert.title}
                message={alert.message}
                type={alert.type}
                onConfirm={hideAlert}
                confirmText="OK"
            />
        </SafeAreaView>
    );
}