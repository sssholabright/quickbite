import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useAuthStore } from './stores/authStore'
import { useSocket } from './hooks/useSocket'
import ProtectedRoute from './components/ProtectedRoute'
import AuthRedirect from './components/AuthRedirect'
import Home from './pages/Home'
import VendorLogin from './pages/auth/VendorLogin'
import VendorForgotPassword from './pages/auth/VendorForgotPassword'
import VendorDashboard from './pages/vendor/VendorDashboard'
import OrdersPage from './pages/vendor/OrdersPage'
import MenuPage from './pages/vendor/MenuPage'
import ProfilePage from './pages/vendor/ProfilePage'
import SettingsPage from './pages/vendor/SettingsPage'
import Unauthorized from './pages/Unauthorized'
import { queryClient } from './lib/queryClient'
import CategoriesPage from './pages/vendor/CategoriesPage'

// Separate component that has access to QueryClient
function AppContent() {
    const { checkAuth } = useAuthStore()
    
    // Initialize socket at app level - now inside QueryClientProvider
    useSocket();

    // Check authentication status on app start
    useEffect(() => {
        checkAuth()
    }, [checkAuth])

    return (
        <Router>
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<Home />} />
                
                {/* Vendor auth routes */}
                <Route path="/vendor/auth/login" element={
                    <AuthRedirect>
                        <VendorLogin />
                    </AuthRedirect>
                } />
                <Route path="/vendor/auth/forgot-password" element={
                    <AuthRedirect>
                        <VendorForgotPassword />
                    </AuthRedirect>
                } />
                
                {/* Protected vendor routes */}
                <Route path="/vendor/dashboard" element={
                    <ProtectedRoute>
                        <VendorDashboard />
                    </ProtectedRoute>
                } />
                <Route path="/vendor/orders" element={
                    <ProtectedRoute>
                        <OrdersPage />
                    </ProtectedRoute>
                } />
                <Route path="/vendor/menu" element={
                    <ProtectedRoute>
                        <MenuPage />
                    </ProtectedRoute>
                } />
                <Route path="/vendor/profile" element={
                    <ProtectedRoute>
                        <ProfilePage />
                    </ProtectedRoute>
                } />
                <Route path="/vendor/settings" element={
                    <ProtectedRoute>
                        <SettingsPage />
                    </ProtectedRoute>
                } />
                <Route path="/vendor/categories" element={
                    <ProtectedRoute>
                        <CategoriesPage />
                    </ProtectedRoute>
                } />
                
                {/* Error routes */}
                <Route path="/unauthorized" element={<Unauthorized />} />
            </Routes>
        </Router>
    )
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AppContent />
            {/* {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />} */}
        </QueryClientProvider>
    )
}

export default App