import { useState } from 'react'
import { Order, OrderStatus } from '../../types/order'
import { formatNaira } from '../../lib/mockOrders'
import { FaMapMarkerAlt, FaClock, FaCheck, FaTimes, FaUtensils, FaMotorcycle, FaChevronDown, FaChevronUp, FaUser, FaPhone, FaLocationArrow, FaStar } from 'react-icons/fa'

interface OrderCardProps {
    order: Order;
    onAccept: () => Promise<void>;
    onReject: () => Promise<void>;
    onStatusUpdate: (status: string) => Promise<void>;
    onMarkReady?: () => Promise<void>;
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
            case 'PENDING': return 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300'
            case 'CONFIRMED': return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300'
            case 'PREPARING': return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300'
            case 'READY_FOR_PICKUP': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300'
            case 'PICKED_UP': return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300'
            case 'OUT_FOR_DELIVERY': return 'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 border-indigo-300'
            case 'DELIVERED': return 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-emerald-300'
            case 'CANCELLED': return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300'
            default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300'
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
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        <button
                            onClick={onAccept}
                            disabled={isLoading}
                            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FaCheck className="w-4 h-4" />
                            <span>Accept</span>
                        </button>
                        <button
                            onClick={onReject}
                            disabled={isLoading}
                            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FaTimes className="w-4 h-4" />
                            <span>Reject</span>
                        </button>
                    </div>
                )
            case 'CONFIRMED':
                return (
                    <button
                        onClick={() => onStatusUpdate?.('PREPARING')}
                        disabled={isLoading}
                        className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FaUtensils className="w-4 h-4" />
                        <span>Start Preparing</span>
                    </button>
                )
            case 'PREPARING':
                return (
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                        {onMarkReady && (
                            <button
                                onClick={onMarkReady}
                                disabled={isLoading}
                                className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm font-semibold rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FaCheck className="w-4 h-4" />
                                <span>Mark Ready</span>
                            </button>
                        )}
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="group bg-white rounded-3xl shadow-sm border-2 border-gray-100 hover:border-primary-300 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] overflow-hidden">
            {/* Order Header */}
            <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                    <div className="flex items-center space-x-4 mb-4 lg:mb-0">
                        <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors duration-200">
                                {order.orderNumber}
                            </h3>
                            <p className="text-sm text-gray-600 font-medium">{order.customerName}</p>
                        </div>
                        <span className={`px-4 py-2 text-sm font-bold rounded-2xl border shadow-sm ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                        </span>
                    </div>
                    
                    <div className="flex items-center justify-between lg:justify-end space-x-4">
                        <div className="text-right">
                            <p className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                                {formatNaira(order.items.reduce((acc, item) => acc + item.totalPrice, 0))}
                            </p>
                            <p className="text-sm text-gray-500 font-medium">{order.items.length} items</p>
                        </div>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-3 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-2xl transition-all duration-200"
                        >
                            {isExpanded ? <FaChevronUp className="w-5 h-5" /> : <FaChevronDown className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-xl flex items-center justify-center">
                                <FaClock className="w-4 h-4 text-gray-500" />
                            </div>
                            <span className="font-semibold">
                                {new Date(order.createdAt).toLocaleTimeString('en-NG', { 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    hour12: true
                                }).toUpperCase()}
                            </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
                                <FaMapMarkerAlt className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="font-semibold line-clamp-1">
                                {order.deliveryAddress.address}
                            </span>
                        </div>
                        
                        {order.rider && (
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                                    <FaMotorcycle className="w-4 h-4 text-green-600" />
                                </div>
                                <span className="font-semibold">{order.rider.name}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-shrink-0">
                        {getActionButtons()}
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="border-t border-gray-100 p-6 bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* Order Items */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                                <FaUtensils className="w-5 h-5 mr-2 text-primary-600" />
                                Order Items
                            </h4>
                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-start py-3 border-b border-gray-100 last:border-b-0">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-gray-900">{item.name}</p>
                                            <p className="text-sm text-gray-600 font-medium">Qty: {item.quantity}</p>
                                            {item.specialInstructions && (
                                                <p className="text-xs text-gray-500 italic mt-1 bg-yellow-50 px-2 py-1 rounded-lg">
                                                    Note: {item.specialInstructions}
                                                </p>
                                            )}
                                            {item.addOns && item.addOns.length > 0 && (
                                                <div className="mt-2">
                                                    {item.addOns.map((addOn) => (
                                                        <p key={addOn.id} className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-lg mb-1">
                                                            + {addOn.addOn?.name} x{addOn.quantity} ({formatNaira((addOn.price || addOn.addOn?.price || 0) * addOn.quantity)})
                                                        </p>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <p className="font-bold text-gray-900 ml-4">{formatNaira(item.totalPrice)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Delivery Details */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <h4 className="font-bold text-gray-900 mb-4 flex items-center">
                                <FaLocationArrow className="w-5 h-5 mr-2 text-primary-600" />
                                Delivery Details
                            </h4>
                            <div className="space-y-4">
                                <div className="p-3 bg-gray-50 rounded-xl">
                                    <p className="text-sm font-bold text-gray-700 mb-1 flex items-center">
                                        <FaUser className="w-4 h-4 mr-2" />
                                        Customer
                                    </p>
                                    <p className="text-gray-900 font-semibold">{order.customerName}</p>
                                    {order.customerPhone && (
                                        <p className="text-sm text-gray-600 flex items-center mt-1">
                                            <FaPhone className="w-3 h-3 mr-1" />
                                            {order.customerPhone}
                                        </p>
                                    )}
                                </div>
                                
                                <div className="p-3 bg-gray-50 rounded-xl">
                                    <p className="text-sm font-bold text-gray-700 mb-1 flex items-center">
                                        <FaMapMarkerAlt className="w-4 h-4 mr-2" />
                                        Address
                                    </p>
                                    <p className="text-gray-900 font-semibold">{order.deliveryAddress.address}</p>
                                    {order.deliveryAddress.city && (
                                        <p className="text-sm text-gray-600">
                                            {order.deliveryAddress.city}, {order.deliveryAddress.state}
                                        </p>
                                    )}
                                </div>
                                
                                {order.specialInstructions && (
                                    <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                                        <p className="text-sm font-bold text-gray-700 mb-1">Special Instructions</p>
                                        <p className="text-gray-900">{order.specialInstructions}</p>
                                    </div>
                                )}
                                
                                {order.rider && (
                                    <div className="p-3 bg-green-50 rounded-xl border border-green-200">
                                        <p className="text-sm font-bold text-gray-700 mb-1 flex items-center">
                                            <FaMotorcycle className="w-4 h-4 mr-2" />
                                            Rider
                                        </p>
                                        <p className="text-gray-900 font-semibold">{order.rider.name}</p>
                                        <p className="text-sm text-gray-600 flex items-center mt-1">
                                            <FaStar className="w-3 h-3 mr-1 text-yellow-500" />
                                            {order.rider.vehicleType} • Rating: {order.rider.rating}/5
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Order Total */}
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center text-lg font-bold bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                            <span className="text-gray-900">Total Amount:</span>
                            <span className="bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
                                {formatNaira(order.items.reduce((acc, item) => acc + item.totalPrice, 0))}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}