import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useTheme } from '../theme/theme';
import { Icon } from './Icon';
import { OrderCardProps } from '../types/order';

export default function OrderCard({ order, onPress }: OrderCardProps) {
    const theme = useTheme();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#FF9500';
            case 'confirmed': return '#34C759';
            case 'preparing': return '#007AFF';
            case 'ready_for_pickup': return '#FF9500';
            case 'out_for_delivery': return '#5856D6';
            case 'delivered': return '#007AFF';
            case 'cancelled': return '#FF3B30';
            default: return theme.colors.muted;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Pending';
            case 'confirmed': return 'Confirmed';
            case 'preparing': return 'Preparing';
            case 'ready_for_pickup': return 'Ready for Pickup';
            case 'out_for_delivery': return 'Out for Delivery';
            case 'delivered': return 'Delivered';
            case 'cancelled': return 'Cancelled';
            default: return 'Unknown';
        }
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const itemSummary = order.items.length === 1 
        ? order.items[0].name
        : `${order.items.length} items`;

    const hasAddOns = order.items.some(item => item.addOns && item.addOns.length > 0);

    return (
        <Pressable
            onPress={onPress}
            style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                padding: 16,
                marginHorizontal: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
            }}
        >
            {/* Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
            }}>
                <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: theme.colors.background,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                }}>
                    <Icon name="restaurant" size={20} color={theme.colors.primary} />
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: 2,
                    }}>
                        {order.vendor.name}
                    </Text>
                    <Text style={{
                        fontSize: 12,
                        color: theme.colors.muted,
                    }}>
                        {order.orderId} • {formatTime(order.placedAt)}
                    </Text>
                </View>

                <View style={{
                    backgroundColor: getStatusColor(order.status),
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12,
                }}>
                    <Text style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: 'white',
                    }}>
                        {getStatusLabel(order.status)}
                    </Text>
                </View>
            </View>

            {/* Order Summary */}
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <View>
                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.text,
                        marginBottom: 2,
                    }}>
                        {itemSummary}
                    </Text>
                    <Text style={{
                        fontSize: 12,
                        color: theme.colors.muted,
                    }}>
                        {order.vendor.location}
                    </Text>
                    {hasAddOns && (
                        <Text style={{
                            fontSize: 12,
                            color: theme.colors.muted,
                            marginTop: 4,
                        }}>
                            {order.items.map(item => 
                                item.addOns?.map(addOn => 
                                    `+ ${addOn.addOn.name} x${addOn.quantity}`
                                ).join(', ')
                            ).filter(Boolean).join(', ')}
                        </Text>
                    )}
                </View>
                
                <Text style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: theme.colors.primary,
                }}>
                    ₦{order.total.toLocaleString()}
                </Text>
            </View>
        </Pressable>
    )
}