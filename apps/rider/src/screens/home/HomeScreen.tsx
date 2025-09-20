import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Linking, Platform, Pressable, RefreshControl, ScrollView, Text, View, Switch } from "react-native";
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

// Mock rider data
const mockRider = {
    name: "John Rider",
    phone: "+234 801 234 5678",
    rating: 4.8,
    vehicle: "Honda CB125F",
    plateNumber: "ABC 123 XY"
};

export default function HomeScreen() {
    const theme = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    
    // Core state
    const [isOnline, setIsOnline] = useState(false);
    const [orders, setOrders] = useState<RiderAvailableOrder[]>(() => mockAvailableOrders);
    const [refreshing, setRefreshing] = useState(false);
    const [activeOrder, setActiveOrder] = useState<RiderAvailableOrder | null>(null);
    const [pickedUp, setPickedUp] = useState(false);
    const [delivered, setDelivered] = useState(false);
    
    // Location state
    const [riderLocation, setRiderLocation] = useState({ latitude: 6.5244, longitude: 3.3792 });
    const [driverLocation, setDriverLocation] = useState({ latitude: 6.5228, longitude: 3.3805 });

    // Mock vendor phone - in real app, get from order data
    const vendorPhone = "+234 801 234 5678";

    // Simulate location updates when online
    useEffect(() => {
        if (!isOnline) return;
        
        const interval = setInterval(() => {
            // Simulate small location changes
            setRiderLocation(prev => ({
                latitude: prev.latitude + (Math.random() - 0.5) * 0.001,
                longitude: prev.longitude + (Math.random() - 0.5) * 0.001
            }));
        }, 3000);
        
        return () => clearInterval(interval);
    }, [isOnline]);

    // Simulate driver movement during active order
    useEffect(() => {
        if (!activeOrder || !pickedUp) return;
        
        const interval = setInterval(() => {
            setDriverLocation(prev => {
                const customerLoc = activeOrder.dropoffLat && activeOrder.dropoffLng
                    ? { latitude: activeOrder.dropoffLat, longitude: activeOrder.dropoffLng }
                    : { latitude: 6.5167, longitude: 3.3841 };
                
                const latDiff = customerLoc.latitude - prev.latitude;
                const lngDiff = customerLoc.longitude - prev.longitude;
                const step = 0.0001;
                
                return {
                    latitude: prev.latitude + (latDiff * step),
                    longitude: prev.longitude + (lngDiff * step)
                };
            });
        }, 2000);
        
        return () => clearInterval(interval);
    }, [activeOrder, pickedUp]);

    // Simulated realtime updates
    useEffect(() => {
        if (!isOnline) return;
        
        const iv = setInterval(() => {
            setOrders(prev => prev.map(o => ({
                ...o,
                distanceKm: Math.max(0.3, +(o.distanceKm + (Math.random() - 0.5) * 0.2).toFixed(1))
            })));
        }, 5000);
        return () => clearInterval(iv);
    }, [isOnline]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        setTimeout(() => {
            setOrders(prev => [...prev]);
            setRefreshing(false);
        }, 600);
    }, []);

    const acceptOrder = useCallback((order: RiderAvailableOrder) => {
        setActiveOrder(order);
        setPickedUp(false);
        setDelivered(false);
        setOrders(prev => prev.filter(o => o.id !== order.id));
    }, []);

    // Navigation functions
    const startNavigation = useCallback(() => {
        if (!activeOrder) return;
        
        const destination = pickedUp ? 
            (activeOrder.dropoffLat && activeOrder.dropoffLng
                ? { latitude: activeOrder.dropoffLat, longitude: activeOrder.dropoffLng }
                : { latitude: 6.5167, longitude: 3.3841 }) :
            (activeOrder.vendor.lat && activeOrder.vendor.lng
                ? { latitude: activeOrder.vendor.lat, longitude: activeOrder.vendor.lng }
                : { latitude: 6.5244, longitude: 3.3792 });
        
        const label = pickedUp ? "Delivery Address" : activeOrder.vendor.name;
        
        const url = Platform.select({
            ios: `http://maps.apple.com/?ll=${destination.latitude},${destination.longitude}&q=${encodeURIComponent(label)}`,
            android: `google.navigation:q=${destination.latitude},${destination.longitude}&mode=d`
        });
        
        if (url) {
            Linking.openURL(url).catch(() => Alert.alert("Unable to open navigation"));
        }
    }, [activeOrder, pickedUp]);

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
        setPickedUp(true);
        Alert.alert("Picked Up", "Customer and vendor notified.");
    }, []);

    const onDelivered = useCallback(() => {
        setDelivered(true);
        Alert.alert("Delivered", "Order completed. Earnings updated.");
    }, []);

    const completeOrder = useCallback(() => {
        setActiveOrder(null);
        setPickedUp(false);
        setDelivered(false);
    }, []);

    // Map region calculation
    const mapRegion = useMemo(() => {
        if (activeOrder && pickedUp) {
            const customerLoc = activeOrder.dropoffLat && activeOrder.dropoffLng
                ? { latitude: activeOrder.dropoffLat, longitude: activeOrder.dropoffLng }
                : { latitude: 6.5167, longitude: 3.3841 };
            
            return {
                latitude: (driverLocation.latitude + customerLoc.latitude) / 2,
                longitude: (driverLocation.longitude + customerLoc.longitude) / 2,
                latitudeDelta: Math.abs(driverLocation.latitude - customerLoc.latitude) + 0.01,
                longitudeDelta: Math.abs(driverLocation.longitude - customerLoc.longitude) + 0.01,
            };
        }
        
        return {
            latitude: riderLocation.latitude,
            longitude: riderLocation.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
        };
    }, [riderLocation, driverLocation, activeOrder, pickedUp]);

    // Map annotations
    const mapAnnotations = useMemo(() => {
        const annotations = [
            {
                id: 'rider',
                coordinates: riderLocation,
                title: 'Your Location',
                tintColor: isOnline ? '#10b981' : '#6b7280'
            }
        ];

        if (isOnline && !activeOrder) {
            // Show available orders on map
            orders.forEach(order => {
                if (order.vendor.lat && order.vendor.lng) {
                    annotations.push({
                        id: `vendor-${order.id}`,
                        coordinates: { latitude: order.vendor.lat, longitude: order.vendor.lng },
                        title: order.vendor.name,
                        tintColor: theme.colors.primary
                    });
                }
            });
        }

        if (activeOrder) {
            const vendorLoc = activeOrder.vendor.lat && activeOrder.vendor.lng
                ? { latitude: activeOrder.vendor.lat, longitude: activeOrder.vendor.lng }
                : { latitude: 6.5244, longitude: 3.3792 };
            
            const customerLoc = activeOrder.dropoffLat && activeOrder.dropoffLng
                ? { latitude: activeOrder.dropoffLat, longitude: activeOrder.dropoffLng }
                : { latitude: 6.5167, longitude: 3.3841 };

            annotations.push(
                {
                    id: 'vendor',
                    coordinates: vendorLoc,
                    title: activeOrder.vendor.name,
                    tintColor: theme.colors.primary
                },
                {
                    id: 'customer',
                    coordinates: customerLoc,
                    title: 'Delivery Address',
                    tintColor: '#ef4444'
                }
            );

            if (pickedUp) {
                annotations.push({
                    id: 'driver',
                    coordinates: driverLocation,
                    title: 'Your Location',
                    tintColor: '#10b981'
                });
            }
        }

        return annotations;
    }, [riderLocation, isOnline, orders, activeOrder, pickedUp, driverLocation, theme.colors.primary]);

    // Map routes
    const mapRoutes = useMemo(() => {
        if (!activeOrder) return [];
        
        if (pickedUp) {
            // Show route from driver to customer
            const customerLoc = activeOrder.dropoffLat && activeOrder.dropoffLng
                ? { latitude: activeOrder.dropoffLat, longitude: activeOrder.dropoffLng }
                : { latitude: 6.5167, longitude: 3.3841 };
            
            return [{
                id: 'delivery-route',
                from: driverLocation,
                to: customerLoc,
                strokeColor: theme.colors.primary,
                strokeWidth: 4,
                profile: 'driving' as const
            }];
        } else {
            // Show route from rider to vendor
            const vendorLoc = activeOrder.vendor.lat && activeOrder.vendor.lng
                ? { latitude: activeOrder.vendor.lat, longitude: activeOrder.vendor.lng }
                : { latitude: 6.5244, longitude: 3.3792 };
            
            return [{
                id: 'pickup-route',
                from: riderLocation,
                to: vendorLoc,
                strokeColor: '#f59e0b',
                strokeWidth: 4,
                profile: 'driving' as const
            }];
        }
    }, [activeOrder, pickedUp, driverLocation, riderLocation, theme.colors.primary]);

    // Order card component
    const OrderCard = ({ order }: { order: RiderAvailableOrder }) => {
        const itemsSummary = order.items.length === 1
            ? `${order.items[0].quantity} × ${order.items[0].name}`
            : `${order.items.reduce((a, b) => a + b.quantity, 0)} items`;

        return (
            <View style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 14,
                padding: 14,
                marginHorizontal: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
                shadowColor: "#000",
                shadowOpacity: 0.06,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2
            }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: theme.colors.background, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                        <Icon set="ion" name="restaurant" size={20} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: "700", color: theme.colors.text }}>{order.vendor.name}</Text>
                        <Text style={{ fontSize: 12, color: theme.colors.muted }}>{order.vendor.pickupLocation}</Text>
                    </View>
                    <View style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: theme.colors.background }}>
                        <Text style={{ fontSize: 13, fontWeight: "800", color: theme.colors.primary }}>₦{order.payout.toLocaleString()}</Text>
                    </View>
                </View>

                <View style={{ gap: 8, marginBottom: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Icon set="ion" name="navigate-outline" size={16} color={theme.colors.muted} />
                        <Text style={{ marginLeft: 6, fontSize: 13, color: theme.colors.text }}>
                            {order.dropoffAddress}
                        </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Icon set="ion" name="walk-outline" size={16} color={theme.colors.muted} />
                        <Text style={{ marginLeft: 6, fontSize: 13, color: theme.colors.muted }}>
                            {order.distanceKm.toFixed(1)} km • {itemsSummary}
                        </Text>
                    </View>
                </View>

                <CTAButton title="Accept Order" onPress={() => acceptOrder(order)} />
            </View>
        );
    };

    const renderItem = useCallback(
        ({ item }: { item: RiderAvailableOrder }) => <OrderCard order={item} />,
        [theme, acceptOrder]
    );

    const keyExtractor = useCallback((item: RiderAvailableOrder) => item.id, []);

    // Calculate ETA
    const calculateETA = () => {
        if (!activeOrder || !pickedUp) return 0;
        
        const customerLoc = activeOrder.dropoffLat && activeOrder.dropoffLng
            ? { latitude: activeOrder.dropoffLat, longitude: activeOrder.dropoffLng }
            : { latitude: 6.5167, longitude: 3.3841 };
        
        const distance = Math.sqrt(
            Math.pow(customerLoc.latitude - driverLocation.latitude, 2) +
            Math.pow(customerLoc.longitude - driverLocation.longitude, 2)
        ) * 111;
        
        return Math.max(1, Math.ceil(distance * 3));
    };

    return (
        <SafeAreaWrapper>
            <View style={{ flex: 1 }}>
                {/* Header Section */}
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
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: theme.colors.background,
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12
                        }}>
                            <Icon set="ion" name="person" size={20} color={theme.colors.primary} />
                        </View>
                        <View>
                            <Text style={{ fontSize: 16, fontWeight: "700", color: theme.colors.text }}>{mockRider.name}</Text>
                            <Text style={{ fontSize: 12, color: theme.colors.muted }}>
                                {isOnline ? "Online" : "Offline"}
                            </Text>
                        </View>
                    </View>
                    
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={{ marginRight: 8, fontSize: 14, color: theme.colors.text }}>
                            {isOnline ? "Online" : "Offline"}
                        </Text>
                        <Switch
                            value={isOnline}
                            onValueChange={setIsOnline}
                            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                            thumbColor={isOnline ? "white" : theme.colors.muted}
                        />
                    </View>
                </View>

                {/* Map Section */}
                <View style={{ flex: 1, position: "relative" }}>
                    <MapCompat
                        style={{ flex: 1 }}
                        region={mapRegion}
                        annotations={mapAnnotations}
                        routes={mapRoutes}
                    />
                    
                    {/* Status overlay */}
                    {activeOrder && (
                        <View style={{
                            position: "absolute",
                            top: 16,
                            left: 16,
                            right: 16,
                            backgroundColor: theme.colors.surface,
                            borderRadius: 12,
                            padding: 12,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            shadowColor: "#000",
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            elevation: 4
                        }}>
                            <Text style={{ fontSize: 16, fontWeight: "700", color: theme.colors.text, marginBottom: 4 }}>
                                {!pickedUp ? "Go to Pickup" : !delivered ? "Delivering" : "Delivered"}
                            </Text>
                            <Text style={{ fontSize: 12, color: theme.colors.muted }}>
                                {!pickedUp 
                                    ? `${activeOrder.vendor.name} • ${activeOrder.vendor.pickupLocation}`
                                    : `ETA: ${calculateETA()} min • ${activeOrder.dropoffAddress}`
                                }
                            </Text>
                        </View>
                    )}
                </View>

                {/* Bottom Section */}
                {!isOnline ? (
                    // Offline State
                    <View style={{
                        backgroundColor: theme.colors.surface,
                        padding: 24,
                        borderTopWidth: 1,
                        borderTopColor: theme.colors.border,
                        alignItems: "center"
                    }}>
                        <View style={{
                            width: 80,
                            height: 80,
                            borderRadius: 40,
                            backgroundColor: theme.colors.background,
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 16
                        }}>
                            <Icon set="ion" name="power" size={32} color={theme.colors.muted} />
                        </View>
                        <Text style={{ fontSize: 18, fontWeight: "700", color: theme.colors.text, marginBottom: 8 }}>
                            You're Offline
                        </Text>
                        <Text style={{ fontSize: 14, color: theme.colors.muted, textAlign: "center", marginBottom: 16 }}>
                            Turn on your availability to start receiving delivery requests
                        </Text>
                        <CTAButton title="Go Online" onPress={() => setIsOnline(true)} />
                    </View>
                ) : activeOrder ? (
                    // Active Order State - Enhanced with Contact & Navigation
                    <View style={{
                        backgroundColor: theme.colors.surface,
                        padding: 16,
                        borderTopWidth: 1,
                        borderTopColor: theme.colors.border,
                        gap: 12
                    }}>
                        {/* Order Info */}
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                            <Text style={{ fontSize: 16, fontWeight: "700", color: theme.colors.text }}>
                                Delivery Fee: ₦{activeOrder.payout.toLocaleString()}
                            </Text>
                            {delivered && (
                                <Text style={{ fontSize: 12, color: theme.colors.primary, fontWeight: "600" }}>
                                    Completed
                                </Text>
                            )}
                        </View>

                        {/* Contact Buttons */}
                        <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
                            <Pressable onPress={callVendor} style={{
                                flex: 1,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: theme.colors.background,
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: theme.colors.border
                            }}>
                                <Icon set="ion" name="call" size={16} color={theme.colors.primary} />
                                <Text style={{ marginLeft: 6, color: theme.colors.primary, fontWeight: "600", fontSize: 14 }}>
                                    Call Vendor
                                </Text>
                            </Pressable>
                            
                            <Pressable onPress={callCustomer} style={{
                                flex: 1,
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: theme.colors.background,
                                paddingVertical: 12,
                                paddingHorizontal: 16,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: theme.colors.border
                            }}>
                                <Icon set="ion" name="call" size={16} color={theme.colors.primary} />
                                <Text style={{ marginLeft: 6, color: theme.colors.primary, fontWeight: "600", fontSize: 14 }}>
                                    Call Customer
                                </Text>
                            </Pressable>
                        </View>

                        {/* Action Buttons */}
                        <View style={{ gap: 8 }}>
                            {!pickedUp ? (
                                <CTAButton title="Mark as Picked Up" onPress={onPickedUp} />
                            ) : !delivered ? (
                                <CTAButton title="Mark as Delivered" onPress={onDelivered} />
                            ) : (
                                <CTAButton title="Complete Order" onPress={completeOrder} />
                            )}
                            
                            <CTAButton 
                                title="Start Navigation" 
                                onPress={startNavigation}
                            />
                        </View>
                    </View>
                ) : (
                    // Online Idle State - Available Orders
                    <View style={{ maxHeight: 300 }}>
                        <View style={{
                            backgroundColor: theme.colors.surface,
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            borderTopWidth: 1,
                            borderTopColor: theme.colors.border,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between"
                        }}>
                            <Text style={{ fontSize: 16, fontWeight: "700", color: theme.colors.text }}>
                                Available Orders ({orders.length})
                            </Text>
                            <Pressable onPress={onRefresh}>
                                <Icon set="ion" name="refresh" size={20} color={theme.colors.primary} />
                            </Pressable>
                        </View>
                        
                        <FlatList
                            data={orders}
                            keyExtractor={keyExtractor}
                            renderItem={renderItem}
                            contentContainerStyle={{ paddingBottom: 24 }}
                            refreshControl={
                                <RefreshControl 
                                    refreshing={refreshing} 
                                    onRefresh={onRefresh} 
                                    tintColor={theme.colors.primary} 
                                />
                            }
                            ListEmptyComponent={
                                <View style={{ alignItems: "center", marginTop: 40, paddingHorizontal: 16 }}>
                                    <View style={{
                                        width: 60,
                                        height: 60,
                                        borderRadius: 16,
                                        backgroundColor: theme.colors.background,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderWidth: 1,
                                        borderColor: theme.colors.border
                                    }}>
                                        <Icon set="ion" name="bag-outline" size={26} color={theme.colors.muted} />
                                    </View>
                                    <Text style={{ marginTop: 12, color: theme.colors.text, fontWeight: "700" }}>
                                        No available orders
                                    </Text>
                                    <Text style={{ marginTop: 4, color: theme.colors.muted, fontSize: 12, textAlign: "center" }}>
                                        Pull to refresh to check for new ones
                                    </Text>
                                </View>
                            }
                        />
                    </View>
                )}
            </View>
        </SafeAreaWrapper>
    );
}