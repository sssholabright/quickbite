export interface VendorProfile {
    id: string
    name: string
    email: string
    phone: string
    logo?: string
    description?: string
    address: VendorAddress
    bankDetails: BankDetails
    settings: VendorSettings
    createdAt: string
    updatedAt: string
}

export interface VendorAddress {
    street: string
    city: string
    state: string
    country: string
    postalCode: string
    coordinates?: {
        lat: number
        lng: number
    }
}

export interface BankDetails {
    bankName: string
    accountNumber: string
    accountName: string
    bankCode?: string
    isVerified: boolean
}

export interface VendorSettings {
    notifications: {
        email: boolean
        sms: boolean
        push: boolean
        orderUpdates: boolean
        paymentUpdates: boolean
        marketing: boolean
    }
    business: {
        isOpen: boolean
        operatingHours: {
            [key: string]: {
                open: string
                close: string
                isOpen: boolean
            }
        }
        deliveryRadius: number
        minimumOrderAmount: number
    }
}

export interface ChangePasswordData {
    currentPassword: string
    newPassword: string
    confirmPassword: string
}