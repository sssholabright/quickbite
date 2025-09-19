import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, Modal, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useTheme } from '../../theme/theme';
import { Icon } from '../../ui/Icon';
import { CTAButton } from '../../ui/CTAButton';
import { mockOrders } from '../../lib/mockOrders';
import { Order } from '../../types/order';
import type { RootStackParamList } from '../../navigation/types';
import StatusStep from '../../components/orders/StatusStep';
import OrderSummary from '../../components/orders/OrderSummary';

type OrderDetailRouteProp = RouteProp<RootStackParamList, 'OrderDetail'>;

// Mock driver data
const mockDriver = {
    id: '1',
    name: 'John Doe',
    phone: '+234 801 234 5678',
    photo: 'https://via.placeholder.com/50',
    rating: 4.8,
    vehicle: 'Honda CB125F',
    plateNumber: 'ABC 123 XY'
};

export default function OrderDetailScreen() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const route = useRoute<OrderDetailRouteProp>();
    const navigation = useNavigation();
    const { orderId } = route.params;
    
    const [showDriverInfo, setShowDriverInfo] = useState(false);
    const [pulseAnim] = useState(new Animated.Value(1));

    // Find the order by ID
    const order = mockOrders.find(o => o.id === orderId);

    if (!order) {
        return (
            <View style={{ 
                flex: 1, 
                justifyContent: 'center', 
                alignItems: 'center',
                backgroundColor: theme.colors.background,
            }}>
                <Text style={{ color: theme.colors.text }}>Order not found</Text>
            </View>
        );
    }

    const statusSteps = [
        { key: 'pending', label: 'Order Submitted', icon: 'time', time: 'Just now' },
        { key: 'preparing', label: 'Preparing', icon: 'restaurant', time: '~5 mins' },
        { key: 'out_for_delivery', label: 'Out for Delivery', icon: 'car', time: '~10 mins' },
        { key: 'delivered', label: 'Delivered', icon: 'checkmark-done', time: 'Complete' },
    ];

    // Pulse animation for current status
    useEffect(() => {
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        pulse.start();

        return () => pulse.stop();
    }, [order.status]);

    const getActionButton = () => {
        switch (order.status) {
            case 'out_for_delivery':
                return (
                    <CTAButton
                        title="Track Delivery"
                        onPress={() => setShowDriverInfo(true)}
                    />
                );
            case 'pending':
                return (
                    <CTAButton
                        title="Cancel Order"
                        onPress={() => console.log('Cancel order')}
                    />
                );
            case 'delivered':
                return (
                    <CTAButton
                        title="Reorder"
                        onPress={() => console.log('Reorder')}
                    />
                );
            default:
                return null;
        }
    };

    const renderDriverInfo = () => (
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
                Driver Information
            </Text>

            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12,
            }}>
                <View style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: theme.colors.background,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                }}>
                    <Icon name="person" size={24} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: 2,
                    }}>
                        {mockDriver.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon name="star" size={14} color="#fbbf24" />
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.muted,
                            marginLeft: 4,
                        }}>
                            {mockDriver.rating} • {mockDriver.vehicle}
                        </Text>
                    </View>
                </View>
                <Pressable
                    onPress={() => console.log('Call driver')}
                    style={{
                        backgroundColor: theme.colors.primary,
                        borderRadius: 20,
                        padding: 8,
                    }}
                >
                    <Icon name="call" size={16} color="white" />
                </Pressable>
            </View>

            <View style={{
                backgroundColor: theme.colors.background,
                borderRadius: 8,
                padding: 12,
                marginBottom: 12,
            }}>
                <Text style={{
                    fontSize: 14,
                    color: theme.colors.muted,
                    marginBottom: 4,
                }}>
                    Estimated Arrival
                </Text>
                <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: theme.colors.primary,
                }}>
                    8-12 minutes
                </Text>
            </View>

            <View style={{
                backgroundColor: theme.colors.background,
                borderRadius: 8,
                padding: 12,
            }}>
                <Text style={{
                    fontSize: 14,
                    color: theme.colors.muted,
                    marginBottom: 4,
                }}>
                    Vehicle
                </Text>
                <Text style={{
                    fontSize: 16,
                    fontWeight: '600',
                    color: theme.colors.text,
                }}>
                    {mockDriver.vehicle} • {mockDriver.plateNumber}
                </Text>
            </View>
        </View>
    );

    const renderDriverInfoModal = () => (
        <Modal
            visible={showDriverInfo}
            transparent
            animationType="slide"
            onRequestClose={() => setShowDriverInfo(false)}
        >
            <View style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'flex-end',
            }}>
                <View style={{
                    backgroundColor: theme.colors.surface,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    padding: 20,
                    maxHeight: '80%',
                }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 20,
                    }}>
                        <Text style={{
                            fontSize: 20,
                            fontWeight: '700',
                            color: theme.colors.text,
                        }}>
                            Track Your Order
                        </Text>
                        <Pressable onPress={() => setShowDriverInfo(false)}>
                            <Icon name="close" size={24} color={theme.colors.muted} />
                        </Pressable>
                    </View>

                    {/* Driver Info */}
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 20,
                    }}>
                        <View style={{
                            width: 60,
                            height: 60,
                            borderRadius: 30,
                            backgroundColor: theme.colors.background,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 16,
                        }}>
                            <Icon name="person" size={28} color={theme.colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{
                                fontSize: 18,
                                fontWeight: '600',
                                color: theme.colors.text,
                                marginBottom: 4,
                            }}>
                                {mockDriver.name}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon name="star" size={16} color="#fbbf24" />
                                <Text style={{
                                    fontSize: 14,
                                    color: theme.colors.muted,
                                    marginLeft: 4,
                                }}>
                                    {mockDriver.rating} • {mockDriver.vehicle}
                                </Text>
                            </View>
                        </View>
                        <Pressable
                            onPress={() => console.log('Call driver')}
                            style={{
                                backgroundColor: theme.colors.primary,
                                borderRadius: 25,
                                padding: 12,
                            }}
                        >
                            <Icon name="call" size={20} color="white" />
                        </Pressable>
                    </View>

                    {/* ETA */}
                    <View style={{
                        backgroundColor: theme.colors.background,
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 20,
                        alignItems: 'center',
                    }}>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.muted,
                            marginBottom: 8,
                        }}>
                            Estimated Arrival
                        </Text>
                        <Text style={{
                            fontSize: 32,
                            fontWeight: '700',
                            color: theme.colors.primary,
                            marginBottom: 4,
                        }}>
                            8-12 mins
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.muted,
                        }}>
                            Driver is on the way
                        </Text>
                    </View>

                    {/* Map Placeholder */}
                    <View style={{
                        backgroundColor: theme.colors.background,
                        borderRadius: 12,
                        height: 200,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 20,
                    }}>
                        <Icon name="map" size={48} color={theme.colors.muted} />
                        <Text style={{
                            fontSize: 16,
                            color: theme.colors.muted,
                            marginTop: 8,
                        }}>
                            Live tracking map would be here
                        </Text>
                    </View>

                    <CTAButton
                        title="Close"
                        onPress={() => setShowDriverInfo(false)}
                    />
                </View>
            </View>
        </Modal>
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
                    Order Details
                </Text>
            </View>

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Status Tracker */}
                <View style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 12,
                    padding: 20,
                    marginBottom: 20,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                }}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginBottom: 20,
                    }}>
                        Order Status
                    </Text>

                    {statusSteps.map((step, index) => (
                        <StatusStep
                            key={step.key}
                            step={step}
                            currentStatus={order.status}
                            statusSteps={statusSteps}
                            pulseAnim={pulseAnim}
                        />
                    ))}
                </View>

                {/* Driver Info (only show if out for delivery) */}
                {order.status === 'out_for_delivery' && renderDriverInfo()}

                {/* Order Summary */}
                <OrderSummary
                    items={order.items}
                    vendor={{
                        name: order.vendor.name,
                        distance: order.vendor.location,
                        eta: order.estimatedReadyAt ? 
                            `Ready in ${Math.ceil((order.estimatedReadyAt.getTime() - Date.now()) / (1000 * 60))} mins` :
                            'ASAP'
                    }}
                    total={order.total}
                />

                {/* Payment Info */}
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
                        Payment Info
                    </Text>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                    }}>
                        <Text style={{ fontSize: 14, color: theme.colors.muted }}>
                            Payment Method
                        </Text>
                        <Text style={{ fontSize: 14, color: theme.colors.text, textTransform: 'capitalize' }}>
                            {order.paymentMethod}
                        </Text>
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                    }}>
                        <Text style={{ fontSize: 14, color: theme.colors.muted }}>
                            Subtotal
                        </Text>
                        <Text style={{ fontSize: 14, color: theme.colors.text }}>
                            ₦{order.subtotal.toLocaleString()}
                        </Text>
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                    }}>
                        <Text style={{ fontSize: 14, color: theme.colors.muted }}>
                            Delivery Fee
                        </Text>
                        <Text style={{ fontSize: 14, color: theme.colors.text }}>
                            ₦{order.fees.toLocaleString()}
                        </Text>
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingTop: 8,
                        borderTopWidth: 1,
                        borderTopColor: theme.colors.border,
                    }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
                            Total
                        </Text>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.primary }}>
                            ₦{order.total.toLocaleString()}
                        </Text>
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginTop: 8,
                    }}>
                        <Text style={{ fontSize: 14, color: theme.colors.muted }}>
                            Payment Status
                        </Text>
                        <Text style={{ 
                            fontSize: 14, 
                            color: order.paymentStatus === 'paid' ? theme.colors.primary : theme.colors.muted,
                            textTransform: 'capitalize',
                            fontWeight: '600',
                        }}>
                            {order.paymentStatus}
                        </Text>
                    </View>
                </View>

                {/* Notes */}
                {order.notes && (
                    <View style={{
                        backgroundColor: theme.colors.surface,
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 20,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                    }}>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: theme.colors.text,
                            marginBottom: 8,
                        }}>
                            Notes
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.text,
                        }}>
                            {order.notes}
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* Action Button */}
            {getActionButton() && (
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
                    {getActionButton()}
                </View>
            )}

            {renderDriverInfoModal()}
        </View>
    );
}