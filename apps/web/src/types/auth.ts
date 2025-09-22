export interface LoginCredentials {
    email: string
    password: string
}

export interface RegisterData {
    email: string
    password: string
    name: string
    phone: string
    role: 'CUSTOMER' | 'RIDER' | 'VENDOR'
}

export interface ApiResponse<T> {
    status: string
    message: string
    data: T
}

export interface AuthResult {
    user: {
        id: string
        email: string
        name: string
        role: string
        isActive: boolean
    }
    tokens: {
        accessToken: string
        refreshToken: string
    }
}

export interface UserProfile {
    id: string
    email: string
    name: string
    phone: string | null
    avatar: string | null
    role: string
    isActive: boolean
    createdAt: string
    updatedAt: string
    vendor?: any
}