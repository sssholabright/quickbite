import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaWrapper } from '../../ui/SafeAreaWrapper';
import { useTheme } from '../../theme/theme';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { AppTabParamList } from '../../navigation/types';
import { Icon } from '../../ui/Icon';
import { useOrders } from '../../hooks/useOrders';
import OrderCard from '../../ui/OrderCard';
import AlertModal from '../../ui/AlertModal';

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

    // Build filters for API
    const apiFilters = {
        ...(filter === 'active' && { status: 'PENDING,CONFIRMED,PREPARING,READY_FOR_PICKUP,PICKED_UP,OUT_FOR_DELIVERY' }),
        ...(filter === 'past' && { status: 'DELIVERED,CANCELLED' }),
        page: 1,
        limit: 50
    };

    const { data: ordersData, isLoading, error, refetch } = useOrders(apiFilters);

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

    const renderOrderItem = ({ item }: { item: any }) => (
        <OrderCard 
            order={{
                id: item.id,
                orderId: item.orderNumber,
                vendor: {
                    id: item.vendor.id,
                    name: item.vendor.businessName,
                    logo: undefined,
                    location: item.vendor.address
                },
                items: item.items.map((orderItem: any) => ({
                    id: orderItem.id,
                    name: orderItem.menuItem.name,
                    price: orderItem.unitPrice,
                    quantity: orderItem.quantity,
                    image: orderItem.menuItem.image
                })),
                status: item.status.toLowerCase().replace('_', ' '),
                total: item.pricing.total,
                subtotal: item.pricing.subtotal,
                fees: item.pricing.deliveryFee + item.pricing.serviceFee,
                paymentMethod: 'cash' as const,
                paymentStatus: 'paid' as const,
                notes: item.specialInstructions,
                pickupTime: 'asap',
                placedAt: new Date(item.createdAt),
                estimatedReadyAt: item.estimatedDeliveryTime ? new Date(item.estimatedDeliveryTime) : undefined
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
                fontSize: 18,
                fontWeight: '600',
                color: theme.colors.text,
                marginTop: 16,
                marginBottom: 8
            }}>
                No orders yet
            </Text>
            <Text style={{
                fontSize: 14,
                color: theme.colors.muted,
                textAlign: 'center',
                lineHeight: 20
            }}>
                {filter === 'active' 
                    ? "You don't have any active orders at the moment."
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
                fontSize: 18,
                fontWeight: '600',
                color: theme.colors.text,
                marginTop: 16,
                marginBottom: 8
            }}>
                Something went wrong
            </Text>
            <Text style={{
                fontSize: 14,
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
                        fontSize: 16,
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
        <SafeAreaWrapper>
            <View style={{ flex: 1 }}>
                {/* Header */}
                <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    paddingHorizontal: 16, 
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border
                }}>
                    <Pressable onPress={() => navigation.goBack()}>
                        <Icon name="arrow-left" size={24} color={theme.colors.text} />
                    </Pressable>
                    <Text style={{ 
                        fontSize: 18, 
                        fontWeight: '700', 
                        color: theme.colors.text,
                        marginLeft: 12
                    }}>
                        My Orders
                    </Text>
                </View>

                {/* Filter Tabs */}
                <View style={{ 
                    flexDirection: 'row', 
                    paddingHorizontal: 16, 
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border
                }}>
                    {(['all', 'active', 'past'] as const).map((tab) => (
                        <Pressable
                            key={tab}
                            onPress={() => handleFilterChange(tab)}
                            style={{
                                flex: 1,
                                paddingVertical: 8,
                                paddingHorizontal: 16,
                                borderRadius: 20,
                                backgroundColor: filter === tab ? theme.colors.primary : 'transparent',
                                marginHorizontal: 4
                            }}
                        >
                            <Text style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: filter === tab ? 'white' : theme.colors.muted,
                                textAlign: 'center',
                                textTransform: 'capitalize'
                            }}>
                                {tab}
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
                        contentContainerStyle={{ flexGrow: 1 }}
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