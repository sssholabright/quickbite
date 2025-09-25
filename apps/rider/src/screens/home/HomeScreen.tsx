import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Linking, Platform, Pressable, ScrollView, Text, View, Switch, Modal, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../theme/theme";
import { SafeAreaWrapper } from "../../ui/SafeAreaWrapper";
import { Icon } from "../../ui/Icon";
import { CTAButton } from "../../ui/CTAButton";
import { RiderAvailableOrder } from "../../types/order";
import { mockAvailableOrders } from "../../lib/mockOrders";
import { RootStackParamList } from "../../navigation/types";
import { LocationStatusIndicator } from '../../components/LocationStatusIndicator';
import { useLocationStatus } from '../../hooks/useLocationStatus';
import { useRiderStore } from '../../stores/rider';
import { useAuthStore } from '../../stores/auth';
import { useOrderStore } from '../../stores/order'; // 🚀 NEW: Order state management
// 🚀 FIXED: Import WebSocket and realtime store without parameters
import { useSocket } from '../../hooks/useSocket';
import { useRealtimeStore, DeliveryJob } from '../../stores/realtime';
import riderService from '../../services/riderService';
import * as Location from 'expo-location';
import { useLocationStore } from '../../stores/location';
import { useQuery } from '@tanstack/react-query';

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
    const { message, color } = useLocationStatus();
    
    const { user } = useAuthStore();
    const { isOnline, isAvailable, setOnlineStatus, setAvailability } = useRiderStore();
    
    // 🚀 NEW: Order state management
    const { 
        activeOrder, 
        orderStatus, 
        setActiveOrder, 
        setOrderStatus, 
        clearActiveOrder,
        hasActiveOrder,
        canReceiveNewOrders 
    } = useOrderStore();

    // �� FIXED: WebSocket and realtime integration without parameters
    const { socket, isConnected, connectionStatus, joinOrderRoom, leaveOrderRoom, sendLocationUpdate, markOrderPickedUp, markOrderDelivered } = useSocket();
    
    const { deliveryJobs, getActiveDeliveryJobs, removeDeliveryJob, addDeliveryJob } = useRealtimeStore();

    // 🚀 IMPROVED: Connection status helper functions
    const getConnectionStatusInfo = () => {
        if (connectionStatus === 'connected') return { color: '#10b981', text: 'Connected', icon: 'wifi' };
        if (connectionStatus === 'reconnecting') return { color: '#f59e0b', text: 'Reconnecting', icon: 'refresh' };
        return { color: '#ef4444', text: 'Disconnected', icon: 'wifi-off' };
    };

    const connectionStatusInfo = getConnectionStatusInfo();

    // �� CRITICAL: Initialize rider status on app start
    useEffect(() => {
        const initializeRiderStatus = async () => {
            try {
                console.log('🚀 Initializing rider status...');
                // Set rider as online and available when app starts
                await setOnlineStatus(true);
                await setAvailability(true);
                console.log('✅ Rider status initialized: online and available');
            } catch (error) {
                console.error('❌ Failed to initialize rider status:', error);
            }
        };
        
        initializeRiderStatus();
    }, []); // Run once on mount

    // 🚀 NEW: Real-time delivery jobs state
    const [activeDeliveryJobs, setActiveDeliveryJobs] = useState<DeliveryJob[]>([]);
    const [incomingDeliveryJob, setIncomingDeliveryJob] = useState<DeliveryJob | null>(null);
    const [deliveryJobTimer, setDeliveryJobTimer] = useState(60);
    
    // Core state
    const [orders, setOrders] = useState<RiderAvailableOrder[]>(() => mockAvailableOrders);
    const [refreshing, setRefreshing] = useState(false);
    const [incomingOrder, setIncomingOrder] = useState<RiderAvailableOrder | null>(null);
    const [orderTimer, setOrderTimer] = useState(25);
    
    // Replace the local riderLocation state with location store
    const { currentLocation, sendInitialLocation, updateLocationForDelivery } = useLocationStore();
    
    // Use real location instead of hardcoded
    const riderLocation = currentLocation || { latitude: 6.5244, longitude: 3.3792 };
    
    // 🚀 FIXED: Send initial location only once when rider comes online
    useEffect(() => {
        if (isOnline && currentLocation) {
            console.log('📍 Rider is online, sending initial location to backend');
            sendInitialLocation(); // Use the new method that only sends once
        }
    }, [isOnline, currentLocation, sendInitialLocation]);
    
    // 🚀 FIXED: Update location periodically - ONLY when delivering an order with proper throttling
    useEffect(() => {
        if (!isOnline || !activeOrder || (orderStatus !== 'picked_up' && orderStatus !== 'delivering')) {
            return;
        }
        
        console.log(`📍 Starting location tracking for order ${activeOrder.id} (status: ${orderStatus})`);
        
        const interval = setInterval(() => {
            console.log(`📍 Sending location update for order ${activeOrder.id}`);
            updateLocationForDelivery(activeOrder.id); // Use the new method with order context
        }, 30000); // 30 seconds interval
        
        return () => {
            console.log(`📍 Stopping location tracking for order ${activeOrder.id}`);
            clearInterval(interval);
        };
    }, [isOnline, activeOrder, orderStatus, updateLocationForDelivery]);

    // Mock vendor phone - in real app, get from order data
    const vendorPhone = "+234 801 234 5678";

    // 🚀 CRITICAL: Check for existing assigned orders when coming online
    useEffect(() => {
        const checkExistingOrders = async () => {
            if (!isOnline || hasActiveOrder()) {
                console.log('ℹ️ Rider offline or already has active order, skipping order check');
                return;
            }

            try {
                console.log('🔍 Checking for existing assigned orders...');
                const ordersData = await riderService.getRiderOrders();
                
                if (ordersData?.orders && ordersData.orders.length > 0) {
                    // Filter out delivered orders
                    const undeliveredOrders = ordersData.orders.filter((order: any) => 
                        !['DELIVERED', 'CANCELLED'].includes(order.status)
                    );
                    
                    if (undeliveredOrders.length > 0) {
                        const assignedOrder = undeliveredOrders[0];
                        console.log('📦 Found existing assigned order:', assignedOrder.id);
                        
                        // Convert to active order format
                        const activeOrderData: RiderAvailableOrder = {
                            id: assignedOrder.id,
                            vendor: {
                                id: assignedOrder.vendor?.id || '',
                                name: assignedOrder.vendor?.businessName || 'Unknown Vendor',
                                pickupLocation: assignedOrder.vendor?.businessAddress || '',
                                lat: assignedOrder.vendor?.latitude || 0,
                                lng: assignedOrder.vendor?.longitude || 0
                            },
                            dropoffAddress: assignedOrder.deliveryAddress?.address || '',
                            dropoffLat: assignedOrder.deliveryAddress?.coordinates?.lat || 0,
                            dropoffLng: assignedOrder.deliveryAddress?.coordinates?.lng || 0,
                            customerName: assignedOrder.customer?.user?.name || 'Customer',
                            customerPhone: assignedOrder.customer?.user?.phone || '',
                            distanceKm: 0,
                            payout: assignedOrder.deliveryFee || 0,
                            items: (assignedOrder.items || []).map((item: any) => ({
                                id: item.id,
                                name: item.menuItem?.name || 'Unknown Item',
                                quantity: item.quantity || 1,
                                price: item.unitPrice || 0
                            })),
                            createdAt: new Date(assignedOrder.createdAt)
                        };
                        
                        // Set the active order and status
                        setActiveOrder(activeOrderData);
                        
                        // Map backend status to frontend status
                        switch (assignedOrder.status) {
                            case 'ASSIGNED':
                                setOrderStatus('going_to_pickup');
                                break;
                            case 'PICKED_UP':
                                setOrderStatus('picked_up');
                                break;
                            case 'OUT_FOR_DELIVERY':
                                setOrderStatus('delivering');
                                break;
                            default:
                                setOrderStatus('going_to_pickup');
                        }
                        
                        console.log('✅ Restored existing order:', assignedOrder.id, 'Status:', assignedOrder.status);
                    }
                }
            } catch (error: any) {
                console.error('❌ Failed to check existing orders:', error);
            }
        };
        
        checkExistingOrders();
    }, [isOnline, hasActiveOrder, setActiveOrder, setOrderStatus]);

    // 🚀 ENHANCED: Update active delivery jobs when realtime store changes
    useEffect(() => {
        // Only process delivery jobs when properly connected and can receive new orders
        if (!isConnected || connectionStatus !== 'connected' || !canReceiveNewOrders()) {
            console.log('⚠️ Not processing delivery jobs:', {
                isConnected,
                connectionStatus,
                canReceiveNewOrders: canReceiveNewOrders(),
                hasActiveOrder: hasActiveOrder()
            });
            return;
        }

        console.log('HomeScreen: deliveryJobs changed:', Object.keys(deliveryJobs));
        console.log('HomeScreen: deliveryJobs count:', Object.keys(deliveryJobs).length);
        console.log('HomeScreen: isOnline:', isOnline);
        console.log('HomeScreen: isAvailable:', isAvailable);
        console.log('HomeScreen: connectionStatus:', connectionStatus);
        
        const jobs = getActiveDeliveryJobs();
        console.log('HomeScreen: getActiveDeliveryJobs returned:', jobs.length);
        setActiveDeliveryJobs(jobs);
        
        // 🚀 CRITICAL: Clear incoming delivery job if it's no longer in the store
        if (incomingDeliveryJob && !jobs.find(job => job.orderId === incomingDeliveryJob.orderId)) {
            console.log('🗑️ Clearing incoming delivery job - no longer available:', incomingDeliveryJob.orderId);
            setIncomingDeliveryJob(null);
            setDeliveryJobTimer(60);
        }
        
        // Show the most recent delivery job as incoming (only if no active order)
        if (jobs.length > 0 && !incomingDeliveryJob && !hasActiveOrder()) {
            const latestJob = jobs[jobs.length - 1];
            console.log('📦 Setting incoming delivery job:', latestJob.orderId);
            setIncomingDeliveryJob(latestJob);
            setDeliveryJobTimer(60);
        }
    }, [deliveryJobs, getActiveDeliveryJobs, incomingDeliveryJob, hasActiveOrder, canReceiveNewOrders, isOnline, isAvailable, connectionStatus, isConnected]);

    // Handle delivery job timer
    useEffect(() => {
        if (!incomingDeliveryJob) return;
        
        const timer = setInterval(() => {
            setDeliveryJobTimer(prev => {
                if (prev <= 1) {
                    handleDeliveryJobExpired();
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);
        
        return () => clearInterval(timer);
    }, [incomingDeliveryJob]);

    // Handle delivery job expiration
    const handleDeliveryJobExpired = useCallback(() => {
        if (incomingDeliveryJob) {
            console.log(`⏰ Delivery job expired: ${incomingDeliveryJob.orderId}`);
            removeDeliveryJob(incomingDeliveryJob.orderId);
            setIncomingDeliveryJob(null);
            setDeliveryJobTimer(60);
        }
    }, [incomingDeliveryJob, removeDeliveryJob]);

    // Accept delivery job
    const acceptDeliveryJob = useCallback(async () => {
        if (!incomingDeliveryJob) return;
        
        try {
            console.log(`✅ Accepting delivery job: ${incomingDeliveryJob.orderId}`);
            
            // Call API to accept the job
            await riderService.acceptDeliveryJob(incomingDeliveryJob.orderId);
            
            // Join the order room for real-time updates
            joinOrderRoom(incomingDeliveryJob.orderId);
            
            // Convert delivery job to active order format
            const activeOrderData: RiderAvailableOrder = {
                id: incomingDeliveryJob.orderId,
                vendor: {
                    id: incomingDeliveryJob.vendor.id,
                    name: incomingDeliveryJob.vendor.name,
                    pickupLocation: incomingDeliveryJob.vendor.address,
                    lat: incomingDeliveryJob.vendor.lat,
                    lng: incomingDeliveryJob.vendor.lng
                },
                dropoffAddress: incomingDeliveryJob.customer.address,
                dropoffLat: incomingDeliveryJob.customer.lat,
                dropoffLng: incomingDeliveryJob.customer.lng,
                customerName: incomingDeliveryJob.customer.name,
                customerPhone: incomingDeliveryJob.customer.phone,
                distanceKm: incomingDeliveryJob.estimatedDistance,
                payout: incomingDeliveryJob.deliveryFee,
                items: incomingDeliveryJob.items,
                createdAt: new Date(incomingDeliveryJob.createdAt)
            };
            
            // 🚀 CRITICAL: Set active order in store
            setActiveOrder(activeOrderData);
            setOrderStatus('going_to_pickup');
            
            // 🚀 CRITICAL: Navigate to OrderDetailScreen immediately
            navigation.navigate('OrderDetail', { 
                order: activeOrderData, 
                orderStatus: 'going_to_pickup',
                onStatusChange: (status: 'picked_up' | 'delivered' | 'cancelled') => {
                    if (status === 'cancelled') {
                        clearActiveOrder();
                        removeDeliveryJob(incomingDeliveryJob.orderId);
                    } else {
                        setOrderStatus(status);
                        if (status === 'delivered') {
                            clearActiveOrder();
                            removeDeliveryJob(incomingDeliveryJob.orderId);
                        }
                    }
                }
            });
            
            // Clear the popup and remove from delivery jobs
            setIncomingDeliveryJob(null);
            setDeliveryJobTimer(60);
            removeDeliveryJob(incomingDeliveryJob.orderId);
            
            Alert.alert("Job Accepted", "You have accepted the delivery job. Navigate to the vendor to pick up the order.");
            
        } catch (error: any) {
            console.error('Failed to accept delivery job:', error);
            Alert.alert("Error", error.message || "Failed to accept delivery job");
        }
    }, [incomingDeliveryJob, joinOrderRoom, removeDeliveryJob, navigation, setActiveOrder, setOrderStatus, clearActiveOrder]);

    // Reject delivery job
    const rejectDeliveryJob = useCallback(async () => {
        if (!incomingDeliveryJob) return;
        
        try {
            console.log(`❌ Rejecting delivery job: ${incomingDeliveryJob.orderId}`);
            
            // Call API to reject the job
            await riderService.rejectDeliveryJob(incomingDeliveryJob.orderId);
            
            // Remove from delivery jobs
            removeDeliveryJob(incomingDeliveryJob.orderId);
            setIncomingDeliveryJob(null);
            setDeliveryJobTimer(60);
            
            Alert.alert("Job Rejected", "Order will be assigned to another rider.");
            
        } catch (error: any) {
            console.error('Failed to reject delivery job:', error);
            Alert.alert("Error", error.message || "Failed to reject delivery job");
        }
    }, [incomingDeliveryJob, removeDeliveryJob]);

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
                    clearActiveOrder();
                } else {
                    setOrderStatus(status);
                    if (status === 'delivered') {
                        clearActiveOrder();
                    }
                }
            }
        });
    }, [navigation, setActiveOrder, setOrderStatus, clearActiveOrder]);

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

    // 🚀 NEW: Enhanced order actions with API calls
    const onPickedUp = useCallback(async () => {
        if (!activeOrder) return;
        
        try {
            // Call API to mark as picked up
            await riderService.markOrderPickedUp(activeOrder.id);
            
            // Emit WebSocket event
            markOrderPickedUp(activeOrder.id);
            
            setOrderStatus('picked_up');
            Alert.alert("Picked Up", "Order collected from vendor. Navigate to customer for delivery.");
            
        } catch (error: any) {
            console.error('Failed to mark order as picked up:', error);
            Alert.alert("Error", error.message || "Failed to update order status");
        }
    }, [activeOrder, markOrderPickedUp, setOrderStatus]);

    const onDelivered = useCallback(async () => {
        if (!activeOrder) return;
        
        try {
            // Call API to mark as delivered
            await riderService.markOrderDelivered(activeOrder.id);
            
            // Emit WebSocket event
            markOrderDelivered(activeOrder.id);
            
            // Leave the order room
            leaveOrderRoom(activeOrder.id);
            
            // 🚀 CRITICAL: Clear active order to allow new orders
            clearActiveOrder();
            
            Alert.alert("Delivered", "Order completed successfully! Earnings updated.");
            
        } catch (error: any) {
            console.error('Failed to mark order as delivered:', error);
            Alert.alert("Error", error.message || "Failed to update order status");
        }
    }, [activeOrder, markOrderDelivered, leaveOrderRoom, clearActiveOrder]);

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

    // 🚀 NEW: Convert delivery job to order format for display
    const convertDeliveryJobToOrder = useCallback((job: DeliveryJob): RiderAvailableOrder => {
        return {
            id: job.orderId,
            vendor: {
                id: job.vendor.id,
                name: job.vendor.name,
                pickupLocation: job.vendor.address,
                lat: job.vendor.lat,
                lng: job.vendor.lng
            },
            dropoffAddress: job.customer.address,
            dropoffLat: job.customer.lat,
            dropoffLng: job.customer.lng,
            customerName: job.customer.name,
            customerPhone: job.customer.phone,
            distanceKm: job.estimatedDistance,
            payout: job.deliveryFee,
            items: job.items,
            createdAt: new Date(job.createdAt)
        };
    }, []);

    const [isLoadingOrders, setIsLoadingOrders] = useState(false);

    // 🚀 ENHANCED: Debug function to check system status
    const debugSystemStatus = useCallback(async () => {
        console.log('🔍 DEBUG: System Status Check');
        console.log('  - isOnline:', isOnline);
        console.log('  - isAvailable:', isAvailable);
        console.log('  - connectionStatus:', connectionStatus);
        console.log('  - isConnected:', isConnected);
        console.log('  - socket connected:', socket?.connected);
        console.log('  - deliveryJobs count:', Object.keys(deliveryJobs).length);
        console.log('  - activeDeliveryJobs count:', activeDeliveryJobs.length);
        console.log('  - incomingDeliveryJob:', incomingDeliveryJob ? incomingDeliveryJob.orderId : 'none');
        console.log('  - activeOrder:', activeOrder ? activeOrder.id : 'none');
        console.log('  - hasActiveOrder:', hasActiveOrder());
        console.log('  - canReceiveNewOrders:', canReceiveNewOrders());
        
        // Test API calls
        try {
            const riderStatus = await riderService.getRiderStatus();
            console.log('📊 Rider Status from API:', riderStatus);
        } catch (error) {
            console.error('❌ Failed to get rider status:', error);
        }
        
        try {
            const orders = await riderService.getRiderOrders();
            console.log('📦 Orders from API:', orders);
        } catch (error) {
            console.error('❌ Failed to get orders:', error);
        }
    }, [isOnline, isAvailable, connectionStatus, isConnected, socket, deliveryJobs, activeDeliveryJobs, incomingDeliveryJob, activeOrder, hasActiveOrder, canReceiveNewOrders]);

    return (
        <SafeAreaWrapper>
            <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                {/* Enhanced Top Bar */}
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

                    {/* Enhanced Earnings Summary with Connection Status */}
                    <View style={{ alignItems: "center", flex: 1 }}>
                        <Text style={{ fontSize: 20, fontWeight: "800", color: theme.colors.text }}>
                            ₦{(user?.rider?.earnings || 0).toLocaleString()}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                            <Text style={{ fontSize: 12, color: theme.colors.muted }}>
                                {user?.rider?.completedOrders} deliveries today
                            </Text>
                            <View style={{
                                width: 6,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: connectionStatusInfo.color,
                                marginLeft: 8
                            }} />
                            <Text style={{ 
                                fontSize: 10, 
                                color: connectionStatusInfo.color, 
                                marginLeft: 4,
                                fontWeight: "600"
                            }}>
                                {connectionStatusInfo.text}
                            </Text>
                        </View>
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

                {/* Enhanced Status Toggle */}
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
                            ? (isAvailable ? "Ready to receive delivery requests" : "Busy - not accepting new orders")
                            : "Turn on to start receiving orders"
                        }
                    </Text>

                    {/* Enhanced Toggle Controls */}
                    <View style={{ width: "100%", gap: 12 }}>
                        {/* Online/Offline Toggle */}
                        <View style={{ 
                            flexDirection: "row", 
                            alignItems: "center", 
                            justifyContent: "space-between",
                            backgroundColor: theme.colors.background,
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: theme.colors.border
                        }}>
                            <Text style={{ 
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

                        {/* Availability Toggle (only show when online) */}
                        {isOnline && (
                            <View style={{ 
                                flexDirection: "row", 
                                alignItems: "center",
                                justifyContent: "space-between",
                                backgroundColor: theme.colors.background,
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: theme.colors.border
                            }}>
                                <Text style={{ 
                                    fontSize: 16, 
                                    fontWeight: "600",
                                    color: theme.colors.text 
                                }}>
                                    {isAvailable ? "Available" : "Busy"}
                                </Text>
                                <Switch
                                    value={isAvailable}
                                    onValueChange={handleToggleAvailability}
                                    trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
                                    thumbColor={isAvailable ? "white" : theme.colors.muted}
                                    style={{ transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }] }}
                                />
                            </View>
                        )}

                        {/* Location Status */}
                        <View style={{
                            backgroundColor: theme.colors.background,
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: theme.colors.border,
                            alignItems: "center"
                        }}>
                            <Text style={{ 
                                fontSize: 14, 
                                fontWeight: "600", 
                                color: theme.colors.text,
                                marginBottom: 8
                            }}>
                                Location Status
                            </Text>
                            <LocationStatusIndicator />
                            <Text style={{ 
                                fontSize: 12, 
                                color: color,
                                marginTop: 4,
                                textAlign: "center"
                            }}>
                                {message}
                            </Text>
                            {riderLocation && (
                                <Text style={{ 
                                    fontSize: 10, 
                                    color: theme.colors.muted,
                                    marginTop: 2,
                                    textAlign: "center"
                                }}>
                                    📍 {riderLocation.latitude.toFixed(4)}, {riderLocation.longitude.toFixed(4)}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

                {/* 🚀 NEW: Available Jobs Section - Only show if can receive new orders */}
                {canReceiveNewOrders() && activeDeliveryJobs.length > 0 && (
                    <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text, marginBottom: 12 }}>
                            Available Jobs ({activeDeliveryJobs.length})
                        </Text>
                        <FlatList
                            data={activeDeliveryJobs}
                            keyExtractor={(item) => item.orderId}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            renderItem={({ item }) => {
                                const order = convertDeliveryJobToOrder(item);
                                return (
                                    <Pressable
                                        style={{
                                            backgroundColor: theme.colors.surface,
                                            borderRadius: 12,
                                            padding: 16,
                                            marginRight: 12,
                                            width: 280,
                                            borderLeftWidth: 4,
                                            borderLeftColor: theme.colors.primary
                                        }}
                                        onPress={() => {
                                            setIncomingDeliveryJob(item);
                                            setDeliveryJobTimer(60);
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.text }}>
                                                    {item.vendor.name} → {item.customer.name}
                                                </Text>
                                                <Text style={{ fontSize: 14, color: theme.colors.muted, marginTop: 4 }}>
                                                    {item.estimatedDistance.toFixed(1)}km • ₦{item.deliveryFee}
                                                </Text>
                                                <Text style={{ fontSize: 12, color: theme.colors.muted, marginTop: 2 }}>
                                                    {item.items.length} items
                                                </Text>
                                            </View>
                                            <Text style={{ fontSize: 12, color: theme.colors.muted }}>
                                                {Math.floor((item.expiresIn - (Date.now() - new Date(item.createdAt).getTime()) / 1000) / 60)}m left
                                            </Text>
                                        </View>
                                    </Pressable>
                                );
                            }}
                        />
                    </View>
                )}

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
                            {/* Order Header with Navigation Button */}
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
                                    {activeOrder.customerName || 'Customer'}
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

                            {/* Action Buttons */}
                            <View style={{ flexDirection: "row", gap: 12 }}>
                                <CTAButton 
                                    title="Navigate" 
                                    onPress={startNavigation}
                                    style={{ flex: 1 }}
                                />
                                <CTAButton 
                                    title="View Details" 
                                    onPress={() => navigation.navigate('OrderDetail', { 
                                        order: activeOrder, 
                                        orderStatus: orderStatus,
                                        onStatusChange: (status: 'picked_up' | 'delivered' | 'cancelled') => {
                                            if (status === 'cancelled') {
                                                clearActiveOrder();
                                            } else {
                                                setOrderStatus(status);
                                                if (status === 'delivered') {
                                                    clearActiveOrder();
                                                }
                                            }
                                        }
                                    })}
                                    style={{ flex: 1 }}
                                />
                            </View>

                            {/* Status-specific action buttons */}
                            {orderStatus === 'going_to_pickup' && (
                                <CTAButton
                                    title="Mark as Picked Up"
                                    onPress={onPickedUp}
                                    style={{ marginTop: 12 }}
                                />
                            )}
                            {orderStatus === 'picked_up' && (
                                <CTAButton
                                    title="Mark as Delivered"
                                    onPress={onDelivered}
                                    style={{ marginTop: 12 }}
                                />
                            )}
                        </View>
                    </ScrollView>
                ) : (
                    /* Enhanced Idle State */
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

                {/*  NEW: Enhanced Delivery Job Modal */}
                <Modal
                    visible={!!incomingDeliveryJob}
                    transparent
                    animationType="fade"
                    onRequestClose={rejectDeliveryJob}
                >
                    <View style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 20
                    }}>
                        {incomingDeliveryJob && (
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
                                        New Delivery Job
                                    </Text>
                                    <CountdownTimer 
                                        seconds={deliveryJobTimer} 
                                        onComplete={handleDeliveryJobExpired} 
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
                                                {incomingDeliveryJob.vendor.name}
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
                                            {incomingDeliveryJob.estimatedDistance.toFixed(1)} km
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 14, color: theme.colors.muted, marginLeft: 44 }}>
                                        📍 {incomingDeliveryJob.vendor.address}
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
                                                {incomingDeliveryJob.customer.name}
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
                                            {incomingDeliveryJob.estimatedDistance.toFixed(1)} km
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 14, color: theme.colors.muted, marginLeft: 44 }}>
                                        🚚 {incomingDeliveryJob.customer.address}
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
                                        ₦{(incomingDeliveryJob.deliveryFee || 0).toLocaleString()}
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
                                        onPress={rejectDeliveryJob}
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
                                        onPress={acceptDeliveryJob}
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
                                            Accept Job
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        )}
                    </View>
                </Modal>

                {/* Enhanced New Order Popup (Fallback to mock system) */}
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