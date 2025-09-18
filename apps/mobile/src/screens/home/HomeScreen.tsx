import { FlatList, Pressable, ScrollView, Text, View } from 'react-native'
import { useTheme } from '../../theme/theme'
import { SearchBar } from '../../ui/SearchBar'
import { useMemo, useState } from 'react';
import { CategoryChip } from '../../ui/CategoryChip';
import { categories, mockMeals, mockVendors } from '../../lib/mockData';
import { PromoBanner } from '../../ui/PromoBanner';
import { MealCard } from '../../ui/MealCard';
import { VendorCard } from '../../ui/VendorCard';
import { SafeAreaWrapper } from '../../ui/SafeAreaWrapper';

export default function HomeScreen() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    
    const theme = useTheme()

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

    const renderMeal = ({ item }: { item: typeof mockMeals[0] }) => (
        <MealCard
            meal={item}
            onPress={() => {
                // Navigate to meal details
                console.log("Navigate to meal:", item.id);
            }}
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
        <SafeAreaWrapper>
            <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
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
            </View>
        </SafeAreaWrapper>
    )
}