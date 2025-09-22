import { ReactNode, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { FaHome, FaClipboardList, FaUtensils, FaUser, FaCog, FaBell, FaSignOutAlt, FaBars, FaTimes, FaTags } from 'react-icons/fa'

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
        { name: 'Menu', href: '/vendor/menu', icon: FaUtensils },
        { name: 'Profile', href: '/vendor/profile', icon: FaUser },
        { name: 'Settings', href: '/vendor/settings', icon: FaCog },
        { name: 'Categories', href: '/vendor/categories', icon: FaTags, current: location.pathname === '/vendor/categories' },
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
        <div className="min-h-screen bg-gray-50">
            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Always fixed on desktop */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                            <FaUtensils className="w-5 h-5 text-white" />
                        </div>
                        <span className="ml-3 text-xl font-bold text-gray-900">QuickBite</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-gray-500 hover:text-gray-700"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                <nav className="mt-8 px-4">
                    <ul className="space-y-2">
                        {navigation.map((item) => {
                            const isActive = item.current || location.pathname === item.href
                            return (
                                <li key={item.name}>
                                    <Link
                                        to={item.href}
                                        onClick={() => setSidebarOpen(false)}
                                        className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                            isActive
                                                ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                    >
                                        <item.icon className="w-5 h-5 mr-3" />
                                        {item.name}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                {/* Logout button */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors"
                    >
                        <FaSignOutAlt className="w-5 h-5 mr-3" />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main content - Always offset by sidebar width on desktop */}
            <div className="lg:ml-64">
                {/* Top bar */}
                <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
                    <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                        {/* Left side - Mobile menu button */}
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-gray-500 hover:text-gray-700"
                        >
                            <FaBars className="w-6 h-6" />
                        </button>

                        {/* Right side - Notifications and vendor info */}
                        <div className="flex items-center space-x-4 ml-auto">
                            {/* Notifications */}
                            <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                                <FaBell className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            {/* Vendor info */}
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                                    <FaUser className="w-4 h-4 text-primary-600" />
                                </div>
                                <div className="ml-3 hidden sm:block">
                                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                    <p className="text-xs text-gray-500">Vendor</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
