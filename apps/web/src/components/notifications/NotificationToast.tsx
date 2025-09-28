import React, { useEffect, useState } from 'react';
import { Notification } from '../../stores/notificationStore';
import { FaCheckCircle, FaBell, FaInfo, FaTimes } from 'react-icons/fa';

interface NotificationToastProps {
    notification: Notification;
    onClose: () => void;
    onAction?: (action: string, data?: any) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
    notification,
    onClose,
    onAction
}) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Trigger animation
        setIsVisible(true);
        
        // Auto close after 5 seconds for normal priority, 10 seconds for high/urgent
        const timeout = notification.priority === 'urgent' || notification.priority === 'high' 
            ? 10000 
            : 5000;
            
        const timer = setTimeout(() => {
            handleClose(false); // Don't mark as read when auto-closing
        }, timeout);

        return () => clearTimeout(timer);
    }, []);

    const handleClose = (markAsRead: boolean = true) => {
        setIsVisible(false);
        if (markAsRead) {
            setTimeout(onClose, 300); // Wait for animation to complete
        }
    };

    const handleAction = (action: string, data?: any) => {
        if (onAction) {
            onAction(action, data);
        }
        handleClose(true); // Mark as read when action is taken
    };

    const getIcon = () => {
        switch (notification.type) {
            case 'order':
                return <FaCheckCircle className="w-5 h-5 text-blue-500" />;
            case 'delivery':
                return <FaBell className="w-5 h-5 text-green-500" />;
            case 'payment':
                return <FaCheckCircle className="w-5 h-5 text-green-500" />;
            case 'system':
                return <FaInfo className="w-5 h-5 text-gray-500" />;
            default:
                return <FaBell className="w-5 h-5 text-blue-500" />;
        }
    };

    const getPriorityStyles = () => {
        switch (notification.priority) {
            case 'urgent':
                return 'border-l-4 border-red-500 bg-red-50';
            case 'high':
                return 'border-l-4 border-orange-500 bg-orange-50';
            case 'normal':
                return 'border-l-4 border-blue-500 bg-blue-50';
            case 'low':
                return 'border-l-4 border-gray-500 bg-gray-50';
            default:
                return 'border-l-4 border-blue-500 bg-blue-50';
        }
    };

    return (
        <div
            className={`
                fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border
                transform transition-all duration-300 ease-in-out
                ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
                ${getPriorityStyles()}
            `}
        >
            <div className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                        {getIcon()}
                        <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-gray-900 truncate">
                                {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                                {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.timestamp).toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => handleClose(true)} // Mark as read when manually closed
                        className="ml-2 flex-shrink-0 text-gray-400 hover:text-gray-600"
                    >
                        <FaTimes className="w-4 h-4" />
                    </button>
                </div>

                {/* Actions */}
                {notification.actions && notification.actions.length > 0 && (
                    <div className="mt-3 flex space-x-2">
                        {notification.actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={() => handleAction(action.action, action.data)}
                                className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors"
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationToast;