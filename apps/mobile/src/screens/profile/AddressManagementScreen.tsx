import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/theme';
import { Icon } from '../../ui/Icon';
import { CTAButton } from '../../ui/CTAButton';
import { mockAddresses } from '../../lib/mockProfile';
import { Address } from '../../types/profile';

type Nav = NativeStackNavigationProp<RootStackParamList, 'EditAddress'>;

export default function AddressManagementScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<Nav>();
    const [addresses, setAddresses] = useState<Address[]>(mockAddresses);

    const handleSetDefault = (addressId: string) => {
        setAddresses(prev => prev.map(addr => ({
            ...addr,
            isDefault: addr.id === addressId
        })));
    };

    const handleDeleteAddress = (addressId: string, addressLabel: string) => {
        Alert.alert(
            'Delete Address',
            `Are you sure you want to delete "${addressLabel}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        setAddresses(prev => prev.filter(addr => addr.id !== addressId));
                    }
                }
            ]
        );
    };

    const renderAddressCard = (address: Address) => (
        <View
            key={address.id}
            style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: address.isDefault ? theme.colors.primary : theme.colors.border,
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
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: theme.colors.text,
                            marginRight: 8,
                        }}>
                            {address.label}
                        </Text>
                        {address.isDefault && (
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
                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.text,
                        marginBottom: 4,
                    }}>
                        {address.address}
                    </Text>
                    {address.landmark && (
                        <Text style={{
                            fontSize: 12,
                            color: theme.colors.muted,
                        }}>
                            Near: {address.landmark}
                        </Text>
                    )}
                </View>
            </View>

            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <View style={{ flexDirection: 'row' }}>
                    <Pressable
                        onPress={() => navigation.navigate('EditAddress', { addressId: address.id })}
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginRight: 16,
                        }}
                    >
                        <Icon name="create" size={16} color={theme.colors.primary} />
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.primary,
                            marginLeft: 4,
                            fontWeight: '500',
                        }}>
                            Edit
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => handleDeleteAddress(address.id, address.label)}
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
                            Delete
                        </Text>
                    </Pressable>
                </View>

                {!address.isDefault && (
                    <Pressable
                        onPress={() => handleSetDefault(address.id)}
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
                    Address Management
                </Text>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {addresses.length > 0 ? (
                    <>
                        {addresses.map(renderAddressCard)}
                    </>
                ) : (
                    <View style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingHorizontal: 32,
                        paddingVertical: 64,
                    }}>
                        <Icon name="location-outline" size={64} color={theme.colors.muted} />
                        <Text style={{
                            fontSize: 18,
                            fontWeight: '600',
                            color: theme.colors.text,
                            marginTop: 16,
                            marginBottom: 8,
                        }}>
                            No addresses yet
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.muted,
                            textAlign: 'center',
                        }}>
                            Add your first address to get started with deliveries
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Add Address Button */}
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
                    title="Add New Address"
                    onPress={() => navigation.navigate('AddAddress' as any)}
                />
            </View>
        </View>
    );
}
