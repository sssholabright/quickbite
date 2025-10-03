import React, { ReactNode, useState } from 'react'
import { FaBars, FaBell, FaChartBar, FaClipboardList, FaCog, FaCreditCard, FaHistory, FaHome, FaMotorcycle, FaSignOutAlt, FaStore, FaUsers, FaTruck, FaMoneyBillWave } from 'react-icons/fa'
import { FaTimes } from 'react-icons/fa'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAdminStore } from '../../stores/adminStore'

interface AdminLayoutProps {
    children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const { user, logout, hasPermission } = useAdminStore()
    const location = useLocation()
    const navigate = useNavigate()

    const navigation = [
        { 
            name: 'Dashboard', 
            href: '/admin/dashboard', 
            icon: FaHome,
            permission: 'dashboard.read',
            alwaysShow: true // Mark Dashboard to always show
        },
        { 
            name: 'Orders', 
            href: '/admin/orders', 
            icon: FaClipboardList,
            permission: 'orders.read'
        },
        { 
            name: 'Logistics', 
            href: '/admin/logistics', 
            icon: FaTruck,
            permission: 'logistics.read'
        },
        { 
            name: 'Riders', 
            href: '/admin/riders', 
            icon: FaMotorcycle,
            permission: 'riders.read'
        },
        { 
            name: 'Vendors', 
            href: '/admin/vendors', 
            icon: FaStore,
            permission: 'vendors.read'
        },
        { 
            name: 'Customers', 
            href: '/admin/customers', 
            icon: FaUsers,
            permission: 'customers.read'
        },
        { 
            name: 'Payments', 
            href: '/admin/payments', 
            icon: FaCreditCard,
            permission: 'payments.read'
        },
        { 
            name: 'Payouts', 
            href: '/admin/payouts', 
            icon: FaMoneyBillWave,
            permission: 'payouts.read'
        },
        { 
            name: 'Notifications', 
            href: '/admin/notifications', 
            icon: FaBell,
            permission: 'notifications.read'
        },
        { 
            name: 'Reports', 
            href: '/admin/reports', 
            icon: FaChartBar,
            permission: 'reports.read'
        },
        { 
            name: 'Settings', 
            href: '/admin/settings', 
            icon: FaCog,
            permission: 'settings.read'
        },
        { 
            name: 'Audit Log', 
            href: '/admin/audit', 
            icon: FaHistory,
            permission: 'audit.read'
        },
    ]

    // Filter navigation items based on permissions
    const filteredNavigation = navigation.filter(item => 
        item.alwaysShow || !item.permission || hasPermission(item.permission)
    )

    const handleLogout = async () => {
        try {
            await logout('/admin/auth/login')
        } catch (error) {
            console.error('Logout failed:', error)
            navigate('/admin/auth/login')
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

            {/* Sidebar */}
            <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <h1 className="text-xl font-bold text-primary-600">QuickBite Admin</h1>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                    >
                        <FaTimes className="w-5 h-5" />
                    </button>
                </div>

                <nav className="mt-6 px-3">
                    <div className="space-y-1">
                        {filteredNavigation.map((item) => {
                            const isActive = location.pathname === item.href
                            return (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                        isActive
                                            ? 'bg-primary-100 text-primary-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <item.icon className={`mr-3 flex-shrink-0 h-5 w-5 ${
                                        isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                                    }`} />
                                    {item.name}
                                </Link>
                            )
                        })}
                    </div>
                </nav>
            </div>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <div className="sticky top-0 z-30 bg-white shadow-sm border-b border-gray-200">
                    <div className="flex items-center justify-between h-16 px-4 sm:px-6">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-gray-400 hover:text-gray-600"
                        >
                            <FaBars className="w-5 h-5" />
                        </button>

                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-700">
                                Welcome, <span className="font-medium">{user?.name}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                            >
                                <FaSignOutAlt className="w-4 h-4 mr-2" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="flex-1 p-4 sm:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}