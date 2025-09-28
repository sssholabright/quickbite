import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import { useTheme } from '../theme/theme';
import { Icon } from './Icon';
import { OrderCardProps } from '../types/order';

export default function OrderCard({ order, onPress }: OrderCardProps) {
    const theme = useTheme();

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#f59e0b';
            case 'confirmed': return theme.colors.primary;
            case 'preparing': return theme.colors.primary;
            case 'ready_for_pickup': return '#10b981';
            case 'assigned': return '#3b82f6';
            case 'picked_up': return '#8b5cf6';
            case 'out_for_delivery': return '#f59e0b';
            case 'delivered': return '#10b981';
            case 'cancelled': return theme.colors.danger;
            default: return theme.colors.muted;
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pending': return 'Pending';
            case 'confirmed': return 'Confirmed';
            case 'preparing': return 'Preparing';
            case 'ready_for_pickup': return 'Ready';
            case 'assigned': return 'Assigned';
            case 'picked_up': return 'Picked Up';
            case 'out_for_delivery': return 'Delivering';
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

    const formatETA = (date: Date) => {
        const now = new Date();
        const diff = date.getTime() - now.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        
        if (minutes <= 0) return 'Arriving now';
        if (minutes < 60) return `${minutes}m`;
        const hours = Math.floor(minutes / 60);
        return `${hours}h ${minutes % 60}m`;
    };

    const itemSummary = order.items.length === 1 
        ? order.items[0].name
        : `${order.items.length} items`;

    const hasAddOns = order.items.some(item => item.addOns && item.addOns.length > 0);

    const isLiveTracking = order.isLiveTracking || false;
    const hasRider = order.rider && order.rider.name;

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
                borderLeftWidth: isLiveTracking ? 4 : 1,
                borderLeftColor: isLiveTracking ? '#10b981' : theme.colors.border,
            }}
        >
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
            }}>
                <View style={{
                    width: 35,
                    height: 35,
                    borderRadius: 8,
                    backgroundColor: theme.colors.background,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                }}>
                    <Icon name="restaurant" size={16} color={theme.colors.primary} />
                </View>

                <View style={{ flex: 1 }}>
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: 2,
                    }}>
                        {order.vendor.name}
                    </Text>
                    <Text style={{
                        fontSize: 10,
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
                        fontSize: 10,
                        fontWeight: '600',
                        color: 'white',
                    }}>
                        {getStatusLabel(order.status)}
                    </Text>
                </View>
            </View>

            {hasRider && (
                <View style={{
                    backgroundColor: '#3b82f6' + '15',
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                }}>
                    <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: '#3b82f6',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 8,
                    }}>
                        <Icon name="person" size={16} color="white" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: theme.colors.text,
                        }}>
                            {order.rider?.name}
                        </Text>
                        <Text style={{
                            fontSize: 10,
                            color: theme.colors.muted,
                        }}>
                            {order.rider?.vehicleType} • {order.rider?.phone}
                        </Text>
                    </View>
                    {isLiveTracking && (
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: '#10b981',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 8,
                        }}>
                            <View style={{
                                width: 6,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: 'white',
                                marginRight: 4,
                            }} />
                            <Text style={{
                                fontSize: 8,
                                fontWeight: '600',
                                color: 'white',
                            }}>
                                LIVE
                            </Text>
                        </View>
                    )}
                </View>
            )}

            {order.statusText && (
                <View style={{
                    backgroundColor: theme.colors.background,
                    borderRadius: 8,
                    padding: 8,
                    marginBottom: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                }}>
                    <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: order.statusColor || getStatusColor(order.status),
                        marginRight: 8,
                    }} />
                    <Text style={{
                        fontSize: 12,
                        color: theme.colors.text,
                        flex: 1,
                    }}>
                        {order.statusText}
                    </Text>
                    {order.estimatedDeliveryTime && isLiveTracking && (
                        <Text style={{
                            fontSize: 10,
                            fontWeight: '600',
                            color: '#10b981',
                        }}>
                            ETA: {formatETA(order.estimatedDeliveryTime)}
                        </Text>
                    )}
                </View>
            )}

            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
            }}>
                <View>
                    <Text style={{
                        fontSize: 12,
                        color: theme.colors.text,
                        marginBottom: 2,
                    }}>
                        {itemSummary}
                    </Text>
                    <Text style={{
                        fontSize: 10,
                        color: theme.colors.muted,
                    }}>
                        {order.vendor.location}
                    </Text>
                    {hasAddOns && (
                        <Text style={{
                            fontSize: 10,
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
                    fontSize: 14,
                    fontWeight: '700',
                    color: theme.colors.primary,
                }}>
                    ₦{order.total.toLocaleString()}
                </Text>
            </View>
        </Pressable>
    )
}