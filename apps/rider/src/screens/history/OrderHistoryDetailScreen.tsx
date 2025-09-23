import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../../theme/theme';
import { SafeAreaWrapper } from '../../ui/SafeAreaWrapper';
import { Icon } from '../../ui/Icon';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../../navigation/types';

type OrderHistoryDetailRouteProp = RouteProp<RootStackParamList, 'OrderHistoryDetail'>;

export default function OrderHistoryDetailScreen() {
    const theme = useTheme();
    const route = useRoute<OrderHistoryDetailRouteProp>();
    const { orderId } = route.params;

    // In real app, fetch order details by ID
    // For now, return a placeholder
    return (
        <SafeAreaWrapper>
            <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 16 }}>
                <View style={{
                    backgroundColor: theme.colors.surface,
                    borderRadius: 16,
                    padding: 20,
                    alignItems: 'center'
                }}>
                    <Icon name="document-text" size={48} color={theme.colors.muted} />
                    <Text style={{
                        fontSize: 18,
                        fontWeight: '600',
                        color: theme.colors.text,
                        marginTop: 16,
                        textAlign: 'center'
                    }}>
                        Order Details
                    </Text>
                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.muted,
                        marginTop: 8,
                        textAlign: 'center'
                    }}>
                        Order ID: {orderId}
                    </Text>
                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.muted,
                        marginTop: 16,
                        textAlign: 'center',
                        lineHeight: 20
                    }}>
                        Full order details will be displayed here in the real implementation
                    </Text>
                </View>
            </View>
        </SafeAreaWrapper>
    );
}
