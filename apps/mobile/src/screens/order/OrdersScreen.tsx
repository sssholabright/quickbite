import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaWrapper } from '../../ui/SafeAreaWrapper';
import { useTheme } from '../../theme/theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppTabParamList } from '../../navigation/types';
import { Icon } from '../../ui/Icon';
import OrderCard from '../../ui/OrderCard';
import AlertModal from '../../ui/AlertModal';
import { OrderStatus } from '../../types/order';
import { useRealtimeStore } from '../../stores/realtime';
import { useEnhancedOrders } from '../../hooks/useEnhancedOrders';

type OrdersScreenNavigationProp = NativeStackNavigationProp<AppTabParamList, 'Orders'>;

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

export default function OrdersScreen() {
    const theme = useTheme();
    const navigation = useNavigation<OrdersScreenNavigationProp>();
    const [filter, setFilter] = useState<'all' | 'active' | 'past'>('all');

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

    // 🚀 UPDATED: Build filters for API with new delivery statuses
    const apiFilters = {
        ...(filter === 'active' && { 
            status: 'PENDING,CONFIRMED,PREPARING,READY_FOR_PICKUP,ASSIGNED,PICKED_UP,OUT_FOR_DELIVERY' 
        }),
        ...(filter === 'past' && { status: 'DELIVERED,CANCELLED' }),
        page: 1,
        limit: 50
    };

    const { data: ordersData, isLoading, error, refetch } = useEnhancedOrders(apiFilters);
    const { connectionStatus } = useRealtimeStore();

    const orders = ordersData?.orders || [];
    const isRefreshing = false;

    const handleRefresh = async () => {
        try {
            await refetch();
        } catch (error) {
            showAlert({
                title: 'Refresh Failed',
                message: 'Failed to refresh orders. Please check your internet connection and try again.',
                type: 'error',
                confirmText: 'Retry',
                cancelText: 'Cancel',
                showCancel: true,
                onConfirm: () => {
                    hideAlert();
                    handleRefresh();
                },
                onCancel: hideAlert
            });
        }
    };

    const handleOrderPress = (orderId: string) => {
        navigation.getParent()?.navigate('OrderDetail', { orderId });
    };

    const handleFilterChange = (newFilter: 'all' | 'active' | 'past') => {
        setFilter(newFilter);
    };

    // 🚀 UPDATED: Enhanced status mapping with new delivery statuses
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

    // 🚀 NEW: Get status display text with rider info
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
            case 'PENDING': return '#f59e0b'; // Use hex color instead of theme.colors.warning
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

    const renderOrderItem = ({ item }: { item: any }) => (
        <OrderCard 
            order={{
                id: item.id,
                orderId: item.orderNumber,
                vendor: {
                    id: item.vendor.id,
                    name: item.vendor.name,
                    businessName: item.vendor.businessName,
                    logo: undefined,
                    address: item.vendor.address || 'Address not available'
                },
                // 🚀 NEW: Include rider info if available
                rider: item.rider ? {
                    id: item.rider.id,
                    name: item.rider.user?.name || 'Rider',
                    phone: item.rider.user?.phone || '',
                } : undefined,
                items: item.items.map((orderItem: any) => ({
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
                status: getStatusMapping(item.status),
                //  NEW: Enhanced status display
                statusDisplayText: getStatusDisplayText(item),
                statusColor: getStatusColor(item.status),
                total: item.pricing.total,
                subtotal: item.pricing.subtotal,
                fees: item.pricing.deliveryFee + item.pricing.serviceFee,
                paymentMethod: 'cash' as const,
                paymentStatus: 'paid' as const,
                specialInstructions: item.specialInstructions,
                createdAt: new Date(item.createdAt),
                updatedAt: new Date(item.updatedAt),
                estimatedDeliveryTime: item.estimatedDeliveryTime ? new Date(item.estimatedDeliveryTime) : undefined,
                // 🚀 NEW: Real-time tracking info
                isRealtime: ['ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY'].includes(item.status),
                deliveryFee: item.pricing.deliveryFee,
                serviceFee: item.pricing.serviceFee,
            }}
            onPress={() => handleOrderPress(item.id)}
        />
    );

    const renderEmptyState = () => (
        <View style={{ 
            flex: 1, 
            alignItems: 'center', 
            justifyContent: 'center',
            paddingHorizontal: 32,
            paddingTop: 60
        }}>
            <Icon name="package" size={64} color={theme.colors.muted} />
            <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: theme.colors.text,
                marginTop: 16,
                marginBottom: 8
            }}>
                No orders yet
            </Text>
            <Text style={{
                fontSize: 12,
                color: theme.colors.muted,
                textAlign: 'center',
                lineHeight: 20
            }}>
                {filter === 'active' 
                    ? "You don't have any active orders at the moment."
                    : filter === 'past'
                    ? "You haven't completed any orders yet."
                    : "You haven't placed any orders yet."
                }
            </Text>
        </View>
    );

    const renderErrorState = () => (
        <View style={{ 
            flex: 1, 
            alignItems: 'center', 
            justifyContent: 'center',
            paddingHorizontal: 32,
            paddingTop: 60
        }}>
            <Icon name="alert-circle" size={64} color={theme.colors.danger} />
            <Text style={{
                fontSize: 16,
                fontWeight: '600',
                color: theme.colors.text,
                marginTop: 16,
                marginBottom: 8
            }}>
                Something went wrong
            </Text>
            <Text style={{
                fontSize: 12,
                color: theme.colors.muted,
                textAlign: 'center',
                lineHeight: 20,
                marginBottom: 24
            }}>
                Failed to load your orders. Please try again.
            </Text>
            <Pressable
                onPress={() => {
                    showAlert({
                        title: 'Retry Loading Orders',
                        message: 'Are you sure you want to retry loading your orders?',
                        type: 'info',
                        confirmText: 'Retry',
                        cancelText: 'Cancel',
                        showCancel: true,
                        onConfirm: () => {
                            hideAlert();
                            handleRefresh();
                        },
                        onCancel: hideAlert
                    });
                }}
            >
                <View style={{
                    backgroundColor: theme.colors.primary + '15',
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    borderRadius: 12
                }}>
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: theme.colors.primary
                    }}>
                        Retry
                    </Text>
                </View>
            </Pressable>
        </View>
    );

    return (
        <SafeAreaWrapper 
            edges={["top"]} // Only apply top padding
            backgroundColor={theme.colors.background}
            statusBarStyle='light'
        >
            <View style={{ flex: 1, marginTop: -16 }}>
                {/*  ENHANCED: Filter Tabs with better labels */}
                <View style={{ 
                    flexDirection: 'row', 
                    paddingHorizontal: 16, 
                    paddingBottom: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border
                }}>
                    {([
                        { key: 'all', label: 'All Orders' },
                        { key: 'active', label: 'Active' },
                        { key: 'past', label: 'Past' }
                    ] as const).map((tab) => (
                        <Pressable
                            key={tab.key}
                            onPress={() => handleFilterChange(tab.key)}
                            style={{
                                flex: 1,
                                paddingVertical: 8,
                                paddingHorizontal: 16,
                                borderRadius: 20,
                                backgroundColor: filter === tab.key ? theme.colors.primary : 'transparent',
                                marginHorizontal: 4
                            }}
                        >
                            <Text style={{
                                fontSize: 12,
                                fontWeight: '600',
                                color: filter === tab.key ? 'white' : theme.colors.muted,
                                textAlign: 'center'
                            }}>
                                {tab.label}
                            </Text>
                        </Pressable>
                    ))}
                </View>

                {/* Orders List */}
                {error ? (
                    renderErrorState()
                ) : (
                    <FlatList
                        data={orders}
                        renderItem={renderOrderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ flexGrow: 1, marginTop: 16, paddingBottom: 50 }}
                        refreshControl={
                            <RefreshControl
                                refreshing={isRefreshing}
                                onRefresh={handleRefresh}
                                tintColor={theme.colors.primary}
                            />
                        }
                        ListEmptyComponent={!isLoading ? renderEmptyState : null}
                        showsVerticalScrollIndicator={false}
                    />
                )}

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