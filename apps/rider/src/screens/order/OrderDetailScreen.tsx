import React, { useMemo, useState } from "react";
import { View, Text, Pressable, Alert, Platform, Linking } from "react-native";
import { SafeAreaWrapper } from "../../ui/SafeAreaWrapper";
import { useTheme } from "../../theme/theme";
import { RiderAvailableOrder } from "../../types/order";
import { Icon } from "../../ui/Icon";
import { CTAButton } from "../../ui/CTAButton";

type Props = { route: { params: { order: RiderAvailableOrder } } };

export default function OrderDetailScreen({ route }: Props) {
	const { order } = route.params;
	const theme = useTheme();
	const [pickedUp, setPickedUp] = useState(false);
	const [delivered, setDelivered] = useState(false);

	const itemsTotalQty = useMemo(() => order.items.reduce((a, b) => a + b.quantity, 0), [order.items]);

	const openMaps = () => {
		const hasCoords = order.vendor.lat && order.vendor.lng;
		const query = hasCoords ? `${order.vendor.lat},${order.vendor.lng}` : encodeURIComponent(order.vendor.pickupLocation);
		const label = encodeURIComponent(order.vendor.name);
		const url = Platform.select({
			ios: hasCoords ? `http://maps.apple.com/?ll=${query}&q=${label}` : `http://maps.apple.com/?q=${query}`,
			android: hasCoords ? `geo:${query}?q=${query}(${label})` : `geo:0,0?q=${query}`
		});
		if (url) Linking.openURL(url).catch(() => Alert.alert("Unable to open maps"));
	};

	const callCustomer = () => {
		if (!order.customerPhone) return Alert.alert("No phone number available");
		const url = `tel:${order.customerPhone}`;
		Linking.openURL(url).catch(() => Alert.alert("Unable to start call"));
	};

	const callVendor = () => {
		Alert.alert("Vendor contact", "Vendor phone not available in mock data.");
	};

	const onPickedUp = () => {
		setPickedUp(true);
		Alert.alert("Picked Up", "Customer and vendor notified.");
		// TODO: POST /orders/:id/picked-up
	};

	const onDelivered = () => {
		setDelivered(true);
		Alert.alert("Delivered", "Order completed. Earnings updated.");
		// TODO: POST /orders/:id/delivered
	};

	return (
		<SafeAreaWrapper>
			<View style={{ padding: 16, gap: 16 }}>
				{/* Vendor */}
				<View style={{ backgroundColor: theme.colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.border, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
					<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
						<View style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: theme.colors.background, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
							<Icon set="ion" name="restaurant" size={20} color={theme.colors.primary} />
						</View>
						<View style={{ flex: 1 }}>
							<Text style={{ fontSize: 16, fontWeight: "700", color: theme.colors.text }}>{order.vendor.name}</Text>
							<Text style={{ color: theme.colors.muted }}>{order.vendor.pickupLocation}</Text>
						</View>
					</View>
					<View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
						<Pressable onPress={openMaps} style={{ flexDirection: "row", alignItems: "center" }}>
							<Icon set="ion" name="map-outline" size={18} color={theme.colors.primary} />
							<Text style={{ marginLeft: 6, color: theme.colors.primary, fontWeight: "700" }}>Open in Maps</Text>
						</Pressable>
						<Pressable onPress={callVendor} style={{ flexDirection: "row", alignItems: "center" }}>
							<Icon set="ion" name="call-outline" size={18} color={theme.colors.primary} />
							<Text style={{ marginLeft: 6, color: theme.colors.primary, fontWeight: "700" }}>Call Vendor</Text>
						</Pressable>
					</View>
				</View>

				{/* Customer */}
				<View style={{ backgroundColor: theme.colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.border, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
					<Text style={{ fontSize: 16, fontWeight: "700", color: theme.colors.text, marginBottom: 8 }}>Delivery</Text>
					<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
						<Icon set="ion" name="location-outline" size={18} color={theme.colors.muted} />
						<Text style={{ marginLeft: 6, color: theme.colors.text }}>{order.dropoffAddress}</Text>
					</View>
					<Pressable onPress={callCustomer} style={{ flexDirection: "row", alignItems: "center" }}>
						<Icon set="ion" name="call-outline" size={18} color={theme.colors.primary} />
						<Text style={{ marginLeft: 6, color: theme.colors.primary, fontWeight: "700" }}>
							{order.customerPhone ?? "No phone"}
						</Text>
					</Pressable>
				</View>

				{/* Summary */}
				<View style={{ backgroundColor: theme.colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.border }}>
					<Text style={{ fontSize: 16, fontWeight: "700", color: theme.colors.text, marginBottom: 8 }}>Items ({itemsTotalQty})</Text>
					{order.items.map(i => (
						<Text key={i.id} style={{ color: theme.colors.muted, marginBottom: 2 }}>
							{i.quantity} × {i.name}
						</Text>
					))}
				</View>

				{/* Payout */}
				<View style={{ backgroundColor: theme.colors.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.colors.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
					<Text style={{ color: theme.colors.muted }}>Delivery Fee</Text>
					<Text style={{ fontSize: 18, fontWeight: "800", color: theme.colors.primary }}>₦{order.payout.toLocaleString()}</Text>
				</View>

				{/* Actions */}
				<View style={{ gap: 10 }}>
					<CTAButton title={pickedUp ? "Picked Up" : "Mark as Picked Up"} onPress={onPickedUp} disabled={pickedUp || delivered} />
					<CTAButton title={delivered ? "Delivered" : "Mark as Delivered"} onPress={onDelivered} disabled={!pickedUp || delivered} />
				</View>
			</View>
		</SafeAreaWrapper>
	);
}