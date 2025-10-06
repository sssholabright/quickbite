import { Category, Meal, Vendor } from "../types/vendor";

export const categories: Category[] = [
    { id: "breakfast", name: "Breakfast", icon: "sunny", color: "#f59e0b" },
    { id: "lunch", name: "Lunch", icon: "restaurant", color: "#10b981" },
    { id: "drinks", name: "Drinks", icon: "cafe", color: "#3b82f6" },
    { id: "snacks", name: "Snacks", icon: "fast-food", color: "#ef4444" },
    { id: "dinner", name: "Dinner", icon: "moon", color: "#8b5cf6" }
];
  
export const mockVendors: Vendor[] = [
    {
        id: "1",
        name: "Campus Kitchen",
        description: "Fresh meals made daily",
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400",
        rating: 4.8,
        eta: "15-20 min",
        distance: "0.3 km",
        category: "lunch",
        isOpen: true,
        featured: true
    },
    {
        id: "2",
        name: "Quick Bites",
        description: "Fast food & snacks",
        image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400",
        rating: 4.5,
        eta: "10-15 min",
        distance: "0.5 km",
        category: "snacks",
        isOpen: true,
        featured: false
    },
    {
        id: "3",
        name: "Coffee Corner",
        description: "Artisan coffee & pastries",
        image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400",
        rating: 4.9,
        eta: "5-10 min",
        distance: "0.2 km",
        category: "drinks",
        isOpen: true,
        featured: true
    }
];
  
export const mockMeals: Meal[] = [
    {
        id: "1",
        name: "Chicken Rice Bowl",
        description: "Grilled chicken with jasmine rice",
        price: 12.99,
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=300",
        vendorId: "1",
        category: "lunch",
        popular: true,
        preparationTime: 25
    },
    {
        id: "2",
        name: "Beef Burger",
        description: "Juicy beef patty with fresh veggies",
        price: 8.99,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300",
        vendorId: "2",
        category: "lunch",
        popular: true,
        preparationTime: 25
    }
];