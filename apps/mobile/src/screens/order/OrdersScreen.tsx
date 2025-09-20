import { FlatList, Pressable, Text, View } from 'react-native'
import { useTheme } from '../../theme/theme'
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMemo, useState } from 'react';
import { FilterType, Order } from '../../types/order';
import { mockOrders } from '../../lib/mockOrders';
import OrderCard from '../../ui/OrderCard';
import { Icon } from '../../ui/Icon';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';

type OrdersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AppTabs'>;

export default function OrdersScreen() {
    const theme = useTheme()
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<OrdersScreenNavigationProp>();
    const [filter, setFilter] = useState<FilterType>('all');

    const { activeOrders, pastOrders } = useMemo(() => {
        const active = mockOrders.filter(order => 
            ['pending', 'preparing', 'out_for_delivery'].includes(order.status)
        );
        const past = mockOrders.filter(order => 
            ['delivered', 'cancelled'].includes(order.status)
        );
        return { activeOrders: active, pastOrders: past };
    }, []);

    const filteredOrders = useMemo(() => {
        switch (filter) {
            case 'active': return activeOrders;
            case 'past': return pastOrders;
            default: return [...activeOrders, ...pastOrders];
        }
    }, [filter, activeOrders, pastOrders]);

    const handleOrderPress = (order: Order) => {
        navigation.navigate('OrderDetail', { orderId: order.id } as any);
    };

    const renderOrder = ({ item }: { item: Order }) => (
        <OrderCard
            order={item}
            onPress={() => handleOrderPress(item)}
        />
    );
    
    const renderEmptyState = () => (
        <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
        }}>
            <Icon name="receipt-outline" size={64} color={theme.colors.muted} />
            <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: theme.colors.text,
                marginTop: 16,
                marginBottom: 8,
            }}>
                No orders yet
            </Text>
            <Text style={{
                fontSize: 14,
                color: theme.colors.muted,
                textAlign: 'center',
            }}>
                {filter === 'active' 
                    ? 'You don\'t have any active orders'
                    : 'You haven\'t placed any orders yet'
                }
            </Text>
        </View>
    );
    
    return (
        <View style={{ 
            flex: 1, 
            backgroundColor: theme.colors.background,
            paddingTop: 10,
        }}>
            {/* Header */}
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 16,
                marginBottom: 20,
            }}>
                <Text style={{
                    fontSize: 24,
                    fontWeight: '700',
                    color: theme.colors.text,
                }}>
                    My Orders
                </Text>

                <View style={{
                    flexDirection: 'row',
                    backgroundColor: theme.colors.surface,
                    borderRadius: 8,
                    padding: 2,
                }}>
                    {(['all', 'active', 'past'] as FilterType[]).map((filterType) => (
                        <Pressable
                            key={filterType}
                            onPress={() => setFilter(filterType)}
                            style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                marginHorizontal: 3,
                                borderRadius: 6,
                                backgroundColor: filter === filterType ? theme.colors.primary : 'transparent',
                            }}
                        >
                            <Text style={{
                                fontSize: 12,
                                fontWeight: '600',
                                color: filter === filterType ? 'white' : theme.colors.muted,
                                textTransform: 'capitalize',
                            }}>
                                {filterType}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* Orders List */}
            {filteredOrders.length > 0 ? (
                <FlatList
                    data={filteredOrders}
                    renderItem={renderOrder}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            ) : (
                renderEmptyState()
            )}
        </View>
    )
}