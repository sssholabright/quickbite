import { FlatList, Pressable, ScrollView, Text, View } from 'react-native'
import { useTheme } from '../../theme/theme'
import { SearchBar } from '../../ui/SearchBar'
import { useMemo, useState } from 'react';
import { CategoryChip } from '../../ui/CategoryChip';
import { categories, mockMeals, mockVendors } from '../../lib/mockData';
import { PromoBanner } from '../../ui/PromoBanner';
import { MealCard } from '../../ui/MealCard';
import { VendorCard } from '../../ui/VendorCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../ui/Icon';
import CartScreen from '../cart/CartScreen';

export default function HomeScreen() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [showCart, setShowCart] = useState(false);
    const [cartItems, setCartItems] = useState<Record<string, number>>({});
    
    const theme = useTheme()
    const insets = useSafeAreaInsets();

    const featuredMeals = useMemo(() => {
        return mockMeals.filter(meal => meal.popular);
    }, []);

    const filteredVendors = useMemo(() => {
        return mockVendors.filter(vendor => {
            const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                vendor.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === "all" || vendor.category === selectedCategory
            return matchesSearch && matchesCategory
        })
    }, [searchQuery, selectedCategory])

    const cartItemCount = useMemo(() => {
        return Object.values(cartItems).reduce((total, quantity) => total + quantity, 0);
    }, [cartItems]);

    const handleAddToCart = (mealId: string) => {
        setCartItems(prev => ({
            ...prev,
            [mealId]: (prev[mealId] || 0) + 1
        }));
    };

    const handleUpdateQuantity = (mealId: string, quantity: number) => {
        if (quantity <= 0) {
            const newCartItems = { ...cartItems };
            delete newCartItems[mealId];
            setCartItems(newCartItems);
        } else {
            setCartItems(prev => ({
                ...prev,
                [mealId]: quantity
            }));
        }
    };

    const handleRemoveItem = (mealId: string) => {
        const newCartItems = { ...cartItems };
        delete newCartItems[mealId];
        setCartItems(newCartItems);
    };

    const renderMeal = ({ item }: { item: typeof mockMeals[0] }) => (
        <MealCard
            meal={item}
            onPress={() => {
                // Navigate to meal details
                console.log("Navigate to meal:", item.id);
            }}
            onAddToCart={() => handleAddToCart(item.id)}
        />
    );

    const renderVendor = ({ item }: { item: typeof mockVendors[0] }) => (
        <VendorCard
            vendor={item}
            onPress={() => {
                // Navigate to vendor details
                console.log("Navigate to vendor:", item.id);
            }}
        />
    );

    return (
        <View style={{ 
            flex: 1, 
            backgroundColor: theme.colors.background,
            paddingTop: insets.top
        }}>
            {/* Search Bar */}
            <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search vendors or meals..."
            />

            <ScrollView showsVerticalScrollIndicator={false}>
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

                {/* Promo Banner */}
                <PromoBanner
                    title="Get 20% off rice bowls today!"
                    subtitle="Use code RICE20 at checkout"
                    onPress={() => console.log("Promo pressed")}
                />

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
                            fontSize: 20,
                            fontWeight: "700",
                            color: theme.colors.text
                        }}>
                            Popular This Week
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
                        data={featuredMeals}
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
                            fontSize: 20,
                            fontWeight: "700",
                            color: theme.colors.text
                        }}>
                            {selectedCategory === "all" ? "All Vendors" : 
                             categories.find(c => c.id === selectedCategory)?.name + " Vendors"}
                        </Text>
                        <Text style={{
                            fontSize: 14,
                            color: theme.colors.muted
                        }}>
                            {filteredVendors.length} available
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
                        bottom: 10,
                        right: 20,
                        width: 60,
                        height: 60,
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
                    <Icon name="cart" size={24} color="white" />
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

            {/* Cart Screen Modal */}
            <CartScreen
                visible={showCart}
                onClose={() => setShowCart(false)}
                cartItems={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
            />
        </View>
    )
}