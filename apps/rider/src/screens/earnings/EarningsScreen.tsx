import React, { useMemo, useState } from "react";
import { View, Text, Pressable, FlatList, ScrollView } from "react-native";
import { useTheme } from "../../theme/theme";
import { Icon } from "../../ui/Icon";
import { mockEarnings, filterByRange, EarningEntry } from "../../lib/mockEarnings";

export default function EarningsScreen() {
	const theme = useTheme();
	const [range, setRange] = useState<"day" | "week" | "month">("day");

	const data = useMemo(() => filterByRange(mockEarnings, range), [range]);
	const totals = useMemo(() => {
		const completedToday = filterByRange(mockEarnings, "day").length;
		const earnedToday = filterByRange(mockEarnings, "day").reduce((a, b) => a + b.amount, 0);
		const totalCompleted = mockEarnings.length;
		const totalEarnings = mockEarnings.reduce((a, b) => a + b.amount, 0);
		const rangeTotal = data.reduce((a, b) => a + b.amount, 0);
		return { completedToday, earnedToday, totalCompleted, totalEarnings, rangeTotal };
	}, [data]);

	const Tab = ({ label, value }: { label: string; value: "day" | "week" | "month" }) => {
		const active = range === value;
		return (
			<Pressable onPress={() => setRange(value)} style={{
				paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16,
				backgroundColor: active ? theme.colors.primary : theme.colors.surface,
				borderWidth: 1, borderColor: theme.colors.border, marginRight: 8
			}}>
				<Text style={{ color: active ? "white" : theme.colors.text, fontWeight: "700", fontSize: 12 }}>{label}</Text>
			</Pressable>
		);
	};

	const OrderItem = ({ item }: { item: EarningEntry }) => (
		<View style={{
			backgroundColor: theme.colors.surface, borderRadius: 12, padding: 16,
			borderWidth: 1, borderColor: theme.colors.border, marginBottom: 12, marginHorizontal: 16,
		}}>
			<View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
				<View style={{ flex: 1 }}>
					<Text style={{ color: theme.colors.text, fontWeight: "600", fontSize: 16 }}>Order #{item.orderId}</Text>
					<Text style={{ color: theme.colors.muted, fontSize: 12, marginTop: 2 }}>
						{new Date(item.date).toLocaleDateString()} • {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
					</Text>
				</View>
				<View style={{
					paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
					backgroundColor: item.status === "paid" ? "#10B981" + "20" : "#EF4444" + "20"
				}}>
					<Text style={{ 
						color: item.status === "paid" ? "#10B981" : "#EF4444", 
						fontSize: 12, 
						fontWeight: "600",
						textTransform: "capitalize"
					}}>
						{item.status}
					</Text>
				</View>
			</View>
			
			<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
				<Icon set="ion" name="storefront-outline" size={16} color={theme.colors.muted} />
				<Text style={{ color: theme.colors.muted, fontSize: 14, marginLeft: 6 }}>Pizza Palace</Text>
				<Icon set="ion" name="arrow-forward" size={14} color={theme.colors.muted} style={{ marginHorizontal: 8 }} />
				<Icon set="ion" name="home-outline" size={16} color={theme.colors.muted} />
				<Text style={{ color: theme.colors.muted, fontSize: 14, marginLeft: 6 }}>Victoria Island</Text>
			</View>

			<View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
				<Text style={{ color: theme.colors.muted, fontSize: 14 }}>Delivery Fee</Text>
				<Text style={{ color: theme.colors.text, fontWeight: "700", fontSize: 16 }}>₦{item.amount.toLocaleString()}</Text>
			</View>
		</View>
	);

	return (
		<View style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<ScrollView showsVerticalScrollIndicator={false}>
				{/* Summary Section */}
				<View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 }}>
					<Text style={{ fontSize: 24, fontWeight: "700", color: theme.colors.text, marginBottom: 8 }}>Earnings Summary</Text>
					<Text style={{ color: theme.colors.muted, fontSize: 14, marginBottom: 20 }}>
						Track your completed orders and delivery fees
					</Text>

					{/* Total Stats */}
					<View style={{
						backgroundColor: theme.colors.surface, borderRadius: 16, padding: 20,
						borderWidth: 1, borderColor: theme.colors.border, marginBottom: 16
					}}>
						<View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
							<View style={{ flex: 1 }}>
								<Text style={{ color: theme.colors.muted, fontSize: 14, marginBottom: 4 }}>Total Orders</Text>
								<Text style={{ color: theme.colors.text, fontWeight: "700", fontSize: 24 }}>{totals.totalCompleted}</Text>
							</View>
							<View style={{ flex: 1, alignItems: "flex-end" }}>
								<Text style={{ color: theme.colors.muted, fontSize: 14, marginBottom: 4 }}>Total Earnings</Text>
								<Text style={{ color: theme.colors.primary, fontWeight: "700", fontSize: 24 }}>₦{totals.totalEarnings.toLocaleString()}</Text>
							</View>
						</View>
						
						<View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 12 }} />
						
						<View style={{ flexDirection: "row", justifyContent: "space-between" }}>
							<Text style={{ color: theme.colors.muted, fontSize: 14 }}>Today's Orders</Text>
							<Text style={{ color: theme.colors.text, fontWeight: "600" }}>{totals.completedToday}</Text>
						</View>
						<View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
							<Text style={{ color: theme.colors.muted, fontSize: 14 }}>Today's Earnings</Text>
							<Text style={{ color: theme.colors.text, fontWeight: "600" }}>₦{totals.earnedToday.toLocaleString()}</Text>
						</View>
					</View>
				</View>

				{/* Time Range Tabs */}
				<View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 16 }}>
					<Tab label="Today" value="day" />
					<Tab label="This Week" value="week" />
					<Tab label="This Month" value="month" />
				</View>

				{/* Period Summary */}
				<View style={{
					marginHorizontal: 16, marginBottom: 20, backgroundColor: theme.colors.surface, borderRadius: 12,
					borderWidth: 1, borderColor: theme.colors.border, padding: 16
				}}>
					<View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
						<Text style={{ color: theme.colors.muted, fontSize: 16, fontWeight: "600" }}>
							{range === "day" ? "Today" : range === "week" ? "This Week" : "This Month"}
						</Text>
						<Text style={{ color: theme.colors.primary, fontWeight: "700", fontSize: 18 }}>
							₦{totals.rangeTotal.toLocaleString()}
						</Text>
					</View>
					<Text style={{ color: theme.colors.muted, fontSize: 12, marginTop: 4 }}>
						{data.length} completed orders
					</Text>
				</View>

				{/* Order History */}
				<View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
					<Text style={{ fontSize: 18, fontWeight: "600", color: theme.colors.text, marginBottom: 12 }}>
						Order History
					</Text>
				</View>

				{data.length === 0 ? (
					<View style={{ alignItems: "center", paddingVertical: 40 }}>
						<Icon set="ion" name="receipt-outline" size={48} color={theme.colors.muted} />
						<Text style={{ color: theme.colors.muted, fontSize: 16, marginTop: 12, textAlign: "center" }}>
							No orders completed {range === "day" ? "today" : range === "week" ? "this week" : "this month"}
						</Text>
					</View>
				) : (
					<FlatList
						data={data}
						keyExtractor={(item) => item.id}
						renderItem={OrderItem}
						scrollEnabled={false}
						contentContainerStyle={{ paddingBottom: 24 }}
					/>
				)}
			</ScrollView>
		</View>
	);
}