import { ReactNode, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import NotificationCenter from '../notifications/NotificationCenter'
import NotificationToastContainer from '../notifications/NotificationToastContainer'
import { FaHome, FaClipboardList, FaUtensils, FaUser, FaCog, FaSignOutAlt, FaBars, FaTimes, FaTags, FaBell, FaChevronRight } from 'react-icons/fa'

interface VendorLayoutProps {
    children: ReactNode
}

export default function VendorLayout({ children }: VendorLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { user, logout } = useAuthStore()
    const location = useLocation()
    const navigate = useNavigate()

    const navigation = [
        { name: 'Dashboard', href: '/vendor/dashboard', icon: FaHome },
        { name: 'Orders', href: '/vendor/orders', icon: FaClipboardList },
        { name: 'Categories', href: '/vendor/categories', icon: FaTags },
        { name: 'Menu', href: '/vendor/menu', icon: FaUtensils },
        { name: 'Profile', href: '/vendor/profile', icon: FaUser },
        { name: 'Settings', href: '/vendor/settings', icon: FaCog },
    ]

    const handleLogout = async () => {
        try {
            await logout('/vendor/auth/login')
        } catch (error) {
            console.error('Logout failed:', error)
            navigate('/vendor/auth/login')
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-black bg-opacity-50 backdrop-blur-sm lg:hidden transition-opacity duration-300"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-all duration-300 ease-in-out ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}>
                {/* Sidebar Header */}
                <div className="flex items-center justify-between h-20 px-6 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg">
                            <FaUtensils className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                                QuickBite
                            </span>
                            <p className="text-xs text-gray-500 font-medium">Vendor Portal</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="mt-8 px-4">
                    <div className="space-y-2">
                        {navigation.map((item) => {
                            const isActive = location.pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`group flex items-center justify-between px-4 py-4 text-sm font-medium rounded-2xl transition-all duration-200 ${
                                        isActive
                                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg transform scale-[1.02]'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-md'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <div className={`p-2 rounded-xl mr-3 transition-all duration-200 ${
                                            isActive 
                                                ? 'bg-white bg-opacity-20' 
                                                : 'bg-gray-100 group-hover:bg-primary-50'
                                        }`}>
                                            <item.icon className={`w-5 h-5 ${
                                                isActive ? 'text-white' : 'text-gray-500 group-hover:text-primary-600'
                                            }`} />
                                        </div>
                                        <span className="font-semibold">{item.name}</span>
                                    </div>
                                    <FaChevronRight className={`w-4 h-4 transition-all duration-200 ${
                                        isActive 
                                            ? 'text-white opacity-70' 
                                            : 'text-gray-400 group-hover:text-primary-500 opacity-0 group-hover:opacity-100'
                                    }`} />
                                </Link>
                            )
                        })}
                    </div>
                </nav>

                {/* User Profile Section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-4 mb-4">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <FaUser className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                                <p className="text-xs text-gray-500">Vendor Account</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Logout button */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-2xl transition-all duration-200 group"
                    >
                        <div className="p-2 bg-red-100 group-hover:bg-red-200 rounded-xl mr-3 transition-all duration-200">
                            <FaSignOutAlt className="w-4 h-4" />
                        </div>
                        <span className="font-semibold">Logout</span>
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:ml-72">
                {/* Top bar */}
                <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-100">
                    <div className="flex items-center justify-between h-20 px-4 sm:px-6 lg:px-8">
                        {/* Left side - Mobile menu button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
                        >
                            <FaBars className="w-6 h-6" />
                        </button>

                        {/* Right side - Notifications and vendor info */}
                        <div className="flex items-center space-x-6 ml-auto">
                            {/* Enhanced Notifications */}
                            <div className="relative">
                                <NotificationCenter />
                            </div>

                            {/* Vendor info */}
                            <div className="flex items-center space-x-4">
                                <div className="hidden sm:block text-right">
                                    <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                                    <p className="text-xs text-gray-500">Vendor Portal</p>
                                </div>
                                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                                    <FaUser className="w-6 h-6 text-white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            {/* Notification Toast Container */}
            <NotificationToastContainer />
        </div>
    )
}