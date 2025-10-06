import { FlatList, Pressable, ScrollView, Text, View, RefreshControl } from 'react-native'
import { useTheme } from '../../theme/theme'
import { SearchBar } from '../../ui/SearchBar'
import { useEffect, useMemo, useState } from 'react';
import { CategoryChip } from '../../ui/CategoryChip';
import { PromoBanner } from '../../ui/PromoBanner';
import { MealCard } from '../../ui/MealCard';
import { VendorCard } from '../../ui/VendorCard';
import { Icon } from '../../ui/Icon';
import CartScreen from '../cart/CartScreen';
import { useAllCategories, useVendors } from '../../hooks/useMenu'
import { useNavigation } from '@react-navigation/native'
import { useCartStore } from '../../stores/cart'
import { SafeAreaWrapper } from '../../ui/SafeAreaWrapper'
import { useQuery } from '@tanstack/react-query';
import { menuService } from '../../services/menuService';

export default function HomeScreen() {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedCategory, setSelectedCategory] = useState("all");
	const [showCart, setShowCart] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	
	const theme = useTheme()
	const navigation = useNavigation<any>()

	// Cart store
	const { items: cartItems, getTotalItems, updateQuantity, removeItem } = useCartStore()

	// Load active vendors from API (only those with available items)
	const { data: vendors = [], isLoading: vendorsLoading, refetch: refetchVendors } = useVendors({ hasAvailableItems: true })

	// Load all categories from API
	const { data: categories = [], isLoading: categoriesLoading, refetch: refetchCategories } = useAllCategories()

	// Add this hook to fetch featured menu items
	const { data: featuredMenuItems = [], isLoading: featuredLoading } = useQuery({
		queryKey: ['featured-menu-items'],
		queryFn: async () => {
			// Get all vendors first
			const vendorsResponse = await menuService.getVendors({ hasAvailableItems: true });
			const vendors = vendorsResponse;
			
			// Get menu items from all vendors
			const allMenuItems = [];
			for (const vendor of vendors.slice(0, 3)) { // Limit to first 3 vendors for performance
				try {
					const itemsResponse = await menuService.getVendorItems(vendor.id, {});
					const items = itemsResponse;
					allMenuItems.push(...items.map(item => ({
						...item,
						vendorId: vendor.id,
						vendorName: vendor.businessName,
						vendorImage: vendor.logo || vendor.coverImage
					})));
				} catch (error) {
					console.error(`Error fetching items for vendor ${vendor.id}:`, error);
				}
			}
			
			// Sort by rating/price and return top 5
			return allMenuItems
				.sort((a, b) => b.price - a.price) // Sort by price descending
				.slice(0, 5);
		},
		staleTime: 5 * 60 * 1000, // 5 minutes
	});

	useEffect(() => {
		console.log('Vendors', JSON.stringify(vendors, null, 2));
	}, [vendors]);

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
			featured: false,
			categories: v.categories || [],
			openingTime: v.openingTime,
			closingTime: v.closingTime,
			operatingDays: v.operatingDays || []
		}));
	}, [vendors]);

	// Update the featuredMeals mapping
	const uiFeaturedMeals = useMemo(() => {
		return featuredMenuItems.map(item => ({
			id: item.id,
			name: item.name,
			description: item.description || '',
			price: item.price,
			image: item.image || 'https://via.placeholder.com/300',
			vendorId: item.vendorId,
			vendorName: item.vendorName,
			vendorImage: item.vendorImage,
			category: item.category?.name || 'lunch',
			popular: true,
			preparationTime: item.preparationTime
		}));
	}, [featuredMenuItems]);

	const filteredVendors = useMemo(() => {
		return uiVendors.filter(vendor => {
			const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
				vendor.description.toLowerCase().includes(searchQuery.toLowerCase());
			
			// Filter by category - check if vendor has the selected category
			const matchesCategory = selectedCategory === "all" || 
				vendor.categories?.some((cat: any) => cat.id === selectedCategory);
			
			return matchesSearch && matchesCategory;
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

	const onRefresh = async () => {
		setRefreshing(true);
		try {
			await refetchVendors();
			await refetchCategories();
		} catch (error) {
			console.error('Error refreshing vendors:', error);
		} finally {
			setRefreshing(false);
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

	const getRandomColor = (categoryName: string) => {
		const colors = [
			'#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
			'#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
			'#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
		];
		
		// Use category name to generate consistent color for same category
		let hash = 0;
		for (let i = 0; i < categoryName.length; i++) {
			hash = categoryName.charCodeAt(i) + ((hash << 5) - hash);
		}
		return colors[Math.abs(hash) % colors.length];
	};

	return (
		<SafeAreaWrapper 
			edges={["top"]} // Only apply top padding, let tab navigator handle bottom
			statusBarStyle="light"
		>
			<View style={{ flex: 1 }}>
				{/* Search Bar */}
				<View style={{ backgroundColor: theme.colors.primary, marginTop: -40, paddingBottom: 10 }}>
					<SearchBar
						value={searchQuery}
						onChangeText={setSearchQuery}
						placeholder="Search vendors or meals..."
						style={{
							backgroundColor: 'white',
							borderWidth: 0
						}}
					/>
				</View>

				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ paddingBottom: 24 }}
					refreshControl={
						<RefreshControl
							refreshing={refreshing}
							onRefresh={onRefresh}
							colors={[theme.colors.primary]}
							tintColor={theme.colors.primary}
						/>
					}
				>
					{/* Categories */}
					<View style={{ marginBottom: 20, paddingTop: 10 }}>
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
							{categories.map((category: any) => (
								<CategoryChip
									key={category.id}
									category={{
										id: category.id,
										name: category.name,
										icon: category.icon,
										color: getRandomColor(category.name)
									}}
									isSelected={selectedCategory === category.id}
									onPress={() => setSelectedCategory(category.id)}
								/>
							))}
						</ScrollView>
					</View>

					{/* Promo Banner */}
					{/* <PromoBanner
						title="Get 20% off rice bowls today!"
						subtitle="Use code RICE20 at checkout"
						onPress={() => console.log("Promo pressed")}
					/> */}

					{/* Featured Meals */}
					<View style={{ marginBottom: 20 }}>
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
							{/* <Pressable>
								<Text style={{
									fontSize: 14,
									color: theme.colors.primary,
									fontWeight: "600"
								}}>
									See all
								</Text>
							</Pressable> */}
						</View>

						<FlatList
							data={uiFeaturedMeals}
							renderItem={renderMeal}
							keyExtractor={(item) => item.id}
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={{ paddingHorizontal: 16 }}
						/>
					</View>

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
									categories.find((c: any) => c.id === selectedCategory)?.name + " Vendors"}
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
							numColumns={2}
							contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 16 }}
							columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 0 }}
							ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
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