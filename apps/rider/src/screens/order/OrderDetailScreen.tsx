import React, { useCallback, useEffect, useState } from "react";
import { Linking, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../theme/theme";
import { SafeAreaWrapper } from "../../ui/SafeAreaWrapper";
import { Icon } from "../../ui/Icon";
import { CTAButton } from "../../ui/CTAButton";
import type { RootStackParamList } from "../../navigation/types";
import type { RouteProp } from "@react-navigation/native";
import riderService from "../../services/riderService";
import { useSocket } from "../../hooks/useSocket";
import { useOrderStore } from "../../stores/order"; 
import AlertModal from '../../ui/AlertModal'; 

type OrderDetailRouteProp = RouteProp<RootStackParamList, 'OrderDetail'>;
type OrderDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'OrderDetail'>;

export default function OrderDetailScreen() {
    const theme = useTheme();
    const navigation = useNavigation<OrderDetailNavigationProp>();
    const route = useRoute<OrderDetailRouteProp>();
    const { order, orderStatus, onStatusChange } = route.params || {};
    
    const { activeOrder, orderStatus: storeOrderStatus, setOrderStatus, clearActiveOrder } = useOrderStore();
    
    const currentOrder = activeOrder || order;
    const [currentStatus, setCurrentStatus] = useState<'going_to_pickup' | 'picked_up' | 'delivering' | 'delivered'>(
        storeOrderStatus || orderStatus || 'going_to_pickup'
    );  


    const [isLoading, setIsLoading] = useState(false);

    const { socket, joinOrderRoom, leaveOrderRoom } = useSocket();

    const [alertModal, setAlertModal] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info' as 'success' | 'error' | 'warning' | 'info',
        onConfirm: () => {},
        onCancel: undefined as (() => void) | undefined,
        confirmText: 'OK',
        cancelText: 'Cancel',
        showCancel: false
    });

    const showAlert = useCallback((
        title: string,
        message: string,
        type: 'success' | 'error' | 'warning' | 'info' = 'info',
        onConfirm: () => void = () => {},
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
            onConfirm: () => {
                setAlertModal(prev => ({ ...prev, visible: false }));
                onConfirm();
            },
            onCancel: onCancel ? () => {
                setAlertModal(prev => ({ ...prev, visible: false }));
                onCancel();
            } : undefined,
            confirmText,
            cancelText,
            showCancel
        });
    }, []);

    useEffect(() => {
        if (currentOrder?.id && socket) {
            joinOrderRoom(currentOrder.id);
            return () => {
                leaveOrderRoom(currentOrder.id);
            };
        }
    }, [currentOrder?.id, socket, joinOrderRoom, leaveOrderRoom]);

    
    useEffect(() => {
        console.log('currentOrder', currentOrder);
    }, [currentOrder]);

    const navigateToVendor = useCallback(() => {
        if (!currentOrder?.vendor.lat || !currentOrder?.vendor.lng) {
            showAlert("Location Error", "Vendor location not available", 'error');
            return;
        }
        
        const url = Platform.select({
            ios: `http://maps.apple.com/?ll=${currentOrder.vendor.lat},${currentOrder.vendor.lng}&q=${encodeURIComponent(currentOrder.vendor.name)}`,
            android: `google.navigation:q=${currentOrder.vendor.lat},${currentOrder.vendor.lng}&mode=d`
        });
        
        if (url) {
            Linking.openURL(url).catch(() => showAlert("Navigation Error", "Unable to open navigation", 'error'));
        }
    }, [currentOrder, showAlert]);

    const navigateToCustomer = useCallback(() => {
        if (!currentOrder?.dropoffLat || !currentOrder?.dropoffLng) {
            showAlert("Location Error", "Customer location not available", 'error');
            return;
        }
        
        const url = Platform.select({
            ios: `http://maps.apple.com/?ll=${currentOrder.dropoffLat},${currentOrder.dropoffLng}&q=${encodeURIComponent('Delivery Address')}`,
            android: `google.navigation:q=${currentOrder.dropoffLat},${currentOrder.dropoffLng}&mode=d`
        });
        
        if (url) {
            Linking.openURL(url).catch(() => showAlert("Navigation Error", "Unable to open navigation", 'error'));
        }
    }, [currentOrder, showAlert]);

    const callVendor = useCallback(() => {
        const url = `tel:${currentOrder?.vendor.phone}`;
        Linking.openURL(url).catch(() => showAlert("Call Error", "Unable to start call", 'error'));
    }, [currentOrder?.vendor.phone, showAlert]);

    const callCustomer = useCallback(() => {
        if (!currentOrder?.customerPhone) {
            showAlert("No Phone", "Customer phone number not available", 'warning');
            return;
        }
        const url = `tel:${currentOrder.customerPhone}`;
        Linking.openURL(url).catch(() => showAlert("Call Error", "Unable to start call", 'error'));
    }, [currentOrder, showAlert]);

    // 🚀 FIXED: Mark as picked up with proper cancel function
    const markAsPickedUp = useCallback(async () => {
        if (!currentOrder?.id) return;

        showAlert(
            "Mark as Picked Up",
            "Confirm you have collected the order from the vendor?",
            'warning',
            async () => {
                try {
                    setIsLoading(true);
                    
                    await riderService.markOrderPickedUp(currentOrder.id);
                    
                    setOrderStatus('picked_up');
                    setCurrentStatus('picked_up');
                    onStatusChange?.('picked_up');
                    
                    showAlert("Order Collected", "Navigate to customer for delivery.", 'success');
                } catch (error: any) {
                    console.error('Failed to mark order as picked up:', error);
                    showAlert("Error", error.message || "Failed to update order status", 'error');
                } finally {
                    setIsLoading(false);
                }
            },
            () => {
                // 🚀 FIXED: Cancel function - just close the modal
                console.log('User cancelled mark as picked up');
            },
            'Confirm',
            'Cancel',
            true
        );
    }, [currentOrder?.id, onStatusChange, setOrderStatus, showAlert]);

    // 🚀 FIXED: Mark as delivered with proper cancel function
    const markAsDelivered = useCallback(async () => {
        if (!currentOrder?.id) return;

        showAlert(
            "Mark as Delivered",
            "Confirm you have delivered the order to the customer?",
            'warning',
            async () => {
                try {
                    setIsLoading(true);
                    
                    await riderService.markOrderDelivered(currentOrder.id);
                    
                    setOrderStatus('delivered');
                    setCurrentStatus('delivered');
                    onStatusChange?.('delivered');
                    
                    showAlert("Order Delivered", "Thank you for completing the delivery!", 'success');
                    
                    clearActiveOrder();
                    setTimeout(() => {
                        navigation.goBack();
                    }, 1500);
                } catch (error: any) {
                    console.error('Failed to mark order as delivered:', error);
                    showAlert("Error", error.message || "Failed to update order status", 'error');
                } finally {
                    setIsLoading(false);
                }
            },
            () => {
                // 🚀 FIXED: Cancel function - just close the modal
                console.log('User cancelled mark as delivered');
            },
            'Confirm',
            'Cancel',
            true
        );
    }, [currentOrder?.id, onStatusChange, setOrderStatus, clearActiveOrder, navigation, showAlert]);

    // 🚀 FIXED: Cancel order with proper cancel function
    const cancelOrder = useCallback(async () => {
        if (!currentOrder?.id) return;

        if (currentStatus !== 'going_to_pickup') {
            showAlert(
                "Cannot Cancel", 
                "Order cannot be cancelled after pickup. Please complete the delivery.",
                'warning'
            );
            return;
        }

        showAlert(
            "Cancel Order",
            "Are you sure you want to cancel this order? This action cannot be undone.",
            'error',
            async () => {
                try {
                    setIsLoading(true);
                    
                    await riderService.cancelOrder(currentOrder.id, 'Rider cancelled order');
                    
                    clearActiveOrder();
                    onStatusChange?.('cancelled');
                    showAlert("Order Cancelled", "Order has been cancelled and reassigned.", 'info');
                    navigation.goBack();
                } catch (error: any) {
                    console.error('Failed to cancel order:', error);
                    showAlert("Error", error.message || "Failed to cancel order", 'error');
                } finally {
                    setIsLoading(false);
                }
            },
            () => {
                // 🚀 FIXED: Cancel function - just close the modal
                console.log('User cancelled order cancellation');
            },
            'Cancel Order',
            'Keep Order',
            true
        );
    }, [currentOrder?.id, navigation, currentStatus, onStatusChange, clearActiveOrder, showAlert]);

    const progressSteps = [
        { key: 'pickup', label: 'Pickup', completed: currentStatus !== 'going_to_pickup' },
        { key: 'delivering', label: 'Delivering', completed: currentStatus === 'delivered' },
        { key: 'delivered', label: 'Delivered', completed: currentStatus === 'delivered' }
    ];

    if (!currentOrder) {
        return (
            <SafeAreaWrapper>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ fontSize: 18, color: theme.colors.text }}>Order not found</Text>
                </View>
            </SafeAreaWrapper>
        );
    }

    return (
        <SafeAreaWrapper>
            <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                {/* Header */}
                <View style={{
                    backgroundColor: theme.colors.surface,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}>
                    <Pressable onPress={() => navigation.goBack()} style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: theme.colors.background,
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <Icon name="arrow-back" size={20} color={theme.colors.text} />
                    </Pressable>

                    <View style={{ alignItems: "center", flex: 1 }}>
                        <Text style={{ fontSize: 12, color: theme.colors.muted }}>
                            Order #{currentOrder.id.slice(-6)}
                        </Text>
                        <Text style={{ fontSize: 16, fontWeight: "700", color: theme.colors.text }}>
                            {currentStatus === 'going_to_pickup' ? 'Go to Vendor' :
                             	currentStatus === 'picked_up' ? 'Picked Up' :
								currentStatus === 'delivering' ? 'Delivering' : 'Delivered'}
                        </Text>
                    </View>

                    <Pressable 
                        onPress={currentStatus === 'going_to_pickup' ? cancelOrder : undefined} 
                        disabled={currentStatus !== 'going_to_pickup' || isLoading}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: theme.colors.background,
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: currentStatus === 'going_to_pickup' && !isLoading ? 1 : 0.3
                        }}
                    >
                        <Icon name="close" size={20} color={currentStatus === 'going_to_pickup' && !isLoading ? theme.colors.muted : theme.colors.border} />
                    </Pressable>
                </View>

                {/* Progress Bar */}
                <View style={{
                    backgroundColor: theme.colors.surface,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border
                }}>
                    <View style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center"
                    }}>
                        {progressSteps.map((step, index) => (
                            <React.Fragment key={step.key}>
                                <View style={{
                                    alignItems: "center",
                                    flex: 1
                                }}>
                                    <View style={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: 16,
                                        backgroundColor: step.completed ? '#10b981' : theme.colors.background,
                                        borderWidth: 2,
                                        borderColor: step.completed ? '#10b981' : theme.colors.border,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        marginBottom: 8
                                    }}>
                                        {step.completed ? (
                                            <Icon name="checkmark" size={16} color="white" />
                                        ) : (
                                            <Text style={{
                                                fontSize: 12,
                                                fontWeight: "700",
                                                color: theme.colors.muted
                                            }}>
                                                {index + 1}
                                            </Text>
                                        )}
                                    </View>
                                    <Text style={{
                                        fontSize: 12,
                                        fontWeight: "600",
                                        color: step.completed ? '#10b981' : theme.colors.muted,
                                        textAlign: "center"
                                    }}>
                                        {step.label}
                                    </Text>
                                </View>
                                {index < progressSteps.length - 1 && (
                                    <View style={{
                                        flex: 1,
                                        height: 2,
                                        backgroundColor: progressSteps[index + 1].completed ? '#10b981' : theme.colors.border,
                                        marginHorizontal: 8
                                    }} />
                                )}
                            </React.Fragment>
                        ))}
                    </View>
                </View>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
                    {/* Vendor Section (Pickup Info) */}
                    <View style={{
                        backgroundColor: theme.colors.surface,
                        borderRadius: 16,
                        padding: 20,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        opacity: currentStatus === 'going_to_pickup' ? 1 : 0.5,
                        shadowColor: "#000",
                        shadowOpacity: 0.05,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 2
                    }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                            <View style={{
                                width: 35,
                                height: 35,
                                borderRadius: 10,
                                backgroundColor: theme.colors.background,
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 12
                            }}>
                                <Icon name="restaurant" size={20} color={theme.colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontWeight: "700", color: theme.colors.text }}>
                                    {currentOrder.vendor.name}
                                </Text>
                                <Text style={{ fontSize: 12, color: theme.colors.muted }}>
                                    Pickup Location
                                </Text>
                            </View>
                        </View>

                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 12, color: theme.colors.muted, marginBottom: 4 }}>
                                📍 Address
                            </Text>
                            <Text style={{ fontSize: 12, color: theme.colors.text, lineHeight: 22 }}>
                                {currentOrder.vendor.pickupLocation}
                            </Text>
                        </View>

                        <View style={{ flexDirection: "row", gap: 12 }}>
                            <Pressable 
                                onPress={currentStatus === 'going_to_pickup' ? navigateToVendor : undefined} 
                                disabled={currentStatus !== 'going_to_pickup'}
                                style={{
                                    flex: 1,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: currentStatus === 'going_to_pickup' ? '#007AFF' : theme.colors.border,
                                    paddingVertical: 8,
                                    borderRadius: 10
                                }}
                            >
                                <Icon name="navigate" size={16} color={currentStatus === 'going_to_pickup' ? "white" : theme.colors.muted} />
                                <Text style={{ 
                                    marginLeft: 6, 
                                    color: currentStatus === 'going_to_pickup' ? "white" : theme.colors.muted, 
                                    fontWeight: "600" 
                                }}>
                                    Navigate
                                </Text>
                            </Pressable>

                            <Pressable 
                                onPress={currentStatus === 'going_to_pickup' ? callVendor : undefined} 
                                disabled={currentStatus !== 'going_to_pickup'}
                                style={{
                                    width: 35,
                                    height: 35,
                                    borderRadius: 10,
                                    backgroundColor: currentStatus === 'going_to_pickup' ? theme.colors.background : theme.colors.border,
                                    borderWidth: 1,
                                    borderColor: currentStatus === 'going_to_pickup' ? theme.colors.border : theme.colors.muted,
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            >
                                <Icon name="call" size={16} color={currentStatus === 'going_to_pickup' ? theme.colors.primary : theme.colors.muted} />
                            </Pressable>
                        </View>
                    </View>

                    {/* Customer Section (Drop-off Info) */}
                    <View style={{
                        backgroundColor: theme.colors.surface,
                        borderRadius: 16,
                        padding: 20,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        opacity: currentStatus === 'going_to_pickup' ? 0.5 : 1,
                        shadowColor: "#000",
                        shadowOpacity: 0.05,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 2
                    }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                            <View style={{
                                width: 35,
                                height: 35,
                                borderRadius: 10,
                                backgroundColor: '#ef4444' + '15',
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 12
                            }}>
                                <Icon name="person" size={20} color="#ef4444" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontWeight: "700", color: theme.colors.text }}>
                                    {currentOrder.customerName || 'Customer'}
                                </Text>
                                <Text style={{ fontSize: 12, color: theme.colors.muted }}>
                                    Delivery Address
                                </Text>
                            </View>
                        </View>

                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 12, color: theme.colors.muted, marginBottom: 4 }}>
                                📍 Address
                            </Text>
                            <Text style={{ fontSize: 12, color: theme.colors.text, lineHeight: 22 }}>
                                {currentOrder.dropoffAddress}
                            </Text>
                        </View>

                        <View style={{ flexDirection: "row", gap: 12 }}>
                            <Pressable 
                                onPress={currentStatus !== 'going_to_pickup' ? navigateToCustomer : undefined} 
                                disabled={currentStatus === 'going_to_pickup'}
                                style={{
                                    flex: 1,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    backgroundColor: currentStatus !== 'going_to_pickup' ? '#007AFF' : theme.colors.border,
                                    paddingVertical: 8,
                                    borderRadius: 12
                                }}
                            >
                                <Icon name="navigate" size={16} color={currentStatus !== 'going_to_pickup' ? "white" : theme.colors.muted} />
                                <Text style={{ 
                                    marginLeft: 6, 
                                    color: currentStatus !== 'going_to_pickup' ? "white" : theme.colors.muted, 
                                    fontWeight: "600" 
                                }}>
                                    Navigate
                                </Text>
                            </Pressable>

                            <Pressable 
                                onPress={currentStatus !== 'going_to_pickup' ? callCustomer : undefined} 
                                disabled={currentStatus === 'going_to_pickup'}
                                style={{
                                    width: 35,
                                    height: 35,
                                    borderRadius: 10,
                                    backgroundColor: currentStatus !== 'going_to_pickup' ? theme.colors.background : theme.colors.border,
                                    borderWidth: 1,
                                    borderColor: currentStatus !== 'going_to_pickup' ? theme.colors.border : theme.colors.muted,
                                    alignItems: "center",
                                    justifyContent: "center"
                                }}
                            >
                                <Icon name="call" size={16} color={currentStatus !== 'going_to_pickup' ? theme.colors.primary : theme.colors.muted} />
                            </Pressable>
                        </View>
                    </View>

                    {/* Order Details (Expandable Card) */}
                    <View style={{
                        backgroundColor: theme.colors.surface,
                        borderRadius: 16,
                        padding: 20,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        shadowColor: "#000",
                        shadowOpacity: 0.05,
                        shadowRadius: 8,
                        shadowOffset: { width: 0, height: 2 },
                        elevation: 2
                    }}>
                        <Text style={{ fontSize: 16, fontWeight: "700", color: theme.colors.text, marginBottom: 16 }}>
                            Order Details
                        </Text>

                        {/* Items */}
                        <View style={{ marginBottom: 16 }}>
                            <Text style={{ fontSize: 12, color: theme.colors.muted, marginBottom: 8 }}>
                                Items ({currentOrder.items.length})
                            </Text>
                            {currentOrder.items.map((item, index) => (
                                <View key={index} style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    paddingVertical: 4
                                }}>
                                    <Text style={{ fontSize: 12, color: theme.colors.text }}>
                                        {item.quantity}x {item.name}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Payment Info */}
                        <View style={{
                            backgroundColor: theme.colors.background,
                            borderRadius: 12,
                            padding: 16,
                            alignItems: "center"
                        }}>
                            <Text style={{ fontSize: 12, color: theme.colors.muted, marginBottom: 4 }}>
                                Payment Method
                            </Text>
                            <Text style={{ fontSize: 14, fontWeight: "700", color: theme.colors.text }}>
                                Cash on Delivery
                            </Text>
                            <Text style={{ fontSize: 18, fontWeight: "800", color: theme.colors.primary, marginTop: 4 }}>
                                ₦{(currentOrder.payout || 0).toLocaleString()}
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Bottom Action Bar */}
                <View style={{
                    backgroundColor: theme.colors.surface,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border,
                    shadowColor: "#000",
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: -2 },
                    elevation: 8
                }}>
                    {currentStatus === 'going_to_pickup' && (
                        <View style={{ gap: 12 }}>
                            <CTAButton
                                title={isLoading ? "Updating..." : "Mark as Picked Up"}
                                onPress={markAsPickedUp}
                                disabled={isLoading}
                            />
                            <Pressable
                                onPress={cancelOrder}
                                disabled={isLoading}
                                style={{
                                    paddingVertical: 8,
                                    borderRadius: 12,
                                    backgroundColor: theme.colors.background,
                                    borderWidth: 1,
                                    borderColor: '#ef4444',
                                    alignItems: "center",
                                    opacity: isLoading ? 0.5 : 1
                                }}
                            >
                                <Text style={{ color: '#ef4444', fontWeight: "600" }}>
                                    {isLoading ? "Cancelling..." : "Cancel Order"}
                                </Text>
                            </Pressable>
                        </View>
                    )}
                    
                    {(currentStatus === 'picked_up' || currentStatus === 'delivering') && (
                        <CTAButton
                            title={isLoading ? "Updating..." : "Mark as Delivered"}
                            onPress={markAsDelivered}
                            disabled={isLoading}
                        />
                    )}
                    
                    {currentStatus === 'delivered' && (
                        <View style={{ alignItems: "center", paddingVertical: 12 }}>
                            <Icon name="checkmark-circle" size={40} color="#10b981" />
                            <Text style={{ fontSize: 14, fontWeight: "600", color: "#10b981", marginTop: 8 }}>
                                Order Completed!
                            </Text>
                        </View>
                    )}
                </View>

                {/* 🚀 NEW: Custom Alert Modal */}
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
            </View>
        </SafeAreaWrapper>
    );
}