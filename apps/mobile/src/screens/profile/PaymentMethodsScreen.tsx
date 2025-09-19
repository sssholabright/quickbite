import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/theme';
import { Icon } from '../../ui/Icon';
import { CTAButton } from '../../ui/CTAButton';
import { mockPaymentMethods } from '../../lib/mockProfile';
import { PaymentMethod } from '../../types/profile';

export default function PaymentMethodsScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods);

    const handleSetDefault = (methodId: string) => {
        setPaymentMethods(prev => prev.map(method => ({
            ...method,
            isDefault: method.id === methodId
        })));
    };

    const handleDeleteMethod = (methodId: string, methodName: string) => {
        Alert.alert(
            'Remove Payment Method',
            `Are you sure you want to remove "${methodName}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: () => {
                        setPaymentMethods(prev => prev.filter(method => method.id !== methodId));
                    }
                }
            ]
        );
    };

    const handleAddPaymentMethod = () => {
        Alert.alert(
            'Add Payment Method',
            'Choose how you\'d like to add a payment method:',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Add Card', onPress: () => console.log('Add card') },
                { text: 'Add Wallet', onPress: () => console.log('Add wallet') }
            ]
        );
    };

    const renderPaymentMethod = (method: PaymentMethod) => (
        <View
            key={method.id}
            style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: method.isDefault ? theme.colors.primary : theme.colors.border,
            }}
        >
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 8,
            }}>
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                        <View style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: method.type === 'card' ? theme.colors.primary + '20' : '#10B981' + '20',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                        }}>
                            <Icon 
                                name={method.type === 'card' ? 'card' : 'wallet'} 
                                size={20} 
                                color={method.type === 'card' ? theme.colors.primary : '#10B981'} 
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: theme.colors.text,
                            }}>
                                {method.name}
                            </Text>
                            {method.lastFour && (
                                <Text style={{
                                    fontSize: 14,
                                    color: theme.colors.muted,
                                }}>
                                    **** **** **** {method.lastFour}
                                </Text>
                            )}
                            {method.balance !== undefined && (
                                <Text style={{
                                    fontSize: 14,
                                    color: theme.colors.muted,
                                }}>
                                    Balance: ₦{method.balance.toLocaleString()}
                                </Text>
                            )}
                        </View>
                        {method.isDefault && (
                            <View style={{
                                backgroundColor: theme.colors.primary,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4,
                            }}>
                                <Text style={{
                                    color: 'white',
                                    fontSize: 10,
                                    fontWeight: '600',
                                }}>
                                    DEFAULT
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <View style={{ flexDirection: 'row' }}>
                    <Pressable
                        onPress={() => handleDeleteMethod(method.id, method.name)}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                        }}
                    >
                        <Icon name="trash" size={16} color="#FF3B30" />
                        <Text style={{
                            fontSize: 14,
                            color: '#FF3B30',
                            marginLeft: 4,
                            fontWeight: '500',
                        }}>
                            Remove
                        </Text>
                    </Pressable>
                </View>

                {!method.isDefault && (
                    <Pressable
                        onPress={() => handleSetDefault(method.id)}
                        style={{
                            backgroundColor: theme.colors.primary + '20',
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 6,
                        }}
                    >
                        <Text style={{
                            fontSize: 12,
                            color: theme.colors.primary,
                            fontWeight: '600',
                        }}>
                            Set Default
                        </Text>
                    </Pressable>
                )}
            </View>
        </View>
    );

    return (
        <View style={{ 
            flex: 1, 
            backgroundColor: theme.colors.background,
            paddingTop: insets.top,
        }}>
            {/* Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
            }}>
                <Pressable onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
                    <Icon name="arrow-back" size={24} color={theme.colors.text} />
                </Pressable>
                <Text style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: theme.colors.text,
                }}>
                    Payment Methods
                </Text>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {paymentMethods.length > 0 ? (
                    <>
                        {paymentMethods.map(renderPaymentMethod)}
                    </>
                ) : (
                    <View style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 32,
                        paddingVertical: 64,
                    }}>
                        <Icon name="card-outline" size={64} color={theme.colors.muted} />
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600',
                            color: theme.colors.text,
                            marginTop: 16,
                            marginBottom: 8,
                        }}>
                            No payment methods
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.muted,
                            textAlign: 'center',
                        }}>
                            Add a payment method to make checkout faster
                        </Text>
                    </View>
                )}

                {/* Payment Info */}
                <View style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 12,
                    padding: 16,
                    marginTop: 20,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 12,
                    }}>
                        <Icon name="information-circle" size={20} color={theme.colors.primary} />
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: theme.colors.text,
                            marginLeft: 8,
                        }}>
                            Payment Security
                        </Text>
                    </View>
                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.muted,
                        lineHeight: 20,
                    }}>
                        Your payment information is encrypted and secure. We use industry-standard security measures to protect your data.
                    </Text>
                </View>
            </ScrollView>

            {/* Add Payment Method Button */}
            <View style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: theme.colors.surface,
                padding: 16,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
            }}>
                <CTAButton
                    title="Add Payment Method"
                    onPress={handleAddPaymentMethod}
                />
            </View>
        </View>
    );
}
