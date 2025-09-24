import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Linking, Platform, Pressable, RefreshControl, ScrollView, Text, View, Switch, Modal, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../theme/theme";
import { SafeAreaWrapper } from "../../ui/SafeAreaWrapper";
import { Icon } from "../../ui/Icon";
import { CTAButton } from "../../ui/CTAButton";
import { RiderAvailableOrder } from "../../types/order";
import { mockAvailableOrders } from "../../lib/mockOrders";
import { RootStackParamList } from "../../navigation/types";
import MapCompat from "../../components/maps/MapCompact";
import type { RouteProp } from "@react-navigation/native";
import { LocationStatusIndicator } from '../../components/LocationStatusIndicator';
import { useLocation } from '../../hooks/useLocation';
import { useLocationStatus } from '../../hooks/useLocationStatus';
import { useRiderStore } from '../../stores/rider';
import { useAuthStore } from '../../stores/auth';

// Mock rider data
const mockRider = {
    name: "John Rider",
    phone: "+234 801 234 5678",
    rating: 4.8,
    vehicle: "Honda CB125F",
    plateNumber: "ABC 123 XY",
    todayEarnings: 12500,
    completedDeliveries: 8
};

// React Native compatible timer component
const CountdownTimer = ({ seconds, onComplete }: { seconds: number; onComplete: () => void }) => {
    const theme = useTheme();
    const [timeLeft, setTimeLeft] = useState(seconds);
    const animatedValue = useMemo(() => new Animated.Value(1), []);
    
    useEffect(() => {
        if (timeLeft <= 0) {
            onComplete();
            return;
        }
        
        const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timer);
    }, [timeLeft, onComplete]);

    useEffect(() => {
        // Animate the scale as time runs out
        Animated.timing(animatedValue, {
            toValue: timeLeft / seconds,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    }, [timeLeft, seconds, animatedValue]);
    
    const progress = timeLeft / seconds;
    
    return (
        <View style={{ alignItems: 'center', justifyContent: 'center', width: 50, height: 50 }}>
            {/* Outer circle */}
            <View style={{
                position: 'absolute',
                width: 50,
                height: 50,
                borderRadius: 25,
                borderWidth: 3,
                borderColor: theme.colors.border,
                backgroundColor: 'transparent'
            }} />
            
            {/* Progress circle using Animated.View */}
            <Animated.View style={{
                position: 'absolute',
                width: 50,
                height: 50,
                borderRadius: 25,
                borderWidth: 3,
                borderColor: timeLeft <= 10 ? "#ef4444" : "#f59e0b",
                backgroundColor: 'transparent',
                transform: [{ scale: animatedValue }]
            }} />
            
            {/* Timer text */}
            <Text style={{ 
                fontSize: 14, 
                fontWeight: "800", 
                color: timeLeft <= 10 ? "#ef4444" : "#f59e0b" 
            }}>
                {timeLeft}s
            </Text>
        </View>
    );
};

export default function HomeScreen() {
    const theme = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { 
        status, 
        message, 
        color, 
        icon, 
        isLocationReady, 
        currentLocation,
        lastChecked,
        actions 
    } = useLocationStatus();
    
    const { user } = useAuthStore();
    const { 
        isOnline, 
        isAvailable, 
        isLoading, 
        setOnlineStatus, 
        setAvailability 
    } = useRiderStore();

    // Initialize rider status from user data
    useEffect(() => {
        if (user?.rider) {
            // You might want to sync the store with the user data
            // or fetch the latest status from the API
        }
    }, [user]);

    // Core state
    const [orders, setOrders] = useState<RiderAvailableOrder[]>(() => mockAvailableOrders);
    const [refreshing, setRefreshing] = useState(false);
    const [activeOrder, setActiveOrder] = useState<RiderAvailableOrder | null>(null);
    const [orderStatus, setOrderStatus] = useState<'going_to_pickup' | 'picked_up' | 'delivering' | 'delivered'>('going_to_pickup');
    const [incomingOrder, setIncomingOrder] = useState<RiderAvailableOrder | null>(null);
    const [orderTimer, setOrderTimer] = useState(25); // 25 second timer
    
    // Location state
    const [riderLocation, setRiderLocation] = useState({ latitude: 6.5244, longitude: 3.3792 });

    // Mock vendor phone - in real app, get from order data
    const vendorPhone = "+234 801 234 5678";

    // Simulate location updates when online
    useEffect(() => {
        if (!isOnline) return;
        
        const interval = setInterval(() => {
            setRiderLocation(prev => ({
                latitude: prev.latitude + (Math.random() - 0.5) * 0.001,
                longitude: prev.longitude + (Math.random() - 0.5) * 0.001
            }));
        }, 3000);
        
        return () => clearInterval(interval);
    }, [isOnline]);

    // Simulate incoming orders when online
    useEffect(() => {
        if (!isOnline || activeOrder) return;
        
        const interval = setInterval(() => {
            if (orders.length > 0 && Math.random() > 0.7) {
                const randomOrder = orders[Math.floor(Math.random() * orders.length)];
                setIncomingOrder(randomOrder);
                setOrderTimer(25); // Reset timer
            }
        }, 10000);
        
        return () => clearInterval(interval);
    }, [isOnline, activeOrder, orders]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setOrders(prev => [...prev]);
            setRefreshing(false);
        }, 600);
    }, []);

    // Handle timer completion (auto-reject)
    const handleTimerComplete = useCallback(() => {
        setIncomingOrder(null);
        setOrderTimer(25);
        Alert.alert("Order Expired", "Order automatically assigned to another rider.");
    }, []);

    // Handle incoming order acceptance
    const acceptIncomingOrder = useCallback((order: RiderAvailableOrder) => {
        setActiveOrder(order);
        setOrderStatus('going_to_pickup');
        setIncomingOrder(null);
        setOrderTimer(25);
        setOrders(prev => prev.filter(o => o.id !== order.id));
        
        // Navigate to Order Detail Screen
        navigation.navigate('OrderDetail', { 
            order, 
            orderStatus: 'going_to_pickup',
            onStatusChange: (status: 'picked_up' | 'delivered' | 'cancelled') => {
                if (status === 'cancelled') {
                    setActiveOrder(null);
                    setOrderStatus('going_to_pickup');
                } else {
                    setOrderStatus(status);
                    if (status === 'delivered') {
                        setActiveOrder(null);
                        setOrderStatus('going_to_pickup');
                    }
                }
            }
        });
    }, [navigation]);

    const rejectIncomingOrder = useCallback(() => {
        setIncomingOrder(null);
        setOrderTimer(25);
        Alert.alert("Order Rejected", "Order will be assigned to another rider.");
    }, []);

    // Navigation functions
    const startNavigation = useCallback(() => {
        if (!activeOrder) return;
        
        const destination = orderStatus === 'picked_up' || orderStatus === 'delivering' ? 
            (activeOrder.dropoffLat && activeOrder.dropoffLng
                ? { latitude: activeOrder.dropoffLat, longitude: activeOrder.dropoffLng }
                : { latitude: 6.5167, longitude: 3.3841 }) :
            (activeOrder.vendor.lat && activeOrder.vendor.lng
                ? { latitude: activeOrder.vendor.lat, longitude: activeOrder.vendor.lng }
                : { latitude: 6.5244, longitude: 3.3792 });
        
        const label = orderStatus === 'picked_up' || orderStatus === 'delivering' ? "Delivery Address" : activeOrder.vendor.name;
        
        const url = Platform.select({
            ios: `http://maps.apple.com/?ll=${destination.latitude},${destination.longitude}&q=${encodeURIComponent(label)}`,
            android: `google.navigation:q=${destination.latitude},${destination.longitude}&mode=d`
        });
        
        if (url) {
            Linking.openURL(url).catch(() => Alert.alert("Unable to open navigation"));
        }
    }, [activeOrder, orderStatus]);

    const callVendor = useCallback(() => {
        const url = `tel:${vendorPhone}`;
        Linking.openURL(url).catch(() => Alert.alert("Unable to start call"));
    }, [vendorPhone]);

    const callCustomer = useCallback(() => {
        if (!activeOrder?.customerPhone) return Alert.alert("No phone number available");
        const url = `tel:${activeOrder.customerPhone}`;
        Linking.openURL(url).catch(() => Alert.alert("Unable to start call"));
    }, [activeOrder]);

    const onPickedUp = useCallback(() => {
        setOrderStatus('picked_up');
        Alert.alert("Picked Up", "Order collected from vendor. Navigate to customer for delivery.");
    }, []);

    const onDelivered = useCallback(() => {
        setOrderStatus('delivered');
        Alert.alert("Delivered", "Order completed successfully! Earnings updated.");
        
        // Complete order immediately instead of after 2 seconds
        setActiveOrder(null);
        setOrderStatus('going_to_pickup');
    }, []);

    // Go to rider profile
    const goToProfile = useCallback(() => {
        Alert.alert("Profile", "Navigate to rider profile & settings");
    }, []);

    // Go to notifications
    const goToNotifications = useCallback(() => {
        Alert.alert("Notifications", "Show rider notifications");
    }, []);

    // Toggle online status
    const handleToggleOnline = async () => {
        try {
            await setOnlineStatus(!isOnline);
        } catch (error) {
            console.error('Failed to toggle online status:', error);
        }
    };

    // Toggle availability
    const handleToggleAvailability = async () => {
        try {
            await setAvailability(!isAvailable);
        } catch (error) {
            console.error('Failed to toggle availability:', error);
        }
    };

    // Calculate distances for incoming order
    const calculateOrderDistances = useCallback((order: RiderAvailableOrder) => {
        const riderToVendor = order.distanceKm;
        const vendorToCustomer = order.dropoffLat && order.dropoffLng && order.vendor.lat && order.vendor.lng
            ? Math.sqrt(
                Math.pow(order.dropoffLat - order.vendor.lat, 2) +
                Math.pow(order.dropoffLng - order.vendor.lng, 2)
              ) * 111 // Convert to km
            : 2.5; // Default estimate
        
        return {
            riderToVendor: riderToVendor,
            vendorToCustomer: vendorToCustomer
        };
    }, []);

    return (
        <SafeAreaWrapper>
            <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                {/* Top Bar */}
                <View style={{
                    backgroundColor: theme.colors.surface,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}>
                    {/* Profile Icon */}
                    <Pressable onPress={goToProfile} style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: theme.colors.background,
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <Icon name="person" size={20} color={theme.colors.primary} />
                    </Pressable>

                    {/* Earnings Summary */}
                    <View style={{ alignItems: "center" }}>
                        <Text style={{ fontSize: 20, fontWeight: "800", color: theme.colors.text }}>
                            ₦{(mockRider.todayEarnings || 0).toLocaleString()}
                        </Text>
                        <Text style={{ fontSize: 12, color: theme.colors.muted }}>
                            {mockRider.completedDeliveries} deliveries today
                        </Text>
                    </View>

                    {/* Notification Icon */}
                    <Pressable onPress={goToNotifications} style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: theme.colors.background,
                        alignItems: "center",
                        justifyContent: "center"
                    }}>
                        <Icon name="notifications" size={20} color={theme.colors.primary} />
                        {/* Notification badge */}
                        <View style={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#ef4444"
                        }} />
                    </Pressable>
                </View>

                {/* Status Toggle */}
                <View style={{
                    backgroundColor: theme.colors.surface,
                    marginHorizontal: 16,
                    marginTop: 16,
                    borderRadius: 16,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    alignItems: "center"
                }}>
                    <View style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: isOnline ? '#10b981' + '15' : theme.colors.background,
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: 16,
                        borderWidth: 2,
                        borderColor: isOnline ? '#10b981' : theme.colors.border
                    }}>
                        <Icon name="bicycle" size={32} color={isOnline ? '#10b981' : theme.colors.muted} />
                    </View>
                    
                    <Text style={{ 
                        fontSize: 18, 
                        fontWeight: "700", 
                        color: theme.colors.text,
                        marginBottom: 8 
                    }}>
                        {isOnline ? "You're Online" : "You're Offline"}
                    </Text>
                    
                    <Text style={{ 
                        fontSize: 14, 
                        color: theme.colors.muted,
                        textAlign: "center",
                        marginBottom: 16
                    }}>
                        {isOnline 
                            ? "Ready to receive delivery requests" 
                            : "Turn on to start receiving orders"
                        }
                    </Text>

                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={{ 
                            marginRight: 12, 
                            fontSize: 16, 
                            fontWeight: "600",
                            color: theme.colors.text 
                        }}>
                            {isOnline ? "Online" : "Offline"}
                        </Text>
                        <Switch
                            value={isOnline}
                            onValueChange={handleToggleOnline}
                            trackColor={{ false: theme.colors.border, true: '#10b981' }}
                            thumbColor={isOnline ? "white" : theme.colors.muted}
                            style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
                        />
                    </View>
                </View>

                {/* Active Order Card or Idle State */}
                {activeOrder ? (
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
                        <View style={{
                            backgroundColor: theme.colors.surface,
                            borderRadius: 16,
                            padding: 20,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            marginBottom: 16
                        }}>
                            {/* Order Header */}
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                                <View style={{
                                    width: 50,
                                    height: 50,
                                    borderRadius: 12,
                                    backgroundColor: theme.colors.background,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: 12
                                }}>
                                    <Icon name="restaurant" size={24} color={theme.colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 18, fontWeight: "700", color: theme.colors.text }}>
                                        Active Delivery
                                    </Text>
                                    <Text style={{ fontSize: 14, color: theme.colors.muted }}>
                                        Order #{activeOrder.id.slice(-6)}
                                    </Text>
                                </View>
                                <View style={{
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 20,
                                    backgroundColor: orderStatus === 'delivered' ? '#10b981' + '15' : '#f59e0b' + '15'
                                }}>
                                    <Text style={{
                                        fontSize: 12,
                                        fontWeight: "600",
                                        color: orderStatus === 'delivered' ? '#10b981' : '#f59e0b'
                                    }}>
                                        {orderStatus === 'going_to_pickup' ? 'Going to Pickup' :
                                         orderStatus === 'picked_up' ? 'Picked Up' :
                                         orderStatus === 'delivering' ? 'Delivering' : 'Delivered'}
                                    </Text>
                                </View>
                            </View>

                            {/* Pickup Location */}
                            <View style={{ marginBottom: 16 }}>
                                <Text style={{ fontSize: 14, fontWeight: "600", color: theme.colors.text, marginBottom: 4 }}>
                                    Pickup from:
                                </Text>
                                <Text style={{ fontSize: 16, fontWeight: "700", color: theme.colors.primary }}>
                                    {activeOrder.vendor.name}
                                </Text>
                                <Text style={{ fontSize: 14, color: theme.colors.muted }}>
                                    {activeOrder.vendor.pickupLocation}
                                </Text>
                            </View>

                            {/* Delivery Location */}
                            <View style={{ marginBottom: 20 }}>
                                <Text style={{ fontSize: 14, fontWeight: "600", color: theme.colors.text, marginBottom: 4 }}>
                                    Deliver to:
                                </Text>
                                <Text style={{ fontSize: 16, fontWeight: "700", color: '#ef4444' }}>
                                    Customer
                                </Text>
                                <Text style={{ fontSize: 14, color: theme.colors.muted }}>
                                    {activeOrder.dropoffAddress}
                                </Text>
                            </View>

                            {/* Earnings */}
                            <View style={{
                                backgroundColor: theme.colors.background,
                                borderRadius: 12,
                                padding: 16,
                                marginBottom: 20,
                                alignItems: "center"
                            }}>
                                <Text style={{ fontSize: 14, color: theme.colors.muted, marginBottom: 4 }}>
                                    Delivery Fee
                                </Text>
                                <Text style={{ fontSize: 24, fontWeight: "800", color: theme.colors.primary }}>
                                    ₦{(activeOrder.payout || 0).toLocaleString()}
                                </Text>
                            </View>

                            {/* Single Action Button */}
                            <CTAButton 
                                title="View Order Details" 
                                onPress={() => navigation.navigate('OrderDetail', { 
                                    order: activeOrder, 
                                    orderStatus: orderStatus,
                                    onStatusChange: (status: 'picked_up' | 'delivered' | 'cancelled') => {
                                        if (status === 'cancelled') {
                                            setActiveOrder(null);
                                            setOrderStatus('going_to_pickup');
                                        } else {
                                            setOrderStatus(status);
                                            if (status === 'delivered') {
                                                setActiveOrder(null);
                                                setOrderStatus('going_to_pickup');
                                            }
                                        }
                                    }
                                })}
                            />
                        </View>
                    </ScrollView>
                ) : (
                    /* Idle State */
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
                        {isOnline ? (
                            <View style={{ alignItems: "center" }}>
                                <View style={{
                                    width: 120,
                                    height: 120,
                                    borderRadius: 60,
                                    backgroundColor: theme.colors.surface,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: 24,
                                    borderWidth: 2,
                                    borderColor: theme.colors.border
                                }}>
                                    <Icon name="bicycle" size={48} color={theme.colors.primary} />
                                </View>
                                <Text style={{ 
                                    fontSize: 24, 
                                    fontWeight: "700", 
                                    color: theme.colors.text,
                                    marginBottom: 8 
                                }}>
                                    Waiting for Orders...
                                </Text>
                                <Text style={{ 
                                    fontSize: 16, 
                                    color: theme.colors.muted,
                                    textAlign: "center",
                                    lineHeight: 24
                                }}>
                                    Stay online and you'll receive delivery requests nearby
                                </Text>
                                
                                <Pressable
                                    onPress={onRefresh}
                                    style={{
                                        marginTop: 24,
                                        paddingHorizontal: 20,
                                        paddingVertical: 12,
                                        borderRadius: 12,
                                        backgroundColor: theme.colors.surface,
                                        borderWidth: 1,
                                        borderColor: theme.colors.border,
                                        flexDirection: "row",
                                        alignItems: "center"
                                    }}
                                >
                                    <Icon name="refresh" size={16} color={theme.colors.primary} />
                                    <Text style={{ marginLeft: 8, color: theme.colors.primary, fontWeight: "600" }}>
                                        Refresh
                                    </Text>
                                </Pressable>
                            </View>
                        ) : (
                            <View style={{ alignItems: "center" }}>
                                <View style={{
                                    width: 120,
                                    height: 120,
                                    borderRadius: 60,
                                    backgroundColor: theme.colors.surface,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginBottom: 24,
                                    borderWidth: 2,
                                    borderColor: theme.colors.border
                                }}>
                                    <Icon name="power" size={48} color={theme.colors.muted} />
                                </View>
                                <Text style={{ 
                                    fontSize: 24, 
                                    fontWeight: "700", 
                                    color: theme.colors.text,
                                    marginBottom: 8 
                                }}>
                                    You're Offline
                                </Text>
                                <Text style={{ 
                                    fontSize: 16, 
                                    color: theme.colors.muted,
                                    textAlign: "center",
                                    lineHeight: 24
                                }}>
                                    Go online to start receiving delivery requests
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Enhanced New Order Popup */}
                <Modal
                    visible={!!incomingOrder}
                    transparent
                    animationType="fade"
                    onRequestClose={rejectIncomingOrder}
                >
                    <View style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 20
                    }}>
                        {incomingOrder && (
                            <View style={{
                                backgroundColor: theme.colors.surface,
                                borderRadius: 20,
                                padding: 24,
                                width: '100%',
                                maxWidth: 400,
                                shadowColor: "#000",
                                shadowOpacity: 0.3,
                                shadowRadius: 20,
                                shadowOffset: { width: 0, height: 10 },
                                elevation: 20
                            }}>
                                {/* Header with Timer */}
                                <View style={{
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: 24
                                }}>
                                    <Text style={{
                                        fontSize: 22,
                                        fontWeight: "800",
                                        color: theme.colors.text
                                    }}>
                                        New Order Request
                                    </Text>
                                    <CountdownTimer 
                                        seconds={25} 
                                        onComplete={handleTimerComplete} 
                                    />
                                </View>

                                {/* PICKUP INFO */}
                                <View style={{
                                    backgroundColor: theme.colors.background,
                                    borderRadius: 12,
                                    padding: 16,
                                    marginBottom: 16
                                }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                                        <View style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 8,
                                            backgroundColor: theme.colors.primary + '15',
                                            alignItems: "center",
                                            justifyContent: "center",
                                            marginRight: 12
                                        }}>
                                            <Icon name="restaurant" size={16} color={theme.colors.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 10, color: theme.colors.muted, marginBottom: 2 }}>
                                                PICKUP FROM
                                            </Text>
                                            <Text style={{ fontSize: 18, fontWeight: "800", color: theme.colors.text }}>
                                                {incomingOrder.vendor.name}
                                            </Text>
                                        </View>
                                        <Text style={{ 
                                            fontSize: 14, 
                                            fontWeight: "700", 
                                            color: theme.colors.primary,
                                            backgroundColor: theme.colors.primary + '15',
                                            paddingHorizontal: 8,
                                            paddingVertical: 4,
                                            borderRadius: 8
                                        }}>
                                            {calculateOrderDistances(incomingOrder).riderToVendor.toFixed(1)} km
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 14, color: theme.colors.muted, marginLeft: 44 }}>
                                        📍 {incomingOrder.vendor.pickupLocation}
                                    </Text>
                                </View>

                                {/* DROP-OFF INFO */}
                                <View style={{
                                    backgroundColor: theme.colors.background,
                                    borderRadius: 12,
                                    padding: 16,
                                    marginBottom: 20
                                }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                                        <View style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 8,
                                            backgroundColor: '#ef4444' + '15',
                                            alignItems: "center",
                                            justifyContent: "center",
                                            marginRight: 12
                                        }}>
                                            <Icon name="navigate" size={16} color="#ef4444" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 10, color: theme.colors.muted, marginBottom: 2 }}>
                                                DELIVER TO
                                            </Text>
                                            <Text style={{ fontSize: 16, fontWeight: "700", color: theme.colors.text }}>
                                                {incomingOrder.customerName || 'Customer'}
                                            </Text>
                                        </View>
                                        <Text style={{ 
                                            fontSize: 14, 
                                            fontWeight: "700", 
                                            color: "#ef4444",
                                            backgroundColor: '#ef4444' + '15',
                                            paddingHorizontal: 8,
                                            paddingVertical: 4,
                                            borderRadius: 8
                                        }}>
                                            {calculateOrderDistances(incomingOrder).vendorToCustomer.toFixed(1)} km
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 14, color: theme.colors.muted, marginLeft: 44 }}>
                                        🚚 {incomingOrder.dropoffAddress}
                                    </Text>
                                </View>

                                {/* PAYOUT INFO */}
                                <View style={{
                                    backgroundColor: theme.colors.primary + '10',
                                    borderRadius: 12,
                                    padding: 20,
                                    marginBottom: 24,
                                    alignItems: "center",
                                    borderWidth: 1,
                                    borderColor: theme.colors.primary + '30'
                                }}>
                                    <Text style={{ fontSize: 12, color: theme.colors.muted, marginBottom: 4 }}>
                                        DELIVERY FEE
                                    </Text>
                                    <Text style={{ fontSize: 32, fontWeight: "900", color: theme.colors.primary }}>
                                        ₦{(incomingOrder.payout || 0).toLocaleString()}
                                    </Text>
                                    {Math.random() > 0.7 && (
                                        <View style={{
                                            backgroundColor: '#10b981',
                                            paddingHorizontal: 8,
                                            paddingVertical: 4,
                                            borderRadius: 12,
                                            marginTop: 8
                                        }}>
                                            <Text style={{ fontSize: 12, fontWeight: "600", color: "white" }}>
                                                +₦200 Peak Hour Bonus
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {/* ACTION BUTTONS */}
                                <View style={{ flexDirection: "row", gap: 16 }}>
                                    <Pressable
                                        onPress={rejectIncomingOrder}
                                        style={{
                                            flex: 0.35,
                                            paddingVertical: 16,
                                            borderRadius: 16,
                                            backgroundColor: theme.colors.background,
                                            borderWidth: 2,
                                            borderColor: theme.colors.border,
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}
                                    >
                                        <Icon name="close" size={20} color={theme.colors.muted} />
                                        <Text style={{ 
                                            fontSize: 14, 
                                            fontWeight: "600", 
                                            color: theme.colors.muted,
                                            marginTop: 4
                                        }}>
                                            Reject
                                        </Text>
                                    </Pressable>
                                    
                                    <Pressable
                                        onPress={() => acceptIncomingOrder(incomingOrder)}
                                        style={{
                                            flex: 0.65,
                                            paddingVertical: 16,
                                            borderRadius: 16,
                                            backgroundColor: '#10b981',
                                            alignItems: "center",
                                            justifyContent: "center",
                                            shadowColor: "#10b981",
                                            shadowOpacity: 0.3,
                                            shadowRadius: 8,
                                            shadowOffset: { width: 0, height: 4 },
                                            elevation: 8
                                        }}
                                    >
                                        <Icon name="checkmark" size={24} color="white" />
                                        <Text style={{ 
                                            fontSize: 18, 
                                            fontWeight: "800", 
                                            color: "white",
                                            marginTop: 4
                                        }}>
                                            Accept Order
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        )}
                    </View>
                </Modal>
            </View>
        </SafeAreaWrapper>
    );
}