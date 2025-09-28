import { useState } from 'react'
import { Order, OrderStatus } from '../../types/order'
import { formatNaira } from '../../lib/mockOrders'
import { 
    FaMapMarkerAlt, 
    FaClock, 
    FaCheck, 
    FaTimes, 
    FaUtensils,
    FaMotorcycle,
    FaChevronDown,
    FaChevronUp
} from 'react-icons/fa'

interface OrderCardProps {
    order: Order;
    onAccept: () => Promise<void>;
    onReject: () => Promise<void>;
    onStatusUpdate: (status: string) => Promise<void>;
    onMarkReady?: () => Promise<void>; // Add this line
    isLoading: boolean;
}

export default function OrderCard({ 
    order, 
    onAccept, 
    onReject, 
    onStatusUpdate, 
    onMarkReady,
    isLoading = false 
}: OrderCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            case 'CONFIRMED': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'PREPARING': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'READY_FOR_PICKUP': return 'bg-green-100 text-green-800 border-green-200'
            case 'PICKED_UP': return 'bg-green-100 text-green-800 border-green-200'
            case 'OUT_FOR_DELIVERY': return 'bg-green-100 text-green-800 border-green-200'
            case 'DELIVERED': return 'bg-green-100 text-green-800 border-green-200'
            case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getStatusText = (status: OrderStatus) => {
        switch (status) {
            case 'PENDING': return 'Pending'
            case 'CONFIRMED': return 'Confirmed'
            case 'PREPARING': return 'Preparing'
            case 'READY_FOR_PICKUP': return 'Ready'
            case 'PICKED_UP': return 'Picked Up'
            case 'OUT_FOR_DELIVERY': return 'Out for Delivery'
            case 'DELIVERED': return 'Delivered'
            case 'CANCELLED': return 'Cancelled'
            default: return status
        }
    }

    const getActionButtons = () => {
        switch (order.status) {
            case 'PENDING':
                return (
                    <div className="flex space-x-2">
                        <button
                            onClick={onAccept}
                            disabled={isLoading}
                            className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            <FaCheck className="w-4 h-4 mr-1" />
                            Accept
                        </button>
                        <button
                            onClick={onReject}
                            disabled={isLoading}
                            className="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            <FaTimes className="w-4 h-4 mr-1" />
                            Reject
                        </button>
                    </div>
                )
            case 'CONFIRMED':
                return (
                    <button
                        onClick={() => onStatusUpdate?.('PREPARING')}
                        disabled={isLoading}
                        className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                        <FaUtensils className="w-4 h-4 mr-1" />
                        Start Preparing
                    </button>
                )
            case 'PREPARING':
                return (
                    <div className="flex space-x-2">
                        {/* <button
                            onClick={() => onStatusUpdate?.('READY_FOR_PICKUP')}
                            disabled={isLoading}
                            className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            <FaCheck className="w-4 h-4 mr-1" />
                            Mark Ready
                        </button> */}
                        {onMarkReady && (
                            <button
                                onClick={onMarkReady}
                                disabled={isLoading}
                                className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                            >
                                <FaCheck className="w-4 h-4 mr-1" />
                                Mark Ready
                            </button>
                        )}
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border m-4 border-gray-200 overflow-hidden">
            {/* Order Header */}
            <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
                            <p className="text-sm text-gray-600">{order.customerName}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                        </span>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">{formatNaira(order.items.reduce((acc, item) => acc + item.totalPrice, 0))}</p>
                            <p className="text-sm text-gray-500">{order.items.length} items</p>
                        </div>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            {isExpanded ? <FaChevronUp className="w-4 h-4" /> : <FaChevronDown className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="flex items-center">
                            <FaClock className="w-4 h-4 mr-2" />
                            {new Date(order.createdAt).toLocaleTimeString('en-NG', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: true
                            }).toUpperCase()}
                        </div>
                        <div className="flex items-center">
                            <FaMapMarkerAlt className="w-4 h-4 mr-2" />
                            {order.deliveryAddress.address}
                        </div>
                        {order.rider && (
                            <div className="flex items-center">
                                <FaMotorcycle className="w-4 h-4 mr-2" />
                                {order.rider.name}
                            </div>
                        )}
                    </div>
                    {getActionButtons()}
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Order Items */}
                        <div>
                            <h4 className="font-bold text-gray-900 mb-3">Order Items</h4>
                            <div className="space-y-2">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                                        <div>
                                            <p className="font-semibold text-gray-900">{item.name}</p>
                                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                            {item.specialInstructions && (
                                                <p className="text-xs text-gray-500 italic">Note: {item.specialInstructions}</p>
                                            )}
                                            {item.addOns && item.addOns.length > 0 && (
                                                <div className="mt-1">
                                                    {item.addOns.map((addOn) => (
                                                        <p key={addOn.id} className="text-xs text-gray-500">
                                                            + {addOn.addOn?.name} x{addOn.quantity} ({formatNaira((addOn.price || addOn.addOn?.price || 0) * addOn.quantity)})
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <p className="font-semibold text-gray-900">{formatNaira(item.totalPrice)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Delivery Details */}
                        <div>
                            <h4 className="font-bold text-gray-900 mb-3">Delivery Details</h4>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Customer</p>
                                    <p className="text-gray-900">{order.customerName}</p>
                                    {order.customerPhone && (
                                        <p className="text-sm text-gray-600">{order.customerPhone}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Address</p>
                                    <p className="text-gray-900">{order.deliveryAddress.address}</p>
                                    {order.deliveryAddress.city && (
                                        <p className="text-sm text-gray-600">
                                            {order.deliveryAddress.city}, {order.deliveryAddress.state}
                                        </p>
                                    )}
                                </div>
                                {order.specialInstructions && (
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">Special Instructions</p>
                                        <p className="text-gray-900">{order.specialInstructions}</p>
                                    </div>
                                )}
                                {order.rider && (
                                    <div>
                                        <p className="text-sm font-semibold text-gray-700">Rider</p>
                                        <p className="text-gray-900">{order.rider.name}</p>
                                        <p className="text-sm text-gray-600">
                                            {order.rider.vehicleType} • Rating: {order.rider.rating}/5
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    {/* <div className="mt-6 pt-4 border-t border-gray-200"> */}
                        <div className="flex justify-between items-center text-base font-semibold pt-2 border-t border-gray-200">
                            <span className="text-gray-900">Total:</span>
                            <span className="text-gray-900">{formatNaira(order.items.reduce((acc, item) => acc + item.totalPrice, 0))}</span>
                        </div>
                    {/* </div> */}
                </div>
            )}
        </div>
    )
}