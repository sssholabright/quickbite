import React, { useState } from 'react';
import { useNotificationStore, Notification } from '../../stores/notificationStore';
import { FaBell, FaTimes, FaCheck, FaTrash } from 'react-icons/fa';

const NotificationCenter: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unread' | 'order' | 'delivery' | 'payment' | 'system'>('all');
    
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
        getUnreadNotifications,
        getNotificationsByType
    } = useNotificationStore();

    const getFilteredNotifications = (): Notification[] => {
        switch (filter) {
            case 'unread':
                return getUnreadNotifications();
            case 'order':
            case 'delivery':
            case 'payment':
            case 'system':
                return getNotificationsByType(filter);
            default:
                return notifications;
        }
    };

    const handleAction = (action: string, data?: any) => {
        console.log('Notification action:', action, data);
        // Handle different actions here
        switch (action) {
            case 'view_order':
                // Navigate to order details
                console.log('Navigate to order:', data?.orderId);
                break;
            case 'track_delivery':
                // Navigate to delivery tracking
                console.log('Track delivery:', data?.orderId);
                break;
            case 'contact_rider':
                // Open contact modal
                console.log('Contact rider:', data?.riderId);
                break;
            default:
                console.log('Unknown action:', action);
        }
    };

    const filteredNotifications = getFilteredNotifications();

    return (
        <div className="relative">
            {/* Notification Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <FaBell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                    {/* Header */}
                    <div className="p-4 border-b">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                            <div className="flex items-center space-x-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="text-sm text-blue-600 hover:text-blue-800"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <FaTimes className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Filter */}
                        <div className="mt-3">
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as any)}
                                className="w-full text-sm border border-gray-300 rounded-md px-3 py-1"
                            >
                                <option value="all">All Notifications</option>
                                <option value="unread">Unread Only</option>
                                <option value="order">Orders</option>
                                <option value="delivery">Delivery</option>
                                <option value="payment">Payment</option>
                                <option value="system">System</option>
                            </select>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {filteredNotifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                No notifications found
                            </div>
                        ) : (
                            filteredNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b hover:bg-gray-50 ${
                                        !notification.read ? 'bg-blue-50' : ''
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                                    {notification.title}
                                                </h4>
                                                {!notification.read && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {notification.message}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(notification.timestamp).toLocaleString()}
                                            </p>

                                            {/* Actions */}
                                            {notification.actions && notification.actions.length > 0 && (
                                                <div className="mt-2 flex space-x-2">
                                                    {notification.actions.map((action, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => handleAction(action.action, action.data)}
                                                            className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                                                        >
                                                            {action.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-1 ml-2">
                                            {!notification.read && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="p-1 text-gray-400 hover:text-green-600"
                                                    title="Mark as read"
                                                >
                                                    <FaCheck className="w-3 h-3" />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => removeNotification(notification.id)}
                                                className="p-1 text-gray-400 hover:text-red-600"
                                                title="Remove notification"
                                            >
                                                <FaTrash className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="p-4 border-t">
                            <button
                                onClick={clearAll}
                                className="w-full text-sm text-red-600 hover:text-red-800 py-2"
                            >
                                Clear All Notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;