import { create } from 'zustand'
import { VendorProfile, ChangePasswordData } from '../types/vendor'
import { vendorService, VendorProfileData, VendorSettings, VendorStats } from '../services/vendorService'
import { authService } from '../services/authService'

interface VendorStore {
    profile: VendorProfile | null
    stats: VendorStats | null
    isLoading: boolean
    error: string | null
    setProfile: (profile: VendorProfile) => void
    setStats: (stats: VendorStats) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    fetchProfile: () => Promise<void>
    updateProfile: (updates: Partial<VendorProfile>, logoFile?: File) => Promise<void>
    updateSettings: (settings: Partial<VendorProfile['settings']>) => Promise<void>
    fetchStats: () => Promise<void>
    changePassword: (data: ChangePasswordData) => Promise<void>
    updateBankDetails: (bankDetails: Partial<VendorProfile['bankDetails']>) => Promise<void>
}

export const useVendorStore = create<VendorStore>((set, get) => ({
    profile: null,
    stats: null,
    isLoading: false,
    error: null,

    setProfile: (profile) => set({ profile }),
    setStats: (stats) => set({ stats }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),

    fetchProfile: async () => {
        set({ isLoading: true, error: null })
        
        try {
            const vendorProfile = await vendorService.getProfile()
            set({ profile: vendorProfile, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
        }
    },

    updateProfile: async (updates, logoFile) => {
        set({ isLoading: true, error: null })
        
        try {
            // Prepare data for vendor service
            const vendorData: VendorProfileData = {}
            
            if (updates.name) vendorData.businessName = updates.name
            if (updates.description) vendorData.description = updates.description
            if (updates.logo) vendorData.logo = updates.logo
            if (updates.address?.street) vendorData.businessAddress = updates.address.street
            if (updates.address?.coordinates?.lat) vendorData.latitude = updates.address.coordinates.lat
            if (updates.address?.coordinates?.lng) vendorData.longitude = updates.address.coordinates.lng
            if (updates.settings?.business?.isOpen !== undefined) vendorData.isOpen = updates.settings.business.isOpen

            const updatedProfile = await vendorService.updateProfile(vendorData, logoFile)
            set({ profile: updatedProfile, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    updateSettings: async (settings) => {
        set({ isLoading: true, error: null })
        
        try {
            const vendorSettings: VendorSettings = {}
            
            if (settings.business?.isOpen !== undefined) {
                vendorSettings.isOpen = settings.business.isOpen
            }

            const updatedProfile = await vendorService.updateSettings(vendorSettings)
            set({ profile: updatedProfile, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    fetchStats: async () => {
        set({ isLoading: true, error: null })
        
        try {
            const stats = await vendorService.getStats()
            set({ stats, isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    changePassword: async (data) => {
        set({ isLoading: true, error: null })
        
        try {
            // Use authService for password change
            await authService.changePassword(data)
            set({ isLoading: false })
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    },

    updateBankDetails: async (bankDetails) => {
        set({ isLoading: true, error: null })
        
        try {
            // Note: Backend doesn't have bank details endpoint yet
            // This would need to be implemented
            console.warn('Bank details update not implemented in backend')
            
            const currentProfile = get().profile
            if (currentProfile) {
                const updatedProfile = {
                    ...currentProfile,
                    bankDetails: { ...currentProfile.bankDetails, ...bankDetails }
                }
                set({ profile: updatedProfile, isLoading: false })
            }
        } catch (error: any) {
            set({ error: error.message, isLoading: false })
            throw error
        }
    }
}))