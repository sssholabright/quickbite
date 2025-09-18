import React, { useMemo, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native'
import { SafeAreaWrapper } from '../../ui/SafeAreaWrapper'
import { useTheme } from '../../theme/theme'
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { Icon } from '../../ui/Icon'
import { ScrollView } from 'react-native'
import { CTAButton } from '../../ui/CTAButton'
import { CheckoutScreenProps } from '../../types/vendor'
import { mockMeals, mockVendors } from '../../lib/mockData'
import { TextInput } from 'react-native'

type CheckoutScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Checkout'>;

export default function CheckoutScreen({ route }: CheckoutScreenProps) {
    const theme = useTheme()
    const navigation = useNavigation<CheckoutScreenNavigationProp>();
    const { cartItems, vendorId } = route.params;

    const [isOrderSummaryExpanded, setIsOrderSummaryExpanded] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');
    const [pickupTime, setPickupTime] = useState<'asap' | 'scheduled'>('asap');
    const [scheduledTime, setScheduledTime] = useState('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const vendor = mockVendors.find(v => v.id === vendorId) || mockVendors[0];

    const cartItemsList = useMemo(() => {
        return Object.entries(cartItems).map(([mealId, quantity]) => {
            const meal = mockMeals.find(m => m.id === mealId);
            return meal ? { ...meal, quantity } : null;
        }).filter((item): item is NonNullable<typeof item> => item !== null);
    }, [cartItems]);
    
    const subtotal = useMemo(() => {
        return cartItemsList.reduce((total, item) => {
            return total + (item ? item.price * item.quantity : 0);
        }, 0);
    }, [cartItemsList]);
    
    const serviceFee = 0; // MVP - no fees
    const total = subtotal + serviceFee;

    const handlePlaceOrder = async () => {
        setIsLoading(true);
        
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            // Navigate to order confirmation
            navigation.navigate('OrderConfirmation', {
                orderId: `QB-${Date.now()}`,
                pickupCode: Math.random().toString(36).substr(2, 6).toUpperCase(),
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
                        {cartItemsList.length} items • ${subtotal.toFixed(2)}
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
                                ${(item?.price * item?.quantity).toFixed(2)}
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    )

    const renderPickupDetails = () => (
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
                Pickup Details
            </Text>

            <View style={{ marginBottom: 16 }}>
                <Text style={{
                    fontSize: 14,
                    color: theme.colors.muted,
                    marginBottom: 4,
                }}>
                    Location
                </Text>
                <Text style={{
                    fontSize: 16,
                    color: theme.colors.text,
                    fontWeight: '500',
                }}>
                    {vendor.name} • {vendor.distance}
                </Text>
            </View>

            <View>
                <Text style={{
                    fontSize: 14,
                    color: theme.colors.muted,
                    marginBottom: 8,
                }}>
                    Pickup Time
                </Text>
                
                <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                    <Pressable
                        onPress={() => setPickupTime('asap')}
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
                            borderColor: pickupTime === 'asap' ? theme.colors.primary : theme.colors.border,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 8,
                        }}>
                            {pickupTime === 'asap' && (
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
                            ASAP ({vendor.eta})
                        </Text>
                    </Pressable>
                </View>

                <View style={{ flexDirection: 'row' }}>
                    <Pressable
                        onPress={() => setPickupTime('scheduled')}
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
                            borderColor: pickupTime === 'scheduled' ? theme.colors.primary : theme.colors.border,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 8,
                        }}>
                            {pickupTime === 'scheduled' && (
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
                            Schedule
                        </Text>
                    </Pressable>
                </View>

                {pickupTime === 'scheduled' && (
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
                    Cash on Pickup
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

    const renderNotes = () => (
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
                marginBottom: 12,
            }}>
                Notes (Optional)
            </Text>
            <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Add note for vendor (e.g., less spice, extra sauce)"
                multiline
                numberOfLines={3}
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
    );
    
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
                    ${subtotal.toFixed(2)}
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
                    Service Fee
                </Text>
                <Text style={{
                    fontSize: 16,
                    color: theme.colors.text,
                }}>
                    ${serviceFee.toFixed(2)}
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
                    ${total.toFixed(2)}
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

                    {/* Pickup Details */}
                    {renderPickupDetails()}

                    {/* Payment Method */}
                    {renderPaymentMethod()}

                    {/* Notes */}
                    {renderNotes()}

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