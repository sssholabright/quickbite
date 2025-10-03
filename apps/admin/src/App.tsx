import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import queryClient from './lib/queryClient'

// Auth Pages
import AuthRedirect from './components/AuthRedirect'
import AdminLogin from './pages/auth/AdminLogin'
import { useAdminStore } from './stores/adminStore'
import AdminProtectedRoute from './components/AdminProtectedRoute'

// Pages
import AdminUnauthorized from './pages/AdminUnauthorized'
import AdminDashboard from './pages/AdminDashboard'
import OrdersPage from './pages/OrdersPage'
import LogisticsPage from './pages/LogisticsPage'
import RidersPage from './pages/RidersPage'
import VendorsPage from './pages/VendorsPage'

// Separate component that has access to QueryClient
function AppContent() {
    const { checkAuth } = useAdminStore()

    useEffect(() => {
        checkAuth()
    }, [checkAuth])

    return (
        <Router>
            <Routes>
                {/* Public routes */}
                <Route path="/" element={<><h1>Admin Dashboard</h1></>} />

                {/* Admin auth routes */}
                <Route path="/admin/auth/login" element={
                    <AuthRedirect>
                        <AdminLogin />
                    </AuthRedirect>
                } />

                {/* Protected admin routes */}
                <Route path="/admin/dashboard" element={
                    <AdminProtectedRoute>
                        <AdminDashboard />
                    </AdminProtectedRoute>
                } />

                <Route path="/admin/orders" element={
                    <AdminProtectedRoute>
                        <OrdersPage />
                    </AdminProtectedRoute>
                } />

                <Route path="/admin/logistics" element={
                    <AdminProtectedRoute>
                        <LogisticsPage />
                    </AdminProtectedRoute>
                } />

                <Route path="/admin/riders" element={
                    <AdminProtectedRoute>
                        <RidersPage />
                    </AdminProtectedRoute>
                } />

                <Route path="/admin/vendors" element={
                    <AdminProtectedRoute>
                        <VendorsPage />
                    </AdminProtectedRoute>
                } />

                {/* Admin error routes */}
                <Route path="/admin/unauthorized" element={<AdminUnauthorized />} />
            </Routes>
        </Router>
    )
}

export default function App() {
    return (
       <QueryClientProvider client={queryClient}>
            <AppContent />
       </QueryClientProvider>
    )
}