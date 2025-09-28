import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    vendorId: string;
    vendorName: string;
    preparationTime?: number;
    addOns: Record<string, number>; 
    addOnDetails: Record<string, { name: string; price: number }>; 
}

interface CartState {
    // State
    items: Record<string, CartItem>; 
    
    // Actions
    addItem: (item: Omit<CartItem, 'quantity'>) => void;
    addOrUpdateItem: (item: Omit<CartItem, 'quantity'>, quantity: number) => void;
    removeItem: (itemId: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    updateItemAddOns: (itemId: string, addOns: Record<string, number>, addOnDetails: Record<string, { name: string; price: number }>) => void;
    clearCart: () => void;
    
    // Getters
    getItemQuantity: (itemId: string) => number;
    getTotalItems: () => number;
    getSubtotal: () => number;
    getItemsList: () => CartItem[];
    getItemTotal: (itemId: string) => number; 
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            // Initial state
            items: {},

            // Add item to cart 
            addItem: (item) => {
                set((state) => ({
                    items: {
                        ...state.items,
                        [item.id]: {
                            ...item,
                            quantity: 1,
                        },
                    },
                }));
            },

            // Add or update item 
            addOrUpdateItem: (item, quantity) => {
                set((state) => {
                    const existingItem = state.items[item.id];
                    
                    if (existingItem) {
                        // Update existing item 
                        return {
                            items: {
                                ...state.items,
                                [item.id]: {
                                    ...existingItem,
                                    quantity: quantity, 
                                    addOns: item.addOns,
                                    addOnDetails: item.addOnDetails,
                                },
                            },
                        };
                    } else {
                        // Add new item
                        return {
                            items: {
                                ...state.items,
                                [item.id]: {
                                    ...item,
                                    quantity,
                                },
                            },
                        };
                    }
                });
            },

            // Remove item from cart
            removeItem: (itemId) => {
                set((state) => {
                    const newItems = { ...state.items };
                    delete newItems[itemId];
                    return { items: newItems };
                });
            },

            // Update item quantity
            updateQuantity: (itemId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(itemId);
                    return;
                }

                set((state) => ({
                    items: {
                        ...state.items,
                        [itemId]: {
                            ...state.items[itemId],
                            quantity,
                        },
                    },
                }));
            },

            // Update add-ons 
            updateItemAddOns: (itemId, addOns, addOnDetails) => {
                set((state) => ({
                    items: {
                        ...state.items,
                        [itemId]: {
                            ...state.items[itemId],
                            addOns,
                            addOnDetails,
                        },
                    },
                }));
            },

            // Clear cart
            clearCart: () => {
                set({ items: {} });
            },

            // Get item quantity
            getItemQuantity: (itemId) => {
                return get().items[itemId]?.quantity || 0;
            },

            // Get total number of items
            getTotalItems: () => {
                return Object.values(get().items).reduce((total, item) => total + item.quantity, 0);
            },

            // Get subtotal 
            getSubtotal: () => {
                return Object.values(get().items).reduce((total, item) => {
                    let itemTotal = item.price * item.quantity;
                    
                    // Add add-on prices
                    if (item.addOns && item.addOnDetails) {
                        Object.entries(item.addOns).forEach(([addOnId, qty]) => {
                            const addOnDetail = item.addOnDetails[addOnId];
                            if (addOnDetail && qty > 0) {
                                itemTotal += addOnDetail.price * qty; // 🚀 FIX: Remove * item.quantity
                            }
                        });
                    }
                    
                    return total + itemTotal;
                }, 0);
            },

            // Get items as array
            getItemsList: () => {
                return Object.values(get().items);
            },

            // Get total for a specific item 
            getItemTotal: (itemId) => {
                const item = get().items[itemId];
                if (!item) return 0;
                
                let total = item.price * item.quantity;
                
                if (item.addOns && item.addOnDetails) {
                    Object.entries(item.addOns).forEach(([addOnId, qty]) => {
                        const addOnDetail = item.addOnDetails[addOnId];
                        if (addOnDetail && qty > 0) {
                            total += addOnDetail.price * qty; // 🚀 FIX: Remove * item.quantity
                        }
                    });
                }
                
                return total;
            },
        }),
        {
            name: 'quickbite-cart-storage', 
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({ 
                items: state.items
            }),
            version: 1, 
        }
    )
);