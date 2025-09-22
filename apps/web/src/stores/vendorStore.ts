import { create } from 'zustand'
import { VendorProfile, ChangePasswordData } from '../types/vendor'

interface VendorStore {
    profile: VendorProfile | null
    isLoading: boolean
    error: string | null
    setProfile: (profile: VendorProfile) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    fetchProfile: () => Promise<void>
    updateProfile: (updates: Partial<VendorProfile>) => Promise<void>
    changePassword: (data: ChangePasswordData) => Promise<void>
    updateBankDetails: (bankDetails: Partial<VendorProfile['bankDetails']>) => Promise<void>
    updateSettings: (settings: Partial<VendorProfile['settings']>) => Promise<void>
}

export const useVendorStore = create<VendorStore>((set, get) => ({
    profile: null,
    isLoading: false,
    error: null,

    setProfile: (profile) => set({ profile }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    fetchProfile: async () => {
        set({ isLoading: true, error: null })
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        try {
            // Mock profile data
            const mockProfile: VendorProfile = {
                id: '1',
                name: 'Tasty Bites Restaurant',
                email: 'vendor@tastybites.com',
                phone: '+234 801 234 5678',
                logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=300&fit=crop',
                description: 'Authentic Nigerian cuisine with a modern twist',
                address: {
                    street: '123 Victoria Island',
                    city: 'Lagos',
                    state: 'Lagos',
                    country: 'Nigeria',
                    postalCode: '101241',
                    coordinates: {
                        lat: 6.4281,
                        lng: 3.4219
                    }
                },
                bankDetails: {
                    bankName: 'Access Bank',
                    accountNumber: '1234567890',
                    accountName: 'Tasty Bites Restaurant',
                    bankCode: '044',
                    isVerified: true
                },
                settings: {
                    notifications: {
                        email: true,
                        sms: true,
                        push: true,
                        orderUpdates: true,
                        paymentUpdates: true,
                        marketing: false
                    },
                    business: {
                        isOpen: true,
                        operatingHours: {
                            monday: { open: '08:00', close: '22:00', isOpen: true },
                            tuesday: { open: '08:00', close: '22:00', isOpen: true },
                            wednesday: { open: '08:00', close: '22:00', isOpen: true },
                            thursday: { open: '08:00', close: '22:00', isOpen: true },
                            friday: { open: '08:00', close: '23:00', isOpen: true },
                            saturday: { open: '09:00', close: '23:00', isOpen: true },
                            sunday: { open: '10:00', close: '21:00', isOpen: true }
                        },
                        deliveryRadius: 10,
                        minimumOrderAmount: 1000
                    }
                },
                createdAt: '2024-01-15T10:00:00Z',
                updatedAt: '2024-01-15T10:00:00Z'
            }
            
            set({ profile: mockProfile, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
        }
    },

    updateProfile: async (updates) => {
        set({ isLoading: true })
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300))
        
        try {
            const currentProfile = get().profile
            if (!currentProfile) throw new Error('No profile found')
            
            const updatedProfile = {
                ...currentProfile,
                ...updates,
                updatedAt: new Date().toISOString()
            }
            
            set({ profile: updatedProfile, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    changePassword: async (data) => {
        set({ isLoading: true })
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500))
        
        try {
            // Simulate password change
            if (data.newPassword !== data.confirmPassword) {
                throw new Error('New passwords do not match')
            }
            
            set({ isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    updateBankDetails: async (bankDetails) => {
        set({ isLoading: true })
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300))
        
        try {
            const currentProfile = get().profile
            if (!currentProfile) throw new Error('No profile found')
            
            const updatedProfile = {
                ...currentProfile,
                bankDetails: {
                    ...currentProfile.bankDetails,
                    ...bankDetails
                },
                updatedAt: new Date().toISOString()
            }
            
            set({ profile: updatedProfile, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    updateSettings: async (settings) => {
        set({ isLoading: true })
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300))
        
        try {
            const currentProfile = get().profile
            if (!currentProfile) throw new Error('No profile found')
            
            const updatedProfile = {
                ...currentProfile,
                settings: {
                    ...currentProfile.settings,
                    ...settings
                },
                updatedAt: new Date().toISOString()
            }
            
            set({ profile: updatedProfile, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    }
}))