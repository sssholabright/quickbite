import { Text, View } from "react-native";
import { useTheme } from "../../theme/theme";
import { Icon } from "../../ui/Icon";
import { OrderSummaryProps } from "../../types/order";

export default function OrderSummary({ items, vendor, total}: OrderSummaryProps) {
    const theme = useTheme()

    return (
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
                Order Summary
            </Text>

            {/* Vendor Info */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 16,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.border,
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
                        {vendor.name}
                    </Text>
                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.muted,
                    }}>
                        {vendor.distance} • {vendor.eta}
                    </Text>
                </View>
            </View>

            {/* Items */}
            {items.map((item: any) => (
                <View
                    key={item.id}
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingVertical: 8,
                    }}
                >
                    <Text style={{
                        fontSize: 14,
                        color: theme.colors.text,
                        flex: 1,
                    }}>
                        {item.quantity}x {item.name}
                    </Text>
                    <Text style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: theme.colors.text,
                    }}>
                        ${(item.price * item.quantity).toFixed(2)}
                    </Text>
                </View>
            ))}

            {/* Total */}
            <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 12,
                paddingTop: 12,
                borderTopWidth: 1,
                borderTopColor: theme.colors.border,
            }}>
                <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: theme.colors.text,
                }}>
                    Total
                </Text>
                <Text style={{
                    fontSize: 18,
                    fontWeight: '700',
                    color: theme.colors.primary,
                }}>
                    ${total.toFixed(2)}
                </Text>
            </View>
        </View>
    )
}