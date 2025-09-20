import { View, Text, Pressable } from "react-native";
import { useTheme } from "../theme/theme";
import { Icon } from "../ui/Icon";
import { AvailableOrderCardProps } from "../types/order";

export default function AvailableOrderCard({ order, onPress }: AvailableOrderCardProps) {
	const theme = useTheme();
	const itemsSummary =
		order.items.length === 1
			? `${order.items[0].quantity} × ${order.items[0].name}`
			: `${order.items.reduce((a, b) => a + b.quantity, 0)} items`;

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
				borderColor: theme.colors.border
			}}
		>
			<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
				<View
					style={{
						width: 40,
						height: 40,
						borderRadius: 8,
						backgroundColor: theme.colors.background,
						alignItems: "center",
						justifyContent: "center",
						marginRight: 12
					}}
				>
					<Icon set="ion" name="restaurant" size={20} color={theme.colors.primary} />
				</View>
				<View style={{ flex: 1 }}>
					<Text style={{ fontSize: 16, fontWeight: "600", color: theme.colors.text }}>{order.vendor.name}</Text>
					<Text style={{ fontSize: 12, color: theme.colors.muted }}>{order.vendor.pickupLocation}</Text>
				</View>
				<Text style={{ fontSize: 16, fontWeight: "700", color: theme.colors.primary }}>₦{order.payout.toLocaleString()}</Text>
			</View>

			<View style={{ gap: 8 }}>
				<View style={{ flexDirection: "row", alignItems: "center" }}>
					<Icon set="ion" name="location-outline" size={16} color={theme.colors.muted} />
					<Text style={{ marginLeft: 6, fontSize: 13, color: theme.colors.text }}>
						{order.dropoffAddress} • {order.distanceKm.toFixed(1)} km
					</Text>
				</View>
				<View style={{ flexDirection: "row", alignItems: "center" }}>
					<Icon set="ion" name="cube-outline" size={16} color={theme.colors.muted} />
					<Text style={{ marginLeft: 6, fontSize: 13, color: theme.colors.muted }}>{itemsSummary}</Text>
				</View>
			</View>
		</Pressable>
	);
}