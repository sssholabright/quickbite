import React, { useMemo, useState, useEffect } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, Text, View, Alert, Linking } from 'react-native'
import { SafeAreaWrapper } from '../../ui/SafeAreaWrapper'
import { useTheme } from '../../theme/theme'
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { Icon } from '../../ui/Icon'
import { ScrollView } from 'react-native'
import { CTAButton } from '../../ui/CTAButton'
import { mockMeals, mockVendors } from '../../lib/mockData'
import { TextInput } from 'react-native'
import * as Location from 'expo-location';

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

export default function CheckoutScreen() {
    const theme = useTheme()
    const navigation = useNavigation<CheckoutScreenNavigationProp>();
    const route = useRoute<CheckoutRouteProp>();
    const { items, vendorId } = route.params;

    const [isOrderSummaryExpanded, setIsOrderSummaryExpanded] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
    const [deliveryTime, setDeliveryTime] = useState<'asap' | 'scheduled'>('asap');
    const [scheduledTime, setScheduledTime] = useState('');
    const [deliveryInstructions, setDeliveryInstructions] = useState('');
    const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    const [savedAddresses] = useState<DeliveryAddress[]>([
        {
            id: '1',
            name: 'Home',
            address: 'Hostel Block A, Room 12',
        },
        {
            id: '2',
            name: 'Office',
            address: 'Computer Science Department, Room 205',
        }
    ]);

    const vendor = mockVendors.find(v => v.id === vendorId) || mockVendors[0];

    const cartItemsList = useMemo(() => {
        // items is now an array, not an object
        return items.map((item) => {
            const meal = mockMeals.find(m => m.id === item.id);
            return meal ? { ...meal, quantity: item.quantity } : null;
        }).filter((item): item is NonNullable<typeof item> => item !== null);
    }, [items]);
    
    const subtotal = useMemo(() => {
        return cartItemsList.reduce((total, item) => {
            return total + (item ? item.price * item.quantity : 0);
        }, 0);
    }, [cartItemsList]);
    
    const deliveryFee = 200; // Fixed delivery fee for MVP
    const total = subtotal + deliveryFee;

    useEffect(() => {
        // Set default address
        if (savedAddresses.length > 0 && !selectedAddress) {
            setSelectedAddress(savedAddresses[0]);
        }
    }, [savedAddresses, selectedAddress]);

    const getCurrentLocation = async () => {
        try {
            setIsGettingLocation(true);
            
            // Request location permissions
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Denied',
                    'Location permission is required to use your current location. Please enable it in settings.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => Linking.openSettings() }
                    ]
                );
                return;
            }

            // Get current location
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            // Reverse geocode to get address
            const addresses = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            if (addresses.length > 0) {
                const address = addresses[0];
                const formattedAddress = `${address.street || ''} ${address.streetNumber || ''}, ${address.city || ''}, ${address.region || ''}`.trim();
                
                const currentLocationAddress: DeliveryAddress = {
                    id: 'current',
                    name: 'Current Location',
                    address: formattedAddress || 'Current Location',
                    coordinates: {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    },
                    isCurrentLocation: true,
                };

                setSelectedAddress(currentLocationAddress);
            }
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert(
                'Location Error',
                'Unable to get your current location. Please try again or select a saved address.',
                [{ text: 'OK' }]
            );
        } finally {
            setIsGettingLocation(false);
        }
    };

    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            Alert.alert('Missing Address', 'Please select a delivery address before placing your order.');
            return;
        }

        setIsLoading(true);
        
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            // Navigate to order confirmation
            navigation.navigate('OrderConfirmation', {
                orderId: `QB-${Date.now()}`,
                pickupCode: '', // No pickup code for delivery
                vendor: vendor,
                items: cartItemsList,
                total: total
            });
        }, 2000);
    };

    const renderOrderSummary = () => (
        <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: theme.colors.border,
        }}>
            <Pressable
                onPress={() => setIsOrderSummaryExpanded(!isOrderSummaryExpanded)}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 16,
                }}
            >
                <View>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: 4,
                    }}>
                        {vendor.name}
                    </Text>
                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.muted,
                    }}>
                        {cartItemsList.length} items • ₦{subtotal.toLocaleString()}
                    </Text>
                </View>
                <Icon 
                    name={isOrderSummaryExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={theme.colors.muted} 
                />
            </Pressable>

            {isOrderSummaryExpanded && (
                <View style={{
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.border,
                    padding: 16,
                }}>
                    {cartItemsList.map((item) => (
                        <View
                            key={item?.id}
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                paddingVertical: 8,
                            }}
                        >
                            <Text style={{
                                fontSize: 14,
                                color: theme.colors.text,
                                flex: 1,
                            }}>
                                {item?.quantity}x {item?.name}
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                fontWeight: '600',
                                color: theme.colors.text,
                            }}>
                                ₦{(item?.price * item?.quantity).toLocaleString()}
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    )

    const renderDeliveryAddress = () => (
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
                Delivery Address
            </Text>

            {/* Current Address Display */}
            <View style={{ marginBottom: 16 }}>
                <Text style={{
                    fontSize: 14,
                    color: theme.colors.muted,
                    marginBottom: 8,
                }}>
                    Selected Address
                </Text>
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: theme.colors.background,
                    borderRadius: 8,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                }}>
                    <Icon 
                        name={selectedAddress?.isCurrentLocation ? "location" : "home"} 
                        size={20} 
                        color={theme.colors.primary} 
                        style={{ marginRight: 12 }} 
                    />
                    <View style={{ flex: 1 }}>
                        <Text style={{
                            fontSize: 16,
                            color: theme.colors.text,
                            fontWeight: '500',
                        }}>
                            {selectedAddress?.name}
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.muted,
                            marginTop: 2,
                        }}>
                            {selectedAddress?.address}
                        </Text>
                    </View>
                    <Pressable>
                        <Icon name="chevron-forward" size={20} color={theme.colors.muted} />
                    </Pressable>
                </View>
            </View>

            {/* Address Selection Options */}
            <View style={{ marginBottom: 16 }}>
                <Text style={{
                    fontSize: 14,
                    color: theme.colors.muted,
                    marginBottom: 8,
                }}>
                    Choose Address
                </Text>
                
                {/* Current Location Button */}
                <Pressable
                    onPress={getCurrentLocation}
                    disabled={isGettingLocation}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.colors.background,
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        opacity: isGettingLocation ? 0.6 : 1,
                    }}
                >
                    <Icon name="location" size={20} color={theme.colors.primary} style={{ marginRight: 12 }} />
                    <Text style={{
                        fontSize: 16,
                        color: theme.colors.text,
                        flex: 1,
                    }}>
                        {isGettingLocation ? 'Getting location...' : 'Use Current Location'}
                    </Text>
                    {isGettingLocation && (
                        <Icon name="refresh" size={16} color={theme.colors.muted} />
                    )}
                </Pressable>

                {/* Saved Addresses */}
                {savedAddresses.map((address) => (
                    <Pressable
                        key={address.id}
                        onPress={() => setSelectedAddress(address)}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: selectedAddress?.id === address.id ? theme.colors.primary + '20' : theme.colors.background,
                            borderRadius: 8,
                            padding: 12,
                            marginBottom: 8,
                            borderWidth: 1,
                            borderColor: selectedAddress?.id === address.id ? theme.colors.primary : theme.colors.border,
                        }}
                    >
                        <Icon name="home" size={20} color={theme.colors.primary} style={{ marginRight: 12 }} />
                        <View style={{ flex: 1 }}>
                            <Text style={{
                                fontSize: 16,
                                color: theme.colors.text,
                                fontWeight: '500',
                            }}>
                                {address.name}
                            </Text>
                            <Text style={{
                                fontSize: 14,
                                color: theme.colors.muted,
                                marginTop: 2,
                            }}>
                                {address.address}
                            </Text>
                        </View>
                        {selectedAddress?.id === address.id && (
                            <Icon name="checkmark-circle" size={20} color={theme.colors.primary} />
                        )}
                    </Pressable>
                ))}
            </View>

            {/* Delivery Instructions */}
            <View>
                <Text style={{
                    fontSize: 14,
                    color: theme.colors.muted,
                    marginBottom: 8,
                }}>
                    Delivery Instructions (Optional)
                </Text>
                <TextInput
                    value={deliveryInstructions}
                    onChangeText={setDeliveryInstructions}
                    placeholder="e.g., Drop at hostel gate, call when arrived"
                    multiline
                    numberOfLines={2}
                    style={{
                        backgroundColor: theme.colors.background,
                        borderRadius: 8,
                        padding: 12,
                        fontSize: 16,
                        color: theme.colors.text,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        textAlignVertical: 'top',
                    }}
                />
            </View>
        </View>
    )

    const renderDeliveryTime = () => (
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
                Delivery Time
            </Text>
            
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                <Pressable
                    onPress={() => setDeliveryTime('asap')}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginRight: 20,
                    }}
                >
                    <View style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: deliveryTime === 'asap' ? theme.colors.primary : theme.colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 8,
                    }}>
                        {deliveryTime === 'asap' && (
                            <View style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: theme.colors.primary,
                            }} />
                        )}
                    </View>
                    <Text style={{
                        fontSize: 16,
                        color: theme.colors.text,
                    }}>
                        ASAP ({vendor.eta} delivery)
                    </Text>
                </Pressable>
            </View>

            <View style={{ flexDirection: 'row' }}>
                <Pressable
                    onPress={() => setDeliveryTime('scheduled')}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginRight: 20,
                    }}
                >
                    <View style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        borderWidth: 2,
                        borderColor: deliveryTime === 'scheduled' ? theme.colors.primary : theme.colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 8,
                    }}>
                        {deliveryTime === 'scheduled' && (
                            <View style={{
                                width: 8,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: theme.colors.primary,
                            }} />
                        )}
                    </View>
                    <Text style={{
                        fontSize: 16,
                        color: theme.colors.text,
                    }}>
                        Schedule Delivery
                    </Text>
                </Pressable>
            </View>

            {deliveryTime === 'scheduled' && (
                <TextInput
                    value={scheduledTime}
                    onChangeText={setScheduledTime}
                    placeholder="Select date & time"
                    style={{
                        backgroundColor: theme.colors.background,
                        borderRadius: 8,
                        padding: 12,
                        marginTop: 8,
                        fontSize: 16,
                        color: theme.colors.text,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                    }}
                />
            )}
        </View>
    )

    const renderPaymentMethod = () => (
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
                Payment Method
            </Text>
      
            <Pressable
                onPress={() => setPaymentMethod('cash')}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                }}
            >
                <View style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: paymentMethod === 'cash' ? theme.colors.primary : theme.colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                }}>
                    {paymentMethod === 'cash' && (
                        <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: theme.colors.primary,
                        }} />
                    )}
                </View>
                <Icon name="cash" size={20} color={theme.colors.muted} style={{ marginRight: 12 }} />
                <Text style={{
                    fontSize: 16,
                    color: theme.colors.text,
                }}>
                    Cash on Delivery
                </Text>
            </Pressable>
      
            <Pressable
                onPress={() => setPaymentMethod('card')}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                }}
            >
                <View style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: paymentMethod === 'card' ? theme.colors.primary : theme.colors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                }}>
                    {paymentMethod === 'card' && (
                        <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: theme.colors.primary,
                        }} />
                    )}
                </View>
                <Icon name="card" size={20} color={theme.colors.muted} style={{ marginRight: 12 }} />
                <Text style={{
                    fontSize: 16,
                    color: theme.colors.text,
                }}>
                    Card / Wallet (Coming Soon)
                </Text>
            </Pressable>
        </View>
    )
    
    const renderPriceBreakdown = () => (
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
                Price Breakdown
            </Text>
    
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
            }}>
                <Text style={{
                    fontSize: 16,
                    color: theme.colors.text,
                }}>
                    Subtotal
                </Text>
                <Text style={{
                    fontSize: 16,
                    color: theme.colors.text,
                }}>
                    ₦{subtotal.toLocaleString()}
                </Text>
            </View>
    
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
            }}>
                <Text style={{
                    fontSize: 16,
                    color: theme.colors.text,
                }}>
                    Delivery Fee
                </Text>
                <Text style={{
                    fontSize: 16,
                    color: theme.colors.text,
                }}>
                    ₦{deliveryFee.toLocaleString()}
                </Text>
            </View>
    
            <View style={{
                height: 1,
                backgroundColor: theme.colors.border,
                marginVertical: 8,
            }} />
    
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <Text style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: theme.colors.text,
                }}>
                    Total
                </Text>
                <Text style={{
                    fontSize: 20,
                    fontWeight: '700',
                    color: theme.colors.primary,
                }}>
                    ₦{total.toLocaleString()}
                </Text>
            </View>
        </View>
    );

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
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                }}>
                    <Pressable
                        onPress={() => navigation.goBack()}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: theme.colors.surface,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 16,
                        }}
                    >
                        <Icon name="arrow-left" size={20} color={theme.colors.text} />
                    </Pressable>
                    <Text style={{
                        fontSize: 20,
                        fontWeight: '700',
                        color: theme.colors.text,
                    }}>
                        Checkout
                    </Text>
                </View>

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Order Summary */}
                    {renderOrderSummary()}

                    {/* Delivery Address */}
                    {renderDeliveryAddress()}

                    {/* Delivery Time */}
                    {renderDeliveryTime()}

                    {/* Payment Method */}
                    {renderPaymentMethod()}

                    {/* Price Breakdown */}
                    {renderPriceBreakdown()}
                </ScrollView>

                {/* Sticky Footer - Confirm Button */}
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
                        title={isLoading ? "Placing Order..." : "Place Order"}
                        onPress={handlePlaceOrder}
                        disabled={isLoading}
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaWrapper>
    )
}