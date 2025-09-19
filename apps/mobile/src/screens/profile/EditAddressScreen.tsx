import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useTheme } from '../../theme/theme';
import { Icon } from '../../ui/Icon';
import { CTAButton } from '../../ui/CTAButton';
import { mockAddresses } from '../../lib/mockProfile';
import { Address } from '../../types/profile';
import type { RootStackParamList } from '../../navigation/types';

type EditAddressRouteProp = RouteProp<RootStackParamList, 'EditAddress'>;

export default function EditAddressScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation();
    const route = useRoute<EditAddressRouteProp>();
    const { addressId } = route.params;
    
    const [formData, setFormData] = useState({
        label: '',
        address: '',
        landmark: '',
        isDefault: false
    });

    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Find the address to edit
        const address = mockAddresses.find(addr => addr.id === addressId);
        if (address) {
            setFormData({
                label: address.label,
                address: address.address,
                landmark: address.landmark || '',
                isDefault: address.isDefault
            });
        }
    }, [addressId]);

    const handleSave = async () => {
        if (!formData.label.trim() || !formData.address.trim()) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setIsLoading(true);
        
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            Alert.alert('Success', 'Address updated successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        }, 1000);
    };

    const handleDelete = () => {
        Alert.alert(
            'Delete Address',
            'Are you sure you want to delete this address? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        // Here you would delete the address from your state management or API
                        console.log('Deleting address:', addressId);
                        Alert.alert('Success', 'Address deleted successfully', [
                            { text: 'OK', onPress: () => navigation.goBack() }
                        ]);
                    }
                }
            ]
        );
    };

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
                    Edit Address
                </Text>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Label */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: 8,
                    }}>
                        Label *
                    </Text>
                    <TextInput
                        value={formData.label}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, label: text }))}
                        placeholder="e.g., Home, Hostel, Office"
                        style={{
                            backgroundColor: theme.colors.surface,
                            borderRadius: 8,
                            padding: 12,
                            fontSize: 16,
                            color: theme.colors.text,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                        }}
                    />
                </View>

                {/* Address */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: 8,
                    }}>
                        Address *
                    </Text>
                    <TextInput
                        value={formData.address}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, address: text }))}
                        placeholder="e.g., Hostel A, Room 12"
                        multiline
                        numberOfLines={3}
                        style={{
                            backgroundColor: theme.colors.surface,
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

                {/* Landmark */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: 8,
                    }}>
                        Landmark (Optional)
                    </Text>
                    <TextInput
                        value={formData.landmark}
                        onChangeText={(text) => setFormData(prev => ({ ...prev, landmark: text }))}
                        placeholder="e.g., Near the main gate, Behind library"
                        style={{
                            backgroundColor: theme.colors.surface,
                            borderRadius: 8,
                            padding: 12,
                            fontSize: 16,
                            color: theme.colors.text,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                        }}
                    />
                </View>

                {/* Set as Default */}
                <Pressable
                    onPress={() => setFormData(prev => ({ ...prev, isDefault: !prev.isDefault }))}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: theme.colors.surface,
                        borderRadius: 12,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        marginBottom: 20,
                    }}
                >
                    <View style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: formData.isDefault ? theme.colors.primary : theme.colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                    }}>
                        {formData.isDefault && (
                            <Icon name="checkmark" size={16} color={theme.colors.primary} />
                        )}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: theme.colors.text,
                        }}>
                            Set as Default Address
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.muted,
                            marginTop: 2,
                        }}>
                            Use this address for future orders
                        </Text>
                    </View>
                </Pressable>

                {/* Delete Button */}
                <Pressable
                    onPress={handleDelete}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#FF3B30' + '20',
                        borderRadius: 12,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: '#FF3B30' + '40',
                    }}
                >
                    <Icon name="trash" size={20} color="#FF3B30" />
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: '#FF3B30',
                        marginLeft: 8,
                    }}>
                        Delete Address
                    </Text>
                </Pressable>
            </ScrollView>

            {/* Save Button */}
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
                    title={isLoading ? "Saving..." : "Save Changes"}
                    onPress={handleSave}
                    disabled={isLoading}
                />
            </View>
        </View>
    );
}
