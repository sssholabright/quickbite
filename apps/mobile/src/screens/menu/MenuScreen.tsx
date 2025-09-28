import React, { useState } from 'react'
import { FlatList, Image, Pressable, ScrollView, Text, View } from 'react-native'
import { useTheme } from '../../theme/theme'
import { RouteProp, useRoute } from '@react-navigation/native'
import { Icon } from '../../ui/Icon'
import { SearchBar } from '../../ui/SearchBar'
import { SafeAreaWrapper } from '../../ui/SafeAreaWrapper'
import MealGridCard from '../../ui/MealGridCard'
import MealListCard from '../../ui/MealListCard'
import { RootStackParamList } from '../../navigation/types'
import { useVendors, useVendorCategories, useVendorMenuItems } from '../../hooks/useMenu'
import ItemCustomizeModal from '../../ui/ItemCustomizeModal'
import { useCartStore } from '../../stores/cart'
import CartScreen from '../cart/CartScreen'

type MenuScreenRouteProp = RouteProp<RootStackParamList, 'Menu'>;

export default function MenuScreen() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");
    const [showCart, setShowCart] = useState(false);
    const [customizeOpen, setCustomizeOpen] = useState(false)
    const [customizeItem, setCustomizeItem] = useState<any>(null)

    // Cart store
    const { 
        items: cartItems, 
        removeItem, 
        getTotalItems, 
        addOrUpdateItem,
    } = useCartStore()

    const theme = useTheme()
    const route = useRoute<MenuScreenRouteProp>();
    const vendorId = route.params?.vendorId as string;

    // Vendors (for header)
    const { data: vendors = [] } = useVendors()
    const vendor = vendors.find(v => v.id === vendorId)

    // Categories and items (server-filtered)
    const { data: categories = [], isLoading: categoriesLoading } = useVendorCategories(vendorId)
    const effectiveCategoryId = selectedCategory === 'all' ? undefined : selectedCategory
    const { data: items = [], isLoading: itemsLoading } = useVendorMenuItems(vendorId, {
        categoryId: effectiveCategoryId,
        search: searchQuery || undefined
    })
    const isLoading = categoriesLoading || itemsLoading

    const formatNaira = (amount: number): string => {
        return `₦${amount.toLocaleString('en-NG')}`
    }

     // helper to open modal
    const openCustomize = (item: any) => {
        const existingCartItem = cartItems[item.id];
        
        setCustomizeItem({
            id: item.id,
            name: item.name,
            image: item.image || '',
            price: item.price,
            addOns: (item.addOns || []).map((a: { id: string; name: string; price: number; isRequired: boolean; maxQuantity?: number }) => ({
                id: a.id,
                name: a.name,
                price: a.price,
                isRequired: a.isRequired,
                maxQuantity: a.maxQuantity ?? 1
            })),
            // Pass current cart state
            currentQuantity: existingCartItem?.quantity || 0,
            currentAddOns: existingCartItem?.addOns || {},
            isUpdate: !!existingCartItem // Flag to indicate if this is an update
        })
        setCustomizeOpen(true)
    }

    // on confirm from modal
    const handleConfirmCustomize = ({ itemId, quantity, addOns }: { itemId: string; quantity: number; addOns: Record<string, number> }) => {
        const item = items.find(i => i.id === itemId)
        if (!item) return

        // Create add-on details mapping for ALL add-ons
        const addOnDetails: Record<string, { name: string; price: number }> = {}
        if (item.addOns) {
            item.addOns.forEach(addOn => {
                addOnDetails[addOn.id] = { name: addOn.name, price: addOn.price }
            })
        }

        const existingCartItem = cartItems[itemId];
        
        if (existingCartItem) {
            // Update existing item - replace quantity and add-ons
            addOrUpdateItem({
                id: itemId,
                name: item.name,
                price: item.price,
                image: item.image || undefined,
                vendorId: vendorId,
                vendorName: vendor?.businessName || 'Vendor',
                preparationTime: item.preparationTime,
                addOns: addOns,
                addOnDetails: addOnDetails
            }, quantity) // This will replace the quantity, not add to it
        } else {
            // Add new item
            addOrUpdateItem({
                id: itemId,
                name: item.name,
                price: item.price,
                image: item.image || undefined,
                vendorId: vendorId,
                vendorName: vendor?.businessName || 'Vendor',
                preparationTime: item.preparationTime,
                addOns: addOns,
                addOnDetails: addOnDetails
            }, quantity)
        }

        setCustomizeOpen(false)
    }

    const cartItemCount = getTotalItems()

    const addToCart = (mealId: string) => {
        const item = items.find(i => i.id === mealId)
        if (!item) return

        // For items without add-ons, add directly to cart
        addOrUpdateItem({
            id: mealId,
            name: item.name,
            price: item.price,
            image: item.image || undefined,
            vendorId: vendorId,
            vendorName: vendor?.businessName || 'Vendor',
            preparationTime: item.preparationTime,
            addOns: {}, // Empty for items without add-ons
            addOnDetails: {} // Empty for items without add-ons
        }, 1) // Always add 1 quantity for direct add
    };
      
    const removeFromCart = (mealId: string) => {
        removeItem(mealId)
    };

    const renderMealGrid = ({ item }: { item: typeof items[0] }) => (
        <MealGridCard
            meal={{
                id: item.id, name: item.name, description: item.description || '', price: item.price, isAvailable: item.isAvailable,
                image: item.image || '', vendorId: vendorId, preparationTime: item.preparationTime, category: item.category.id, popular: false
            }}
            onAddToCart={() => {
                if (item.addOns && item.addOns.length > 0) {
                    openCustomize(item)
                } else {
                    addToCart(item.id)
                }
            }}
            onRemoveFromCart={() => removeFromCart(item.id)}
            quantity={cartItems[item.id]?.quantity || 0}
        />
    )
    const renderMealList = ({ item }: { item: typeof items[0] }) => (
        <MealListCard
            meal={{
                id: item.id, name: item.name, description: item.description || '', price: item.price, isAvailable: item.isAvailable,
                image: item.image || '', vendorId: vendorId, preparationTime: item.preparationTime, category: item.category.id, popular: false
            }}
            onAddToCart={() => {
                if (item.addOns && item.addOns.length > 0) {
                    openCustomize(item)
                } else {
                    addToCart(item.id)
                }
            }}
            onRemoveFromCart={() => removeFromCart(item.id)}
            quantity={cartItems[item.id]?.quantity || 0}
        />
    )

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
                                source={{ uri: vendor?.logo || vendor?.coverImage || 'https://via.placeholder.com/60' }}
                                style={{ width: 60, height: 60, borderRadius: 12, marginRight: 12 }}
                            />
                            <View style={{ flex: 1 }}>
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: "700",
                                    color: theme.colors.text,
                                    marginBottom: 4
                                }}>
                                    {vendor?.businessName || 'Vendor'}
                                </Text>
                                {!!vendor?.description && (
                                    <Text style={{
                                        fontSize: 12,
                                        color: theme.colors.muted,
                                        marginBottom: 8
                                    }}>
                                        {vendor?.description}
                                    </Text>
                                )}
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                    {vendor?.rating && (
                                        <>
                                            <Icon name="star" size={14} color="#fbbf24" />
                                            <Text style={{
                                                marginLeft: 4,
                                                fontSize: 10,
                                                color: theme.colors.text,
                                                fontWeight: "600"
                                            }}>
                                                {vendor?.rating ?? 0}
                                            </Text>
                                            <View style={{
                                                width: 4,
                                                height: 4,
                                                borderRadius: 2,
                                                backgroundColor: theme.colors.muted,
                                                marginHorizontal: 8
                                            }} />
                                        </>
                                    )}
                                    
                                    <View style={{
                                        backgroundColor: vendor?.isOpen ? theme.colors.primary : theme.colors.danger,
                                        paddingHorizontal: 6,
                                        paddingVertical: 2,
                                        borderRadius: 8
                                    }}>
                                        <Text style={{
                                            color: "white",
                                            fontSize: 8,
                                            fontWeight: "600"
                                        }}>
                                            {vendor?.isOpen ? "Open" : "Closed"}
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
                        contentContainerStyle={{ paddingHorizontal: 12 }}
                    >
                        <Pressable
                            onPress={() => setSelectedCategory('all')}
                            style={{
                                backgroundColor: selectedCategory === 'all' ? theme.colors.primary : theme.colors.background,
                                paddingHorizontal: 12,
                                // paddingVertical: 2,
                                borderRadius: 16,
                                marginRight: 6,
                                flexDirection: "row",
                                alignItems: "center",
                                borderWidth: 1,
                                borderColor: selectedCategory === 'all' ? theme.colors.primary : theme.colors.border
                            }}
                        >
                            <Text style={{
                                color: selectedCategory === 'all' ? "white" : theme.colors.text,
                                fontWeight: selectedCategory === 'all' ? "600" : "500",
                                fontSize: 12
                            }}>
                                All
                            </Text>
                        </Pressable>

                        {categories.map(category => (
                            <Pressable
                                key={category.id}
                                onPress={() => setSelectedCategory(category.id)}
                                style={{
                                    backgroundColor: selectedCategory === category.id ? theme.colors.primary : theme.colors.background,
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 20,
                                    marginRight: 6,
                                    flexDirection: "row",
                                    alignItems: "center",
                                    borderWidth: 1,
                                    borderColor: selectedCategory === category.id ? theme.colors.primary : theme.colors.border
                                }}
                            >
                                <Text style={{
                                    color: selectedCategory === category.id ? "white" : theme.colors.text,
                                    fontWeight: selectedCategory === category.id ? "600" : "500",
                                    fontSize: 12
                                }}>
                                    {category.name}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* View Mode Toggle */}
                    <View style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingHorizontal: 16,
                        marginTop: 8,
                        marginBottom: 12
                    }}>
                        <Text style={{
                            fontSize: 14,
                            fontWeight: "700",
                            color: theme.colors.text
                        }}>
                            Menu ({items.length} items)
                        </Text>
                        <View style={{ flexDirection: "row-reverse", gap: 6 }}>
                            <Pressable
                                onPress={() => setViewMode("grid")}
                                style={{
                                    padding: 6,
                                    borderRadius: 8,
                                    backgroundColor: viewMode === "grid" ? theme.colors.primary : theme.colors.surface,
                                    borderWidth: 1,
                                    borderColor: viewMode === "grid" ? theme.colors.primary : theme.colors.border
                                }}
                            >
                                <Icon
                                    name="grid"
                                    size={14}
                                    color={viewMode === "grid" ? "white" : theme.colors.muted}
                                />
                            </Pressable>
                            <Pressable
                                onPress={() => setViewMode("list")}
                                style={{
                                    padding: 6,
                                    borderRadius: 8,
                                    backgroundColor: viewMode === "list" ? theme.colors.primary : theme.colors.surface,
                                    borderWidth: 1,
                                    borderColor: viewMode === "list" ? theme.colors.primary : theme.colors.border
                                }}
                            >
                                <Icon
                                    name="list"
                                    size={14}
                                    color={viewMode === "list" ? "white" : theme.colors.muted}
                                />
                            </Pressable>
                        </View>
                    </View>

                    {/* 🍽 Meals Listing */}
                    <FlatList
                        data={items}
                        renderItem={viewMode === "grid" ? renderMealGrid : renderMealList}
                        keyExtractor={(item) => item.id}
                        numColumns={viewMode === "grid" ? 2 : 1}
                        key={viewMode}
                        scrollEnabled={false}
                        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 100 }}
                    />
                </ScrollView>

                {/* Item Customize Modal */}
                <ItemCustomizeModal
                    visible={customizeOpen}
                    onClose={() => setCustomizeOpen(false)}
                    item={customizeItem}
                    onConfirm={handleConfirmCustomize}
                />


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

                <CartScreen
                    visible={showCart}
                    onClose={() => setShowCart(false)}
                />
            </View>
        </SafeAreaWrapper>
    )
}