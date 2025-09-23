import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../theme/theme';
import { SafeAreaWrapper } from '../../ui/SafeAreaWrapper';
import { Icon } from '../../ui/Icon';
import { AppTabParamList } from '../../navigation/types';

type HistoryScreenNavigationProp = NativeStackNavigationProp<AppTabParamList, 'History'>;

// Mock completed order data for history
interface RiderCompletedOrder {
    id: string;
    orderNumber: string;
    vendorName: string;
    customerName: string;
    payout: number;
    status: 'completed' | 'cancelled';
    completedAt: Date;
    distance: number;
}

// Mock data - in real app, fetch from API
const mockCompletedOrders: RiderCompletedOrder[] = [
    {
        id: '1',
        orderNumber: 'QB-001234',
        vendorName: 'Chicken Republic',
        customerName: 'John Doe',
        payout: 850,
        status: 'completed',
        completedAt: new Date('2024-01-15T14:30:00'),
        distance: 2.3
    },
    {
        id: '2',
        orderNumber: 'QB-001233',
        vendorName: 'Pizza Palace',
        customerName: 'Jane Smith',
        payout: 1200,
        status: 'completed',
        completedAt: new Date('2024-01-15T12:15:00'),
        distance: 3.1
    },
    {
        id: '3',
        orderNumber: 'QB-001232',
        vendorName: 'Burger King',
        customerName: 'Mike Johnson',
        payout: 0,
        status: 'cancelled',
        completedAt: new Date('2024-01-15T10:45:00'),
        distance: 1.8
    },
    {
        id: '4',
        orderNumber: 'QB-001231',
        vendorName: 'KFC',
        customerName: 'Sarah Wilson',
        payout: 950,
        status: 'completed',
        completedAt: new Date('2024-01-14T18:20:00'),
        distance: 2.7
    },
    {
        id: '5',
        orderNumber: 'QB-001230',
        vendorName: 'Subway',
        customerName: 'David Brown',
        payout: 750,
        status: 'completed',
        completedAt: new Date('2024-01-14T16:10:00'),
        distance: 1.9
    }
];

export default function HistoryScreen() {
    const theme = useTheme();
    const navigation = useNavigation<HistoryScreenNavigationProp>();
    const [orders] = useState<RiderCompletedOrder[]>(mockCompletedOrders);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        // In real app, fetch from API
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    }, []);

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) {
            return 'Today';
        } else if (days === 1) {
            return 'Yesterday';
        } else if (days < 7) {
            return `${days} days ago`;
        } else {
            return date.toLocaleDateString('en-NG', { 
                month: 'short', 
                day: 'numeric' 
            });
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-NG', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };

    const handleOrderPress = useCallback((order: RiderCompletedOrder) => {
        // Navigate to read-only order detail using parent navigator
        (navigation as any).getParent()?.navigate('OrderHistoryDetail', { orderId: order.id });
    }, [navigation]);

    const renderOrderItem = ({ item }: { item: RiderCompletedOrder }) => {
        const isCompleted = item.status === 'completed';
        
        return (
            <Pressable
                onPress={() => handleOrderPress(item)}
                style={{
                    backgroundColor: theme.colors.surface,
                    marginHorizontal: 16,
                    marginVertical: 4,
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    flexDirection: 'row',
                    alignItems: 'center'
                }}
            >
                {/* Status Indicator */}
                <View style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: isCompleted ? '#10b981' : theme.colors.muted,
                    marginRight: 12
                }} />

                {/* Order Info */}
                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text style={{ 
                            fontSize: 14, 
                            fontWeight: '600', 
                            color: theme.colors.text 
                        }}>
                            {item.orderNumber}
                        </Text>
                        <Text style={{ 
                            fontSize: 16, 
                            fontWeight: '700', 
                            color: isCompleted ? theme.colors.primary : theme.colors.muted 
                        }}>
                            {isCompleted ? `₦${item.payout.toLocaleString()}` : '₦0'}
                        </Text>
                    </View>
                    
                    <Text style={{ 
                        fontSize: 13, 
                        color: theme.colors.text,
                        marginBottom: 2
                    }}>
                        {item.vendorName} → {item.customerName}
                    </Text>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ 
                            fontSize: 12, 
                            color: isCompleted ? '#10b981' : theme.colors.muted,
                            fontWeight: '600'
                        }}>
                            {isCompleted ? 'Completed' : 'Cancelled'}
                        </Text>
                        <Text style={{ 
                            fontSize: 12, 
                            color: theme.colors.muted 
                        }}>
                            {formatDate(item.completedAt)} • {formatTime(item.completedAt)}
                        </Text>
                    </View>
                </View>

                {/* Arrow */}
                <Icon 
                    name="chevron-forward" 
                    size={16} 
                    color={theme.colors.muted} 
                    style={{ marginLeft: 8 }}
                />
            </Pressable>
        );
    };

    const renderEmptyState = () => (
        <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32
        }}>
            <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: theme.colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                borderWidth: 2,
                borderColor: theme.colors.border
            }}>
                <Icon name="document-text" size={32} color={theme.colors.muted} />
            </View>
            <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: theme.colors.text,
                marginBottom: 8,
                textAlign: 'center'
            }}>
                No Order History
            </Text>
            <Text style={{
                fontSize: 14,
                color: theme.colors.muted,
                textAlign: 'center',
                lineHeight: 20
            }}>
                Complete your first delivery to see your order history here
            </Text>
        </View>
    );

    const totalEarnings = orders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + order.payout, 0);

    const completedCount = orders.filter(order => order.status === 'completed').length;
    const cancelledCount = orders.filter(order => order.status === 'cancelled').length;

    return (
        <SafeAreaWrapper>
            <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                {/* Header */}
                <View style={{
                    backgroundColor: theme.colors.surface,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border
                }}>
                    <Text style={{
                        fontSize: 24,
                        fontWeight: '700',
                        color: theme.colors.text,
                        marginBottom: 16
                    }}>
                        Order History
                    </Text>

                    {/* Stats */}
                    <View style={{ flexDirection: 'row', gap: 16 }}>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, color: theme.colors.muted, marginBottom: 2 }}>
                                Total Earnings
                            </Text>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.primary }}>
                                ₦{totalEarnings.toLocaleString()}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, color: theme.colors.muted, marginBottom: 2 }}>
                                Completed
                            </Text>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: '#10b981' }}>
                                {completedCount}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 12, color: theme.colors.muted, marginBottom: 2 }}>
                                Cancelled
                            </Text>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.muted }}>
                                {cancelledCount}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Orders List */}
                {orders.length > 0 ? (
                    <FlatList
                        data={orders}
                        renderItem={renderOrderItem}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingVertical: 8 }}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={[theme.colors.primary]}
                                tintColor={theme.colors.primary}
                            />
                        }
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    renderEmptyState()
                )}
            </View>
        </SafeAreaWrapper>
    );
}
