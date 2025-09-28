import { Button, FlatList, Pressable, ScrollView, Text, View } from 'react-native'
import { useTheme } from '../../theme/theme'
import { SearchBar } from '../../ui/SearchBar'
import { useMemo, useState } from 'react';
import { CategoryChip } from '../../ui/CategoryChip';
import { categories, mockMeals } from '../../lib/mockData';
import { PromoBanner } from '../../ui/PromoBanner';
import { MealCard } from '../../ui/MealCard';
import { VendorCard } from '../../ui/VendorCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../ui/Icon';
import CartScreen from '../cart/CartScreen';
import { useVendors } from '../../hooks/useMenu'
import { useNavigation } from '@react-navigation/native'
import { useCartStore } from '../../stores/cart'
import { SafeAreaWrapper } from '../../ui/SafeAreaWrapper'
import { useCustomerStore } from '../../stores/customer';
import notificationService from '../../services/notificationService';

export default function HomeScreen() {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [showCart, setShowCart] = useState(false);
	const { sendTestNotification, debugNotifications } = useCustomerStore()
	
	const theme = useTheme()
	const navigation = useNavigation<any>()

	// Cart store
	const { items: cartItems, getTotalItems, updateQuantity, removeItem } = useCartStore()

	// Load active vendors from API (only those with available items)
	const { data: vendors = [], isLoading: vendorsLoading } = useVendors({ hasAvailableItems: true })

	const featuredMeals = useMemo(() => {
		return mockMeals.filter(meal => meal.popular);
	}, []);

	// Get featured meals from all vendors
	// const { data: featuredMeals = [] } = useVendorMenuItems(undefined, { isAvailable: true })

	// Map API vendors to UI shape expected by VendorCard
	const uiVendors = useMemo(() => {
		return vendors.map(v => ({
			id: v.id,
			name: v.businessName,
			description: v.description || '',
			image: v.logo || v.coverImage || 'https://via.placeholder.com/100',
			rating: v.rating ?? 0,
			eta: '20-30 min',
			distance: '1.2 km',
			category: 'all',
			isOpen: !!v.isOpen,
			featured: false
		}));
	}, [vendors]);

	// Map API meals to UI shape for featured meals
	const uiFeaturedMeals = useMemo(() => {
		return featuredMeals.slice(0, 5).map(meal => ({
			id: meal.id,
			name: meal.name,
			description: meal.description || '',
			price: meal.price,
			image: meal.image || 'https://via.placeholder.com/300',
			vendorId: meal.vendorId,
			category: meal.category || 'lunch',
			popular: true,
			preparationTime: meal.preparationTime
		}));
	}, [featuredMeals]);

	const filteredVendors = useMemo(() => {
		return uiVendors.filter(vendor => {
			const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
				vendor.description.toLowerCase().includes(searchQuery.toLowerCase());
			// If you later tag vendors by category, replace this with real matching
			const matchesCategory = selectedCategory === "all" || vendor.category === selectedCategory
			return matchesSearch && matchesCategory
		})
	}, [uiVendors, searchQuery, selectedCategory])

	const cartItemCount = getTotalItems()

	const handleAddToCart = (mealId: string) => {
		const meal = uiFeaturedMeals.find(m => m.id === mealId)
		if (meal) {
			// For now, add without customization - you can integrate ItemCustomizeModal here later
			updateQuantity(mealId, (cartItems[mealId]?.quantity || 0) + 1)
		}
	};

	const renderMeal = ({ item }: { item: typeof uiFeaturedMeals[0] }) => (
		<MealCard
			meal={item}
			onPress={() => {
				// Navigate to meal details or vendor menu
				navigation.navigate('Menu', { vendorId: item.vendorId });
			}}
			onAddToCart={() => handleAddToCart(item.id)}
		/>
	);

	const renderVendor = ({ item }: { item: typeof uiVendors[0] }) => (
		<VendorCard
			vendor={item}
			onPress={() => {
				navigation.navigate('Menu', { vendorId: item.id });
			}}
		/>
	);

	return (
		<SafeAreaWrapper 
			edges={["top"]} // Only apply top padding, let tab navigator handle bottom
			backgroundColor={theme.colors.background}
		>
			<View style={{ flex: 1 }}>
				{/* Search Bar */}
				<SearchBar
					value={searchQuery}
					onChangeText={setSearchQuery}
					placeholder="Search vendors or meals..."
				/>

				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: 24 }}
				>
					{/* Categories */}
					<View style={{ marginBottom: 20 }}>
						<ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{ paddingHorizontal: 16 }}
						>
							<CategoryChip 
								category={{ id: "all", name: "All", icon: "grid", color: theme.colors.primary }}
								isSelected={selectedCategory === "all"}
								onPress={() => setSelectedCategory("all")}
							/>
							{categories.map(category => (
								<CategoryChip
									key={category.id}
									category={category}
									isSelected={selectedCategory === category.id}
									onPress={() => setSelectedCategory(category.id)}
								/>
							))}
						</ScrollView>
					</View>

					<Button title="Send Test Notification" onPress={sendTestNotification} />
					<Button title="Debug Notifications" onPress={debugNotifications} />
					<Button title="Test Push Notification" onPress={() => notificationService.testExpoPushNotification()} />
					{/* Promo Banner */}
					{/* <PromoBanner
						title="Get 20% off rice bowls today!"
						subtitle="Use code RICE20 at checkout"
						onPress={() => console.log("Promo pressed")}
					/> */}

					{/* Featured Meals */}
					{/* <View style={{ marginBottom: 20 }}>
						<View style={{
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
							paddingHorizontal: 16,
							marginBottom: 12
						}}>
							<Text style={{
								fontSize: 18,
								fontWeight: "700",
								color: theme.colors.text
							}}>
								Popular This Near You
							</Text>
							<Pressable>
								<Text style={{
									fontSize: 14,
									color: theme.colors.primary,
									fontWeight: "600"
								}}>
									See all
								</Text>
							</Pressable>
						</View>

						<FlatList
							data={uiFeaturedMeals}
							renderItem={renderMeal}
							keyExtractor={(item) => item.id}
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{ paddingHorizontal: 16 }}
						/>
					</View> */}

					{/* Vendors List */}
					<View>
						<View style={{
							flexDirection: "row",
							justifyContent: "space-between",
							alignItems: "center",
							paddingHorizontal: 16,
							marginBottom: 12
						}}>
							<Text style={{
								fontSize: 16,
								fontWeight: "700",
								color: theme.colors.text
							}}>
								{selectedCategory === "all" ? "All Vendors" : 
									categories.find(c => c.id === selectedCategory)?.name + " Vendors"}
							</Text>
							<Text style={{
								fontSize: 12,
								color: theme.colors.muted
							}}>
								{vendorsLoading ? 'Loading...' : `${filteredVendors.length} available`}
							</Text>
						</View>

						<FlatList
							data={filteredVendors}
							renderItem={renderVendor}
							keyExtractor={(item) => item.id}
							scrollEnabled={false}
							contentContainerStyle={{ paddingBottom: 20 }}
						/>
					</View>
				</ScrollView>

				{/* Floating Cart Button */}
				{cartItemCount > 0 && (
					<Pressable
						onPress={() => setShowCart(true)}
						style={{
							position: 'absolute',
							bottom: 20,
							right: 20,
							width: 50,
							height: 50,
							borderRadius: 30,
							backgroundColor: theme.colors.primary,
							alignItems: 'center',
							justifyContent: 'center',
							shadowColor: '#000',
							shadowOffset: {
								width: 0,
								height: 4,
							},
							shadowOpacity: 0.3,
							shadowRadius: 8,
							elevation: 8,
						}}
					>
						<Icon name="cart" size={20} color="white" />
						{cartItemCount > 0 && (
							<View style={{
								position: 'absolute',
								top: -5,
								right: -5,
								backgroundColor: '#FF3B30',
								borderRadius: 10,
								minWidth: 20,
								height: 20,
								alignItems: 'center',
								justifyContent: 'center',
							}}>
								<Text style={{
									color: 'white',
									fontSize: 12,
									fontWeight: '600',
								}}>
									{cartItemCount > 99 ? '99+' : cartItemCount}
								</Text>
							</View>
						)}
					</Pressable>
				)}

				{/* Cart Modal */}
				{showCart && (
					<CartScreen
						visible={showCart}
						onClose={() => setShowCart(false)}
					/>
				)}
			</View>
		</SafeAreaWrapper>
	);
}