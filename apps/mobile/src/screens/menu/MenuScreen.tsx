import React, { useMemo, useState } from 'react'
import { FlatList, Image, Pressable, ScrollView, Text, View } from 'react-native'
import { useTheme } from '../../theme/theme'
import { categories, mockMeals, mockVendors } from '../../lib/mockData'
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native'
import { Icon } from '../../ui/Icon'
import { SearchBar } from '../../ui/SearchBar'
import { SafeAreaWrapper } from '../../ui/SafeAreaWrapper'
import MealGridCard from '../../ui/MealGridCard'
import MealListCard from '../../ui/MealListCard'
import { RootStackParamList } from '../../navigation/types'
import CartBottomSheet from '../../ui/CartBottomSheet'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

type MenuScreenRouteProp = RouteProp<RootStackParamList, 'Menu'>;
type MenuScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Menu'>;

export default function MenuScreen() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [showCart, setShowCart] = useState(false);
    const [cartItems, setCartItems] = useState<Record<string, number>>({});

    const theme = useTheme()
    const route = useRoute<MenuScreenRouteProp>();
    const navigation = useNavigation<MenuScreenNavigationProp>();
    const vendorId = route.params?.vendorId || "1";

    const vendor = mockVendors.find(v => v.id === vendorId) || mockVendors[0];

    const popularMeals = useMemo(() => {
        return mockMeals.filter(meal => meal.popular).slice(0, 3);
    }, []);

    const filteredMeals = useMemo(() => {
        return mockMeals.filter(meal => {
            const matchesSearch = meal.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                               meal.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === "all" || meal.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, selectedCategory]);

    const cartTotal = useMemo(() => {
        return Object.entries(cartItems).reduce((total, [mealId, quantity]) => {
          const meal = mockMeals.find(m => m.id === mealId);
          return total + (meal ? meal.price * quantity : 0);
        }, 0);
    }, [cartItems]);
      
    const cartItemCount = useMemo(() => {
        return Object.values(cartItems).reduce((total, quantity) => total + quantity, 0);
    }, [cartItems]);

    const addToCart = (mealId: string) => {
        setCartItems(prev => ({
            ...prev,
            [mealId]: (prev[mealId] || 0) + 1
        }));
    };
      
    const removeFromCart = (mealId: string) => {
        setCartItems(prev => {
            const newItems = { ...prev };
            if (newItems[mealId] > 1) {
                newItems[mealId] -= 1;
            } else {
                delete newItems[mealId];
            }
            return newItems;
        });
    };

    const handleUpdateQuantity = (mealId: string, quantity: number) => {
        if (quantity <= 0) {
            setCartItems(prev => {
                const newItems = { ...prev };
                delete newItems[mealId];
                return newItems;
            });
        } else {
            setCartItems(prev => ({
                ...prev,
                [mealId]: quantity
            }));
        }
    };

    const handleRemoveItem = (mealId: string) => {
        setCartItems(prev => {
            const newItems = { ...prev };
            delete newItems[mealId];
            return newItems;
        });
    };

    const handleProceedToCheckout = () => {
        setShowCart(false);
        navigation.navigate('Checkout', {
            cartItems: cartItems,
            vendorId: vendorId
        });
    };

    const renderMealGrid = ({ item }: { item: typeof mockMeals[0] }) => (
        <MealGridCard
            meal={item}
            onAddToCart={() => addToCart(item.id)}
            onRemoveFromCart={() => removeFromCart(item.id)}
            quantity={cartItems[item.id] || 0}
        />
    );
      
    const renderMealList = ({ item }: { item: typeof mockMeals[0] }) => (
        <MealListCard
            meal={item}
            onAddToCart={() => addToCart(item.id)}
            onRemoveFromCart={() => removeFromCart(item.id)}
            quantity={cartItems[item.id] || 0}
        />
    );

    return (
        <SafeAreaWrapper>
            <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                {/* 🔝 TOP: Vendor Header */}
                <View style={{
                    backgroundColor: theme.colors.surface,
                    paddingTop: 16,
                    paddingBottom: 20,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border
                }}>
                    <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                            <Image
                                source={{ uri: vendor.image }}
                                style={{ width: 60, height: 60, borderRadius: 12, marginRight: 12 }}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={{
                                    fontSize: 20,
                                    fontWeight: "700",
                                    color: theme.colors.text,
                                    marginBottom: 4
                                }}>
                                    {vendor.name}
                                </Text>
                                <Text style={{
                                    fontSize: 14,
                                    color: theme.colors.muted,
                                    marginBottom: 8
                                }}>
                                    {vendor.description}
                                </Text>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    <Icon name="time" size={14} color={theme.colors.primary} />
                                    <Text style={{
                                        marginLeft: 4,
                                        fontSize: 12,
                                        color: theme.colors.text,
                                        fontWeight: "600"
                                    }}>
                                        {vendor.eta}
                                    </Text>
                                    <View style={{
                                        width: 4,
                                        height: 4,
                                        borderRadius: 2,
                                        backgroundColor: theme.colors.muted,
                                        marginHorizontal: 8
                                    }} />
                                    <Icon name="star" size={14} color="#fbbf24" />
                                    <Text style={{
                                        marginLeft: 4,
                                        fontSize: 12,
                                        color: theme.colors.text,
                                        fontWeight: "600"
                                    }}>
                                        {vendor.rating}
                                    </Text>
                                    <View style={{
                                        width: 4,
                                        height: 4,
                                        borderRadius: 2,
                                        backgroundColor: theme.colors.muted,
                                        marginHorizontal: 8
                                    }} />
                                    <View style={{
                                        backgroundColor: vendor.isOpen ? theme.colors.primary : theme.colors.danger,
                                        paddingHorizontal: 6,
                                        paddingVertical: 2,
                                        borderRadius: 8
                                    }}>
                                        <Text style={{
                                            color: "white",
                                            fontSize: 10,
                                            fontWeight: "600"
                                        }}>
                                            {vendor.isOpen ? "Open" : "Closed"}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Search in Menu */}
                        <SearchBar
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Search in menu..."
                        />
                    </View>

                    {/* Categories / Tabs */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16 }}
                    >
                        {categories.map(category => (
                            <Pressable
                                key={category.id}
                                onPress={() => setSelectedCategory(category.id)}
                                style={{
                                    backgroundColor: selectedCategory === category.id ? theme.colors.primary : theme.colors.background,
                                    paddingHorizontal: 16,
                                    paddingVertical: 8,
                                    borderRadius: 20,
                                    marginRight: 12,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    borderWidth: 1,
                                    borderColor: selectedCategory === category.id ? theme.colors.primary : theme.colors.border
                                }}
                            >
                                <Icon
                                    name={category.icon}
                                    size={16}
                                    color={selectedCategory === category.id ? "white" : theme.colors.muted}
                                    style={{ marginRight: 6 }}
                                />
                                <Text style={{
                                    color: selectedCategory === category.id ? "white" : theme.colors.text,
                                    fontWeight: selectedCategory === category.id ? "600" : "500",
                                    fontSize: 14
                                }}>
                                    {category.name}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* ⭐ Popular Meals Section */}
                    {popularMeals.length > 0 && (
                        <View style={{ padding: 16 }}>
                            <Text style={{
                                fontSize: 18,
                                fontWeight: "700",
                                color: theme.colors.text,
                                marginBottom: 12
                            }}>
                                Popular This Week
                            </Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingRight: 16 }}
                            >
                                {popularMeals.map(meal => (
                                    <View
                                        key={meal.id}
                                        style={{
                                            backgroundColor: theme.colors.surface,
                                            borderRadius: 12,
                                            padding: 12,
                                            marginRight: 12,
                                            width: 150,
                                            borderWidth: 1,
                                            borderColor: theme.colors.border
                                        }}
                                    >
                                        <Image
                                            source={{ uri: meal.image }}
                                            style={{ width: "100%", height: 80, borderRadius: 8, marginBottom: 8 }}
                                        />
                                        <Text style={{
                                            fontSize: 14,
                                            fontWeight: "600",
                                            color: theme.colors.text,
                                            marginBottom: 4
                                        }}>
                                            {meal.name}
                                        </Text>
                                        <Text style={{
                                            fontSize: 16,
                                            fontWeight: "700",
                                            color: theme.colors.primary
                                        }}>
                                            ${meal.price.toFixed(2)}
                                        </Text>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* View Mode Toggle */}
                    <View style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingHorizontal: 16,
                        marginBottom: 16
                    }}>
                        <Text style={{
                            fontSize: 18,
                            fontWeight: "700",
                            color: theme.colors.text
                        }}>
                            Menu ({filteredMeals.length} items)
                        </Text>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                            <Pressable
                                onPress={() => setViewMode("grid")}
                                style={{
                                    padding: 8,
                                    borderRadius: 8,
                                    backgroundColor: viewMode === "grid" ? theme.colors.primary : theme.colors.surface,
                                    borderWidth: 1,
                                    borderColor: viewMode === "grid" ? theme.colors.primary : theme.colors.border
                                }}
                            >
                                <Icon
                                    name="grid"
                                    size={16}
                                    color={viewMode === "grid" ? "white" : theme.colors.muted}
                                />
                            </Pressable>
                            <Pressable
                                onPress={() => setViewMode("list")}
                                style={{
                                    padding: 8,
                                    borderRadius: 8,
                                    backgroundColor: viewMode === "list" ? theme.colors.primary : theme.colors.surface,
                                    borderWidth: 1,
                                    borderColor: viewMode === "list" ? theme.colors.primary : theme.colors.border
                                }}
                            >
                                <Icon
                                    name="list"
                                    size={16}
                                    color={viewMode === "list" ? "white" : theme.colors.muted}
                                />
                            </Pressable>
                        </View>
                    </View>

                    {/* 🍽 MIDDLE: Meals Listing */}
                    <FlatList
                        data={filteredMeals}
                        renderItem={viewMode === "grid" ? renderMealGrid : renderMealList}
                        keyExtractor={(item) => item.id}
                        numColumns={viewMode === "grid" ? 2 : 1}
                        key={viewMode} // Force FlatList to remount when viewMode changes
                        scrollEnabled={false}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
                    />
                </ScrollView>

                {/* 🔽 BOTTOM: Floating Cart Button - ONLY ONE */}
                {cartItemCount > 0 && (
                    <Pressable
                        onPress={() => setShowCart(true)}
                        style={{
                            position: "absolute",
                            bottom: 20,
                            left: 16,
                            right: 16,
                            backgroundColor: theme.colors.primary,
                            borderRadius: 12,
                            padding: 16,
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 8
                        }}
                    >
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <View style={{
                                backgroundColor: "rgba(255,255,255,0.2)",
                                borderRadius: 20,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                marginRight: 12
                            }}>
                                <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>
                                    {cartItemCount} items
                                </Text>
                            </View>
                            <Text style={{
                                color: "white",
                                fontSize: 16,
                                fontWeight: "600"
                            }}>
                                View Cart
                            </Text>
                        </View>
                        <Text style={{
                            color: "white",
                            fontSize: 18,
                            fontWeight: "700"
                        }}>
                            ${cartTotal.toFixed(2)}
                        </Text>
                    </Pressable>
                )}

                {/* Cart Bottom Sheet */}
                <CartBottomSheet
                    visible={showCart}
                    onClose={() => setShowCart(false)}
                    cartItems={cartItems}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemoveItem={handleRemoveItem}
                    onProceedToCheckout={handleProceedToCheckout}
                />
            </View>
        </SafeAreaWrapper>
    )
}