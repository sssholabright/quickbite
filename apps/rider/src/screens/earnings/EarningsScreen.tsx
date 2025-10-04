import React, { useState } from "react";
import { View, Text, Pressable, FlatList, ScrollView, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { useTheme } from "../../theme/theme";
import { Icon } from "../../ui/Icon";
import { EarningEntry, EarningsRange } from "../../types/earnings";
import { useEarnings, useEarningsSummary } from "../../hooks/useEarnings";

export default function EarningsScreen() {
	const theme = useTheme();
	const [range, setRange] = useState<EarningsRange>("day");
	const [refreshing, setRefreshing] = useState(false);

	// Use React Query hooks
	const { 
		data: earningsData, 
		isLoading: earningsLoading, 
		error: earningsError, 
		refetch: refetchEarnings 
	} = useEarnings(range);

	const { 
		data: summaryData, 
		isLoading: summaryLoading, 
		error: summaryError, 
		refetch: refetchSummary 
	} = useEarningsSummary();

	// Handle refresh
	const onRefresh = async () => {
		setRefreshing(true);
		try {
			await Promise.all([refetchEarnings(), refetchSummary()]);
		} catch (error) {
			console.error('Error refreshing earnings:', error);
		} finally {
			setRefreshing(false);
		}
	};

	// Handle errors
	if (earningsError || summaryError) {
		const errorMessage = earningsError?.message || summaryError?.message || 'Failed to load earnings';
		Alert.alert('Error', errorMessage);
	}

	const isLoading = earningsLoading || summaryLoading;
	const earnings = earningsData?.earnings || [];
	// Use the summary from earningsData instead of summaryData
	const summary = earningsData?.summary || {
		totalEarnings: 0,
		totalCompleted: 0,
		completedToday: 0,
		earnedToday: 0,
		rangeTotal: 0,
		rangeCount: 0
	};

	const Tab = ({ label, value }: { label: string; value: EarningsRange }) => {
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
					<Text style={{ color: theme.colors.text, fontWeight: "600", fontSize: 16 }}>
						{item.orderNumber ? `Order #${item.orderNumber}` : 
						 item.orderId ? `Order #${item.orderId}` : 'Bonus/Tip'}
					</Text>
					<Text style={{ color: theme.colors.muted, fontSize: 12, marginTop: 2 }}>
						{new Date(item?.date).toLocaleDateString()} • {new Date(item?.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
					</Text>
				</View>
				<View style={{
					paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
					backgroundColor: item?.status === "paid" ? "#10B981" + "20" : "#EF4444" + "20"
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
				<Text style={{ color: theme.colors.muted, fontSize: 14, marginLeft: 6 }}>
					{item.type === 'DELIVERY_FEE' ? 'Delivery Fee' : 
					 item.type === 'BONUS' ? 'Bonus' :
					 item.type === 'TIP' ? 'Tip' : 'Penalty'}
				</Text>
			</View>

			{item.description && (
				<Text style={{ color: theme.colors.muted, fontSize: 12, marginBottom: 8 }}>
					{item.description}
				</Text>
			)}

			<View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
				<Text style={{ color: theme.colors.muted, fontSize: 14 }}>Amount</Text>
				<Text style={{ color: theme.colors.text, fontWeight: "700", fontSize: 16 }}>₦{item?.amount?.toLocaleString()}</Text>
			</View>
		</View>
	);

	if (isLoading && !earningsData && !summaryData) {
		return (
			<View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
				<ActivityIndicator size="large" color={theme.colors.primary} />
				<Text style={{ color: theme.colors.text, marginTop: 16 }}>Loading earnings...</Text>
			</View>
		);
	}

	return (
		<View style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<ScrollView 
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						colors={[theme.colors.primary]}
						tintColor={theme.colors.primary}
					/>
				}
			>
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
								<Text style={{ color: theme.colors.text, fontWeight: "700", fontSize: 24 }}>{summary.totalCompleted}</Text>
							</View>
							<View style={{ flex: 1, alignItems: "flex-end" }}>
								<Text style={{ color: theme.colors.muted, fontSize: 14, marginBottom: 4 }}>Total Earnings</Text>
								<Text style={{ color: theme.colors.primary, fontWeight: "700", fontSize: 24 }}>₦{summary?.totalEarnings?.toLocaleString()}</Text>
							</View>
						</View>
						
						<View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 12 }} />
						
						<View style={{ flexDirection: "row", justifyContent: "space-between" }}>
							<Text style={{ color: theme.colors.muted, fontSize: 14 }}>Today's Orders</Text>
							<Text style={{ color: theme.colors.text, fontWeight: "600" }}>{summary?.completedToday}</Text>
						</View>
						<View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 8 }}>
							<Text style={{ color: theme.colors.muted, fontSize: 14 }}>Today's Earnings</Text>
							<Text style={{ color: theme.colors.text, fontWeight: "600" }}>₦{summary?.earnedToday?.toLocaleString()}</Text>
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
							₦{summary?.rangeTotal?.toLocaleString()}
						</Text>
					</View>
					<Text style={{ color: theme.colors.muted, fontSize: 12, marginTop: 4 }}>
						{summary.rangeCount} completed orders
					</Text>
				</View>

				{/* Order History */}
				<View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
					<Text style={{ fontSize: 18, fontWeight: "600", color: theme.colors.text, marginBottom: 12 }}>
						Order History
					</Text>
				</View>

				{earnings.length === 0 ? (
					<View style={{ alignItems: "center", paddingVertical: 40 }}>
						<Icon set="ion" name="receipt-outline" size={48} color={theme.colors.muted} />
						<Text style={{ color: theme.colors.muted, fontSize: 16, marginTop: 12, textAlign: "center" }}>
							No orders completed {range === "day" ? "today" : range === "week" ? "this week" : "this month"}
						</Text>
					</View>
				) : (
					<FlatList
						data={earnings}
						keyExtractor={(item) => item.id}
						renderItem={OrderItem}
						scrollEnabled={false}
						contentContainerStyle={{ paddingBottom: 24 }}
					/>
				)}

				{/* Loading indicator for range changes */}
				{earningsLoading && earningsData && (
					<View style={{ paddingVertical: 20, alignItems: 'center' }}>
						<ActivityIndicator size="small" color={theme.colors.primary} />
						<Text style={{ color: theme.colors.muted, fontSize: 12, marginTop: 8 }}>Updating...</Text>
					</View>
				)}
			</ScrollView>
		</View>
	);
}