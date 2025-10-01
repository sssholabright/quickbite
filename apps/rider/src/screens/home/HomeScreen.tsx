import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { FlatList, Pressable, ScrollView, Text, View, Switch, Modal, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../theme/theme";
import { SafeAreaWrapper } from "../../ui/SafeAreaWrapper";
import { Icon } from "../../ui/Icon";
import { CTAButton } from "../../ui/CTAButton";
import { UnifiedOrder } from "../../types/order";
import { RootStackParamList } from "../../navigation/types";
import { LocationStatusIndicator } from '../../components/LocationStatusIndicator';
import { useLocationStatus } from '../../hooks/useLocationStatus';
import { useRiderStore } from '../../stores/rider';
import { useAuthStore } from '../../stores/auth';
import { useOrderStore } from '../../stores/order';
import { useSocketContext } from '../../contexts/SocketContext';
import { useRealtimeStore, DeliveryJob } from '../../stores/realtime';
import riderService from '../../services/riderService';
import { useLocationStore } from '../../stores/location';
import AlertModal from '../../ui/AlertModal'; 
import { DataTransform } from '../../utils/dataTransform';
import { TimerUtils } from '../../utils/timerUtils';
import { ErrorHandler } from '../../utils/errorHandler';

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
    const { isOnline, setOnlineStatus } = useRiderStore();
    
    // Order state management
    const { 
        activeOrder, 
        orderStatus, 
        setActiveOrder, 
        setOrderStatus, 
        clearActiveOrder,
        hasActiveOrder,
        canReceiveNewOrders 
    } = useOrderStore();

    const { socket, isConnected, connectionStatus, joinOrderRoom } = useSocketContext();
    
    const { deliveryJobs, getActiveDeliveryJobs, removeDeliveryJob } = useRealtimeStore();

    //  NEW: Alert modal state
    const [alertModal, setAlertModal] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info' as 'success' | 'error' | 'warning' | 'info',
        onConfirm: () => {},
        onCancel: undefined as (() => void) | undefined,
        confirmText: 'OK',
        cancelText: 'Cancel',
        showCancel: false
    });

    // 🚀 NEW: Helper function to show alert modal
    const showAlert = useCallback((
        title: string,
        message: string,
        type: 'success' | 'error' | 'warning' | 'info' = 'info',
        onConfirm: () => void = () => {},
        onCancel?: () => void,
        confirmText: string = 'OK',
        cancelText: string = 'Cancel',
        showCancel: boolean = false
    ) => {
        setAlertModal({
            visible: true,
            title,
            message,
            type,
            onConfirm: () => {
                setAlertModal(prev => ({ ...prev, visible: false }));
                onConfirm();
            },
            onCancel: onCancel ? () => {
                setAlertModal(prev => ({ ...prev, visible: false }));
                onCancel();
            } : undefined,
            confirmText,
            cancelText,
            showCancel
        });
    }, []);

    const getConnectionStatusInfo = () => {
        // 🚀 IMPROVED: Better connection status detection
        if (isConnected && connectionStatus === 'connected') {
            return { color: '#10b981', text: 'Connected', icon: 'wifi' };
        }
        if (connectionStatus === 'reconnecting') {
            return { color: '#f59e0b', text: 'Reconnecting', icon: 'refresh' };
        }
        return { color: '#ef4444', text: 'Disconnected', icon: 'wifi-off' };
    };

    const connectionStatusInfo = getConnectionStatusInfo();

    const [activeDeliveryJobs, setActiveDeliveryJobs] = useState<DeliveryJob[]>([]);
    const [incomingDeliveryJob, setIncomingDeliveryJob] = useState<DeliveryJob | null>(null);
    // 🚀 IMPROVED: Use timer from backend data instead of hardcoded values
    const [deliveryJobTimer, setDeliveryJobTimer] = useState(0);
    
    // 🚀 IMPROVED: Calculate timer from backend data
    const calculateTimeLeft = useCallback((job: DeliveryJob) => {
        return TimerUtils.calculateTimeLeft(job);
    }, []);

    const { currentLocation, sendInitialLocation, updateLocationForDelivery } = useLocationStore();
    
    const riderLocation = currentLocation || { latitude: 6.5244, longitude: 3.3792 };
    
    useEffect(() => {
        if (isOnline && currentLocation) {
            console.log('📍 Rider is online, sending initial location to backend');
            sendInitialLocation();
        }
    }, [isOnline, currentLocation, sendInitialLocation]);
    
    useEffect(() => {
        if (!isOnline || !activeOrder || (orderStatus !== 'picked_up' && orderStatus !== 'delivering')) {
            return;
        }
        
        
        const interval = setInterval(() => {
            updateLocationForDelivery(activeOrder.id); // Use the new method with order context
        }, 30000); // 30 seconds interval
        
        return () => {
            clearInterval(interval);
        };
    }, [isOnline, activeOrder, orderStatus, updateLocationForDelivery]);

    useEffect(() => {
        const checkExistingOrders = async () => {
            if (!isOnline || hasActiveOrder()) {
                return;
            }

            try {
                const ordersData = await riderService.getRiderOrders();
                
                if (ordersData?.orders && ordersData.orders.length > 0) {
                    // Filter out delivered orders
                    const undeliveredOrders = ordersData.orders.filter((order: any) => 
                        !['DELIVERED', 'CANCELLED'].includes(order.status)
                    );
                    
                    if (undeliveredOrders.length > 0) {
                        const assignedOrder = undeliveredOrders[0];
                        
                        // 🚀 FIXED: Use unified data transformation
                        const activeOrderData = DataTransform.transformOrder(assignedOrder);
                        
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
                    }
                }
            } catch (error: any) {
                ErrorHandler.logError(error, 'checkExistingOrders');
            }
        };
        
        checkExistingOrders();
    }, [isOnline, hasActiveOrder, setActiveOrder, setOrderStatus]);

    // 🚀 IMPROVED: Update active delivery jobs with backend timer
    useEffect(() => {
        if (!isConnected || connectionStatus !== 'connected' || !canReceiveNewOrders()) {
            return;
        }

        const jobs = getActiveDeliveryJobs();
        setActiveDeliveryJobs(jobs);
        
        if (incomingDeliveryJob && !jobs.find(job => job.orderId === incomingDeliveryJob.orderId)) {
            setIncomingDeliveryJob(null);
            setDeliveryJobTimer(0);
        }
        
        if (jobs.length > 0 && !incomingDeliveryJob && !hasActiveOrder()) {
            const latestJob = jobs[jobs.length - 1];
            setIncomingDeliveryJob(latestJob);
            // 🚀 IMPROVED: Use timer from backend data
            setDeliveryJobTimer(calculateTimeLeft(latestJob));
        }
    }, [deliveryJobs, getActiveDeliveryJobs, incomingDeliveryJob, hasActiveOrder, canReceiveNewOrders, isOnline, connectionStatus, isConnected, calculateTimeLeft]);

    // 🚀 IMPROVED: Handle delivery job timer using backend data
    useEffect(() => {
        if (!incomingDeliveryJob) return;
        
        const timer = setInterval(() => {
            const timeLeft = calculateTimeLeft(incomingDeliveryJob);
            setDeliveryJobTimer(timeLeft);
            
            if (timeLeft <= 0) {
                handleDeliveryJobExpired();
            }
        }, 1000);
        
        return () => clearInterval(timer);
    }, [incomingDeliveryJob, calculateTimeLeft]);

    // 🚀 IMPROVED: Handle delivery job expiration
    const handleDeliveryJobExpired = useCallback(() => {
        if (incomingDeliveryJob) {
            removeDeliveryJob(incomingDeliveryJob.orderId);
            setIncomingDeliveryJob(null);
            setDeliveryJobTimer(0);
        }
    }, [incomingDeliveryJob, removeDeliveryJob]);

    // 🚀 IMPROVED: Accept delivery job using backend timer
    const acceptDeliveryJob = useCallback(async () => {
        if (!incomingDeliveryJob) return;
        
        try {
            await riderService.acceptDeliveryJob(incomingDeliveryJob.orderId);
            joinOrderRoom(incomingDeliveryJob.orderId);
            
            // 🚀 FIXED: Use unified data transformation
            const activeOrderData = DataTransform.transformDeliveryJob(incomingDeliveryJob);

            showAlert(
                "Job Accepted", 
                "You have accepted the delivery job. Navigate to the vendor to pick up the order.",
                'success'
            );

            setActiveOrder(activeOrderData);
            setOrderStatus('going_to_pickup');
            
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
            
            setIncomingDeliveryJob(null);
            setDeliveryJobTimer(0);
            removeDeliveryJob(incomingDeliveryJob.orderId);
            
        } catch (error: any) {
            ErrorHandler.logError(error, 'acceptDeliveryJob');
            showAlert(
                "Error", 
                ErrorHandler.handleApiError(error, 'accept delivery job'),
                'error'
            );
        }
    }, [incomingDeliveryJob, joinOrderRoom, removeDeliveryJob, navigation, setActiveOrder, setOrderStatus, clearActiveOrder, showAlert]);

    // 🚀 IMPROVED: Reject delivery job
    const rejectDeliveryJob = useCallback(async () => {
        if (!incomingDeliveryJob) return;
        
        try {
            await riderService.rejectDeliveryJob(incomingDeliveryJob.orderId);
            removeDeliveryJob(incomingDeliveryJob.orderId);
            setIncomingDeliveryJob(null);
            setDeliveryJobTimer(0);
            
            showAlert(
                "Job Rejected", 
                "Order will be assigned to another rider.",
                'info'
            );
            
        } catch (error: any) {
            ErrorHandler.logError(error, 'rejectDeliveryJob');
            showAlert(
                "Error", 
                ErrorHandler.handleApiError(error, 'reject delivery job'),
                'error'
            );
        }
    }, [incomingDeliveryJob, removeDeliveryJob, showAlert]);

    // Toggle online status
    const handleToggleOnline = async () => {
        try {
            await setOnlineStatus(!isOnline);
        } catch (error) {
            console.error('Failed to toggle online status:', error);
        }
    };

    // Convert delivery job to order format for display
    // 🚀 REMOVED: convertDeliveryJobToOrder function - now using DataTransform

    // Set up notification listeners
    useEffect(() => {
        // 🚀 REMOVED: Duplicate notification listeners - now handled in useSocket.ts
    }, []);

    // Add a ref to track shown notifications
    const shownNotifications = useRef(new Set<string>());

    // Handle new delivery jobs with socket events
    useEffect(() => {
        // 🚀 REMOVED: Duplicate socket event listeners - now handled in useSocket.ts
    }, [socket]);

    return (
        <SafeAreaWrapper>
            <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                {/* Enhanced Status Bar with Location */}
                <View style={{
                    // backgroundColor: theme.colors.surface,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}>
                    {/* Current Location */}
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 16, fontWeight: "600", color: theme.colors.text }}>
                            {`Welcome back${user?.name ? ', ' + user.name.split(' ')[0] : ''}!`}
                        </Text>
                    </View>

                    {/* Connection Status */}
                    <View style={{ alignItems: "center" }}>
                            <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                                backgroundColor: connectionStatusInfo.color,
                            marginBottom: 4
                            }} />
                            <Text style={{ 
                                fontSize: 10, 
                                color: connectionStatusInfo.color, 
                                fontWeight: "600"
                            }}>
                                {connectionStatusInfo.text}
                            </Text>
                    </View>

                    {/* Online Status Indicator */}
                    <View style={{ alignItems: "center", marginLeft: 16 }}>
                        <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: isOnline ? '#10b981' : '#ef4444',
                            marginBottom: 4
                        }} />
                                <Text style={{ 
                                    fontSize: 10, 
                            color: isOnline ? '#10b981' : '#ef4444', 
                            fontWeight: "600"
                        }}>
                            {isOnline ? "ONLINE" : "OFFLINE"}
                        </Text>
                    </View>
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
                        width: 70,
                        height: 70,
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
                        fontSize: 16, 
                        fontWeight: "700", 
                        color: theme.colors.text,
                        marginBottom: 8 
                    }}>
                        {isOnline ? "You're Online" : "You're Offline"}
                    </Text>
                    <Text style={{ 
                        fontSize: 12, 
                        color: theme.colors.muted,
                        textAlign: "center",
                        marginBottom: 16
                    }}>
                        {isOnline 
                            ? ("Ready to receive delivery requests")
                            : "Turn on to start receiving orders"
                        }
                    </Text>

                    {/* Toggle Controls */}
                    <View style={{ width: "100%", gap: 12 }}>
                        {/* Online/Offline Toggle */}
                        <View style={{ 
                            flexDirection: "row", 
                            alignItems: "center", 
                            justifyContent: "space-between",
                            backgroundColor: theme.colors.background,
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: theme.colors.border
                        }}>
                            <Text style={{ 
                                fontSize: 14, 
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
                                style={{ transform: [{ scaleX: 1.0 }, { scaleY: 1.0 }] }}
                            />
                        </View>

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
                        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.text, marginBottom: 12 }}>
                            Available Jobs ({activeDeliveryJobs.length})
                        </Text>
                        <FlatList
                            data={activeDeliveryJobs}
                            keyExtractor={(item) => item.orderId}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            renderItem={({ item }) => {
                                const timeLeft = calculateTimeLeft(item); // 🚀 IMPROVED: Use backend timer calculation
                                
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
                                            setDeliveryJobTimer(calculateTimeLeft(item)); // 🚀 IMPROVED: Use backend timer
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
                                            <Text style={{ 
                                                fontSize: 12, 
                                                color: TimerUtils.isExpiringSoon(item) ? '#ef4444' : theme.colors.muted,
                                                fontWeight: TimerUtils.isExpiringSoon(item) ? '600' : 'normal'
                                            }}>
                                                {TimerUtils.formatTimeLeft(timeLeft)}
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
                                    width: 35,
                                    height: 35,
                                    borderRadius: 12,
                                    backgroundColor: theme.colors.background,
                                    alignItems: "center",
                                    justifyContent: "center",
                                    marginRight: 12
                                }}>
                                    <Icon name="restaurant" size={20} color={theme.colors.primary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 14, fontWeight: "700", color: theme.colors.text }}>
                                        Active Delivery
                                    </Text>
                                    <Text style={{ fontSize: 12, color: theme.colors.muted }}>
                                        Order #{activeOrder.orderNumber}
                                    </Text>
                                </View>
                                <View style={{
                                    paddingHorizontal: 10,
                                    paddingVertical: 6,
                                    borderRadius: 20,
                                    backgroundColor: orderStatus === 'delivered' ? '#10b981' + '15' : '#f59e0b' + '15'
                                }}>
                                    <Text style={{
                                        fontSize: 10,
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
                                <Text style={{ fontSize: 12, fontWeight: "600", color: theme.colors.text, marginBottom: 4 }}>
                                    Pickup from:
                                </Text>
                                <Text style={{ fontSize: 14, fontWeight: "700", color: theme.colors.primary }}>
                                    {activeOrder.vendor.name}
                                </Text>
                                <Text style={{ fontSize: 12, color: theme.colors.muted }}>
                                    {activeOrder.vendor.pickupLocation || 'Vendor Location'}
                                </Text>
                            </View>

                            {/* Delivery Location */}
                            <View style={{ marginBottom: 10 }}>
                                <Text style={{ fontSize: 12, fontWeight: "600", color: theme.colors.text, marginBottom: 4 }}>
                                    Deliver to:
                                </Text>
                                <Text style={{ fontSize: 14, fontWeight: "700", color: '#ef4444' }}>
                                    {activeOrder.customer.name || 'Customer'}
                                </Text>
                                <Text style={{ fontSize: 12, color: theme.colors.muted }}>
                                    {activeOrder.customer.address || 'Customer Location'}
                                </Text>
                            </View>

                            {/* Action Buttons */}
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
                                style={{ flex: 1, borderRadius: 5, paddingVertical: 10 }}
                            />
                        </View>
                    </ScrollView>
                ) : (
                    /* Idle State */
                    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 32 }}>
                        {isOnline ? (
                            <View style={{ alignItems: "center" }}>
                                <View style={{
                                    width: 100,
                                    height: 100,
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
                                    fontSize: 20, 
                                    fontWeight: "700", 
                                    color: theme.colors.text,
                                    marginBottom: 8 
                                }}>
                                    Waiting for Orders...
                                </Text>
                                <Text style={{ 
                                    fontSize: 14, 
                                    color: theme.colors.muted,
                                    textAlign: "center",
                                    lineHeight: 24
                                }}>
                                    Stay online and you'll receive delivery requests nearby
                                </Text>
                            </View>
                        ) : (
                            <View style={{ alignItems: "center" }}>
                                <View style={{
                                    width: 100,
                                    height: 100,
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
                                    fontSize: 20, 
                                    fontWeight: "700", 
                                    color: theme.colors.text,
                                    marginBottom: 8 
                                }}>
                                    You're Offline
                                </Text>
                                <Text style={{ 
                                    fontSize: 14, 
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

                {/*  Delivery Job Modal */}
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
                                        fontSize: 18,
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

                                {/* Pickup Info */}
                                <View style={{
                                    backgroundColor: theme.colors.background,
                                    borderRadius: 12,
                                    padding: 16,
                                    marginBottom: 16
                                }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                                        <View style={{
                                            width: 28,
                                            height: 32,
                                            borderRadius: 8,
                                            backgroundColor: theme.colors.primary + '15',
                                            alignItems: "center",
                                            justifyContent: "center",
                                            marginRight: 12
                                        }}>
                                            <Icon name="restaurant" size={14} color={theme.colors.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 9, color: theme.colors.muted, marginBottom: 2 }}>
                                                PICKUP FROM
                                            </Text>
                                            <Text style={{ fontSize: 16, fontWeight: "800", color: theme.colors.text }}>
                                                {incomingDeliveryJob.vendor.name}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={{ fontSize: 12, color: theme.colors.muted, marginLeft: 44 }}>
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
                                            width: 28,
                                            height: 32,
                                            borderRadius: 8,
                                            backgroundColor: '#ef4444' + '15',
                                            alignItems: "center",
                                            justifyContent: "center",
                                            marginRight: 12
                                        }}>
                                            <Icon name="navigate" size={14} color="#ef4444" />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 9, color: theme.colors.muted, marginBottom: 2 }}>
                                                DELIVER TO
                                            </Text>
                                            <Text style={{ fontSize: 14, fontWeight: "700", color: theme.colors.text }}>
                                                {incomingDeliveryJob.customer.name}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={{ fontSize: 12, color: theme.colors.muted, marginLeft: 44 }}>
                                        🚚 {incomingDeliveryJob.customer.address}
                                    </Text>
                                </View>

                                {/* PAYOUT INFO */}
                                <View style={{
                                    backgroundColor: theme.colors.primary + '10',
                                    borderRadius: 12,
                                    padding: 16,
                                    marginBottom: 24,
                                    alignItems: "center",
                                    borderWidth: 1,
                                    borderColor: theme.colors.primary + '30'
                                }}>
                                    <Text style={{ fontSize: 12, color: theme.colors.muted, marginBottom: 4 }}>
                                        DELIVERY FEE
                                    </Text>
                                    <Text style={{ fontSize: 28, fontWeight: "900", color: theme.colors.primary }}>
                                        ₦{(incomingDeliveryJob.deliveryFee || 0).toLocaleString()}
                                    </Text>
                                </View>

                                {/* ACTION BUTTONS */}
                                <View style={{ flexDirection: "row", gap: 16 }}>
                                    <Pressable
                                        onPress={rejectDeliveryJob}
                                        style={{
                                            flex: 0.35,
                                            paddingVertical: 10,
                                            borderRadius: 12,
                                            backgroundColor: theme.colors.background,
                                            borderWidth: 2,
                                            borderColor: theme.colors.border,
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}
                                    >
                                        <Icon name="close" size={20} color={theme.colors.muted} />
                                        <Text style={{ 
                                            fontSize: 12, 
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
                                            paddingVertical: 10,
                                            borderRadius: 12,
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
                                        <Icon name="checkmark" size={20} color="white" />
                                        <Text style={{ 
                                            fontSize: 14, 
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

                
                {/* 🚀 NEW: Custom Alert Modal */}
                <AlertModal
                    visible={alertModal.visible}
                    title={alertModal.title}
                    message={alertModal.message}
                    type={alertModal.type}
                    onConfirm={alertModal.onConfirm}
                    onCancel={alertModal.onCancel}
                    confirmText={alertModal.confirmText}
                    cancelText={alertModal.cancelText}
                    showCancel={alertModal.showCancel}
                />
            </View>
        </SafeAreaWrapper>
    );
} 