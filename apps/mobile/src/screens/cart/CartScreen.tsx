import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, Modal, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/theme';
import { Icon } from '../../ui/Icon';
import { CTAButton } from '../../ui/CTAButton';
import { mockMeals, mockVendors } from '../../lib/mockData';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { CartItem, CartScreenProps } from '../../types/vendor';

type CartScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AppTabs'>;

export default function CartScreen({ 
    visible, 
    onClose, 
    cartItems, 
    onUpdateQuantity, 
    onRemoveItem 
}: CartScreenProps) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<CartScreenNavigationProp>();

    const cartItemsList = useMemo(() => {
        return Object.entries(cartItems).map(([mealId, quantity]) => {
            const meal = mockMeals.find(m => m.id === mealId);
            const vendor = mockVendors.find(v => v.id === meal?.vendorId);
            return meal ? { 
                ...meal, 
                quantity, 
                vendorId: meal.vendorId || 'vendor1', 
                vendorName: vendor?.name || 'Vendor' 
            } : null;
        }).filter((item): item is NonNullable<typeof item> => item !== null);
    }, [cartItems]);

    const subtotal = useMemo(() => {
        return cartItemsList.reduce((total, item) => {
            return total + (item ? item.price * item.quantity : 0);
        }, 0);
    }, [cartItemsList]);

    const deliveryFee = 200;
    const total = subtotal + deliveryFee;

    const handleProceedToCheckout = () => {
        onClose();
        // Convert cartItems to items array for checkout
        const items = cartItemsList.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        }));
        
        navigation.navigate('Checkout', {
            vendorId: cartItemsList[0]?.vendorId || 'vendor1',
            items: items,
            total: total
        } as any);
    };

    const renderCartItem = ({ item }: { item: CartItem }) => (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: theme.colors.border,
        }}>
            <View style={{
                width: 60,
                height: 60,
                borderRadius: 8,
                backgroundColor: theme.colors.background,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
            }}>
                <Icon name="restaurant" size={24} color={theme.colors.primary} />
            </View>

            <View style={{ flex: 1 }}>
                <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: theme.colors.text,
                    marginBottom: 4,
                }}>
                    {item.name}
                </Text>
                <Text style={{
                    fontSize: 14,
                    color: theme.colors.muted,
                    marginBottom: 8,
                }}>
                    {item.vendorName}
                </Text>
                <Text style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: theme.colors.primary,
                }}>
                    ₦{item.price.toLocaleString()}
                </Text>
            </View>

            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: theme.colors.background,
                borderRadius: 20,
                padding: 4,
            }}>
                <Pressable
                    onPress={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: theme.colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Icon name="remove" size={16} color={theme.colors.text} />
                </Pressable>
                
                <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: theme.colors.text,
                    marginHorizontal: 16,
                    minWidth: 20,
                    textAlign: 'center',
                }}>
                    {item.quantity}
                </Text>
                
                <Pressable
                    onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: theme.colors.primary,
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Icon name="add" size={16} color="white" />
                </Pressable>
            </View>

            <Pressable
                onPress={() => onRemoveItem(item.id)}
                style={{
                    marginLeft: 12,
                    padding: 8,
                }}
            >
                <Icon name="trash" size={20} color={theme.colors.muted} />
            </Pressable>
        </View>
    );

    const renderEmptyState = () => (
        <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
        }}>
            <Icon name="cart-outline" size={64} color={theme.colors.muted} />
            <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: theme.colors.text,
                marginTop: 16,
                marginBottom: 8,
            }}>
                Your cart is empty
            </Text>
            <Text style={{
                fontSize: 14,
                color: theme.colors.muted,
                textAlign: 'center',
            }}>
                Add some delicious meals to get started
            </Text>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={onClose}
        >
            <View style={{ 
                flex: 1, 
                backgroundColor: theme.colors.background,
                paddingTop: insets.top,
            }}>
                {/* Header */}
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                }}>
                    <Text style={{
                        fontSize: 24,
                        fontWeight: '700',
                        color: theme.colors.text,
                    }}>
                        Cart
                    </Text>
                    <Pressable
                        onPress={onClose}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: theme.colors.surface,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon name="close" size={20} color={theme.colors.text} />
                    </Pressable>
                </View>

                {cartItemsList.length > 0 ? (
                    <>
                        {/* Cart Items */}
                        <FlatList
                            data={cartItemsList}
                            renderItem={renderCartItem}
                            keyExtractor={(item) => item.id}
                            style={{ flex: 1 }}
                            contentContainerStyle={{ padding: 20 }}
                            showsVerticalScrollIndicator={false}
                        />

                        {/* Price Summary */}
                        <View style={{
                            backgroundColor: theme.colors.surface,
                            padding: 20,
                            borderTopWidth: 1,
                            borderTopColor: theme.colors.border,
                        }}>
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
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
                                marginBottom: 16,
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
                                marginBottom: 16,
                            }} />

                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                marginBottom: 20,
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

                            <CTAButton
                                title="Proceed to Checkout"
                                onPress={handleProceedToCheckout}
                            />
                        </View>
                    </>
                ) : (
                    renderEmptyState()
                )}
            </View>
        </Modal>
    );
}