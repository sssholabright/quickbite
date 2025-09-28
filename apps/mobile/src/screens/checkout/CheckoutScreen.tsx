import React, { useMemo, useState, useEffect } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, Text, View, Linking, Image } from 'react-native'
import { SafeAreaWrapper } from '../../ui/SafeAreaWrapper'
import { useTheme } from '../../theme/theme'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { Icon } from '../../ui/Icon'
import { ScrollView } from 'react-native'
import { CTAButton } from '../../ui/CTAButton'
import { TextInput } from 'react-native'
import * as Location from 'expo-location';
import { useCartStore } from '../../stores/cart';
import { useVendors } from '../../hooks/useMenu';
import { useCreateOrder } from '../../hooks/useOrders';
import AlertModal from '../../ui/AlertModal';

type CheckoutScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Checkout'>;
type CheckoutRouteProp = RouteProp<RootStackParamList, 'Checkout'>;

interface DeliveryAddress {
    id: string;
    name: string;
    address: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    isCurrentLocation?: boolean;
}

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

export default function CheckoutScreen() {
    const theme = useTheme()
    const navigation = useNavigation<CheckoutScreenNavigationProp>();
    const route = useRoute<CheckoutRouteProp>();
    const { vendorId } = route.params;

    // Update cart store usage
    const { 
        getItemsList, 
        getSubtotal,
        getItemTotal,
        clearCart
    } = useCartStore();

    // Get vendor data from API
    const { data: vendors = [] } = useVendors();
    const vendor = vendors.find(v => v.id === vendorId) || vendors[0];

    // Order creation mutation
    const createOrderMutation = useCreateOrder();

    // State for delivery address
    const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
        id: 'current',
        name: 'Current Location',
        address: 'Getting your location...',
        isCurrentLocation: true
    });

    // 🚀 NEW: State for editable address
    const [editableAddress, setEditableAddress] = useState('');

    // State for special instructions
    const [specialInstructions, setSpecialInstructions] = useState('');

    // Alert modal state
    const [alert, setAlert] = useState<AlertState>({
        visible: false,
        title: '',
        message: '',
        type: 'info'
    });

    // Update editable address when delivery address changes
    useEffect(() => {
        if (deliveryAddress.address && deliveryAddress.address !== 'Getting your location...') {
            setEditableAddress(deliveryAddress.address);
        }
    }, [deliveryAddress.address]);

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

    // Get current location
    useEffect(() => {
        getCurrentLocation();
    }, []);

    const getCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showAlert({
                    title: 'Permission Required',
                    message: 'Location permission is required for delivery. Please enable location access in your device settings.',
                    type: 'warning',
                    confirmText: 'OK',
                    onConfirm: () => {
                        hideAlert();
                        Linking.openSettings();
                    },
                    showCancel: true,
                    cancelText: 'Cancel',
                    onCancel: hideAlert
                });
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;

            // Reverse geocoding to get address
            const addressResponse = await Location.reverseGeocodeAsync({
                latitude,
                longitude
            });

            if (addressResponse.length > 0) {
                const address = addressResponse[0];
                const fullAddress = `${address.street || ''} ${address.streetNumber || ''}, ${address.city || ''}, ${address.region || ''}`.trim();
                
                setDeliveryAddress({
                    id: 'current',
                    name: 'Current Location',
                    address: fullAddress || 'Current Location',
                    coordinates: { latitude, longitude },
                    isCurrentLocation: true
                });
            }
        } catch (error) {
            console.error('Error getting location:', error);
            showAlert({
                title: 'Location Error',
                message: 'Could not get your current location. Please check your location settings and try again.',
                type: 'error',
                confirmText: 'OK',
                onConfirm: hideAlert
            });
        }
    };

    // Calculate totals
    const cartItems = getItemsList();
    const subtotal = getSubtotal();
    const deliveryFee = 200; // ₦2.00 in kobo
    const serviceFee = 50; // ₦0.50 service fee
    const total = subtotal + deliveryFee + serviceFee;

    const formatNaira = (amount: number): string => {
        return `₦${amount.toLocaleString('en-NG')}`
    }

    // Format order data for API
    const formatOrderData = () => {
        const orderItems = cartItems.map(cartItem => {
            // Convert cart add-ons to API format
            const addOns = Object.entries(cartItem.addOns || {})
                .filter(([_, quantity]) => quantity > 0)
                .map(([addOnId, quantity]) => ({
                    addOnId,
                    quantity
                }));

            return {
                menuItemId: cartItem.id,
                quantity: cartItem.quantity,
                serviceFee: serviceFee,
                addOns: addOns.length > 0 ? addOns : undefined
            };
        });

        return {
            vendorId: vendorId,
            items: orderItems,
            deliveryAddress: {
                label: deliveryAddress.name,
                address: editableAddress.trim() || deliveryAddress.address, // 🚀 FIX: Use editable address
                city: 'null', // You might want to extract this from the address
                state: 'null',
                coordinates: {
                    lat: deliveryAddress.coordinates?.latitude || 0,
                    lng: deliveryAddress.coordinates?.longitude || 0
                }
            },
            specialInstructions: specialInstructions.trim() || undefined
        };
    };

    // Handle order placement
    const handlePlaceOrder = async () => {
        if (!deliveryAddress.coordinates) {
            showAlert({
                title: 'Location Required',
                message: 'Please wait for your location to be detected or select a delivery address.',
                type: 'warning',
                confirmText: 'OK',
                onConfirm: hideAlert
            });
            return;
        }

        if (!editableAddress.trim()) {
            showAlert({
                title: 'Address Required',
                message: 'Please enter your delivery address.',
                type: 'warning',
                confirmText: 'OK',
                onConfirm: hideAlert
            });
            return;
        }

        if (cartItems.length === 0) {
            showAlert({
                title: 'Empty Cart',
                message: 'Your cart is empty. Please add some items before placing an order.',
                type: 'warning',
                confirmText: 'OK',
                onConfirm: hideAlert
            });
            return;
        }

        // Show confirmation dialog
        showAlert({
            title: 'Confirm Order',
            message: `Are you sure you want to place this order for ${formatNaira(total)}?`,
            type: 'info',
            confirmText: 'Place Order',
            cancelText: 'Cancel',
            showCancel: true,
            onConfirm: async () => {
                hideAlert();
                await placeOrder();
            },
            onCancel: hideAlert
        });
    };

    // Place the actual order
    const placeOrder = async () => {
        try {
            const orderData = formatOrderData();
            const order = await createOrderMutation.mutateAsync(orderData);
            
            // Clear cart after successful order
            clearCart();
            
            // Show success message
            showAlert({
                title: 'Order Placed Successfully!',
                message: `Your order ${order.orderNumber} has been placed. We'll notify you when it's ready.`,
                type: 'success',
                confirmText: 'View Order',
                onConfirm: () => {
                    hideAlert();
                    navigation.replace('OrderConfirmation', {
                        orderId: order.id,
                        pickupCode: order.orderNumber, // Use orderNumber as pickupCode if that's expected
                        vendor: {
                            id: order.vendor.id,
                            name: order.vendor.businessName
                        },
                        items: order.items,
                        total: total
                    });
                }
            });
        } catch (error: any) {
            console.error('Error placing order:', error);
            const errorMessage = error.response?.data?.message || 'Failed to place order. Please try again.';
            
            showAlert({
                title: 'Order Failed',
                message: errorMessage,
                type: 'error',
                confirmText: 'Try Again',
                cancelText: 'Cancel',
                showCancel: true,
                onConfirm: () => {
                    hideAlert();
                    handlePlaceOrder();
                },
                onCancel: hideAlert
            });
        }
    };

    const renderCartItem = (item: any) => {
        const itemTotal = getItemTotal(item.id);

        return (
            <View key={item.id} style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border
            }}>
                <View style={{ 
                    width: 60, 
                    height: 60, 
                    borderRadius: 8, 
                    backgroundColor: theme.colors.border,
                    marginRight: 12,
                    overflow: 'hidden'
                }}>
                    {item.image && (
                        <Image 
                            source={{ uri: item.image }} 
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                        />
                    )}
                </View>
                
                <View style={{ flex: 1 }}>
                    <Text style={{ 
                        fontSize: 14, 
                        fontWeight: '600', 
                        color: theme.colors.text,
                        marginBottom: 4
                    }}>
                        {item.name}
                    </Text>
                    
                    <Text style={{ 
                        fontSize: 12, 
                        color: theme.colors.muted,
                        marginBottom: 4
                    }}>
                        Qty: {item.quantity}
                    </Text>

                    {/* Display add-ons */}
                    {item.addOns && Object.keys(item.addOns).length > 0 && (
                        <View style={{ marginTop: 4 }}>
                            {Object.entries(item.addOns).map(([addOnId, quantity]: [string, any]) => {
                                if (quantity <= 0) return null;
                                const addOnDetail = item.addOnDetails?.[addOnId];
                                if (!addOnDetail) return null;
                                
                                return (
                                    <Text key={addOnId} style={{ 
                                        fontSize: 10, 
                                        color: theme.colors.muted,
                                        marginBottom: 2
                                    }}>
                                        + {addOnDetail.name} x{quantity} ({formatNaira(addOnDetail.price * quantity)})
                                    </Text>
                                );
                            })}
                        </View>
                    )}
                </View>
                
                <Text style={{ 
                    fontSize: 14, 
                    fontWeight: '700', 
                    color: theme.colors.text
                }}>
                    {formatNaira(itemTotal)}
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaWrapper>
            <KeyboardAvoidingView 
                style={{ flex: 1 }} 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
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
                        <Icon name="arrow-left" size={20} color={theme.colors.text} />
                    </Pressable>
                    <Text style={{ 
                        fontSize: 16, 
                        fontWeight: '700', 
                        color: theme.colors.text,
                        marginLeft: 6
                    }}>
                        Checkout
                    </Text>
                </View>

                <ScrollView style={{ flex: 1 }}>
                    {/* Delivery Address */}
                    <View style={{ padding: 16 }}>
                        <Text style={{ 
                            fontSize: 14, 
                            fontWeight: '600', 
                            color: theme.colors.text,
                            marginBottom: 12
                        }}>
                            Delivery Address
                        </Text>
                        
                        <View style={{ 
                            backgroundColor: theme.colors.background,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            borderRadius: 12,
                            padding: 16
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                <Icon name="map-pin" size={16} color={theme.colors.primary} />
                                <Text style={{ 
                                    fontSize: 12, 
                                    fontWeight: '600', 
                                    color: theme.colors.text,
                                    marginLeft: 8
                                }}>
                                    {deliveryAddress.name}
                                </Text>
                            </View>
                            
                            {/* 🚀 NEW: Editable Address Input */}
                            <TextInput
                                style={{
                                    backgroundColor: theme.colors.surface,
                                    borderWidth: 1,
                                    borderColor: theme.colors.border,
                                    borderRadius: 8,
                                    padding: 12,
                                    fontSize: 12,
                                    color: theme.colors.text,
                                    marginLeft: 28,
                                    marginTop: 8,
                                    minHeight: 40,
                                }}
                                placeholder="Enter your delivery address"
                                placeholderTextColor={theme.colors.muted}
                                value={editableAddress}
                                onChangeText={setEditableAddress}
                                multiline
                                numberOfLines={2}
                            />
                            
                            {/* 🚀 NEW: Location Info */}
                            <View style={{ 
                                flexDirection: 'row', 
                                alignItems: 'center', 
                                marginTop: 8,
                                marginLeft: 28
                            }}>
                                <Icon name="info" size={12} color={theme.colors.muted} />
                                <Text style={{ 
                                    fontSize: 10, 
                                    color: theme.colors.muted,
                                    marginLeft: 4,
                                    flex: 1
                                }}>
                                    Location coordinates will be used for delivery tracking
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Order Summary */}
                    <View style={{ padding: 16 }}>
                        <Text style={{ 
                            fontSize: 14, 
                            fontWeight: '600', 
                            color: theme.colors.text,
                            marginBottom: 12
                        }}>
                            Order Summary
                        </Text>

                        <View style={{ 
                            backgroundColor: theme.colors.background,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            borderRadius: 12,
                            padding: 16
                        }}>
                            {cartItems.map(renderCartItem)}
                        </View>
                    </View>

                    {/* Special Instructions */}
                    <View style={{ padding: 16 }}>
                        <Text style={{ 
                            fontSize: 14, 
                            fontWeight: '600', 
                            color: theme.colors.text,
                            marginBottom: 12
                        }}>
                            Special Instructions
                        </Text>
                        
                        <TextInput
                            style={{
                                backgroundColor: theme.colors.background,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                                borderRadius: 12,
                                padding: 16,
                                fontSize: 12,
                                color: theme.colors.text,
                                minHeight: 80,
                                textAlignVertical: 'top'
                            }}
                            placeholder="Any special instructions for your order?"
                            placeholderTextColor={theme.colors.muted}
                            value={specialInstructions}
                            onChangeText={setSpecialInstructions}
                            multiline
                        />
                    </View>

                    {/* Order Total */}
                    <View style={{ padding: 16 }}>
                        <View style={{ 
                            backgroundColor: theme.colors.background,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            borderRadius: 12,
                            padding: 16
                        }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text style={{ fontSize: 12, color: theme.colors.muted }}>Subtotal</Text>
                                <Text style={{ fontSize: 12, color: theme.colors.text }}>{formatNaira(subtotal)}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                <Text style={{ fontSize: 12, color: theme.colors.muted }}>Delivery Fee</Text>
                                <Text style={{ fontSize: 12, color: theme.colors.text }}>{formatNaira(deliveryFee)}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                <Text style={{ fontSize: 12, color: theme.colors.muted }}>Service Fee</Text>
                                <Text style={{ fontSize: 12, color: theme.colors.text }}>{formatNaira(serviceFee)}</Text>
                            </View>
                            <View style={{ 
                                height: 1, 
                                backgroundColor: theme.colors.border, 
                                marginBottom: 12 
                            }} />
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text }}>Total</Text>
                                <Text style={{ fontSize: 14, fontWeight: '700', color: theme.colors.text }}>{formatNaira(total)}</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                {/* Place Order Button */}
                <View style={{ 
                    padding: 16, 
                    backgroundColor: theme.colors.background,
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border
                }}>
                    <CTAButton
                        title={createOrderMutation.isPending ? 'Placing Order...' : 'Place Order'}
                        onPress={handlePlaceOrder}
                        disabled={createOrderMutation.isPending || cartItems.length === 0}
                        loading={createOrderMutation.isPending}
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
            </KeyboardAvoidingView>
        </SafeAreaWrapper>
    )
}