import { useState } from 'react'
import { Order, OrderStatus } from '../../types/order'
import { useOrderStore } from '../../stores/orderStore'
import { formatNaira } from '../../lib/mockOrders'
import { showConfirm, showSuccess, showError } from '../../utils/sweetAlert'
import { 
    FaUser, 
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
    order: Order
}

export default function OrderCard({ order }: OrderCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const { updateOrderStatus, acceptOrder, rejectOrder } = useOrderStore()

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

    const handleStatusUpdate = async (newStatus: OrderStatus) => {
        const statusText = getStatusText(newStatus)
        const result = await showConfirm(
            'Update Order Status',
            `Are you sure you want to mark this order as "${statusText}"?`,
            `Yes, mark as ${statusText}`,
            'Cancel'
        )

        if (result.isConfirmed) {
            setIsLoading(true)
            try {
                await updateOrderStatus(order.id, newStatus)
                showSuccess('Status Updated', `Order ${order.orderNumber} has been marked as ${statusText}`)
            } catch (error) {
                console.error('Failed to update order status:', error)
                showError('Error', 'Failed to update order status. Please try again.')
            } finally {
                setIsLoading(false)
            }
        }
    }

    const handleAccept = async () => {
        const result = await showConfirm(
            'Accept Order',
            `Are you sure you want to accept order ${order.orderNumber}?`,
            'Yes, accept order',
            'Cancel'
        )

        if (result.isConfirmed) {
            setIsLoading(true)
            try {
                await acceptOrder(order.id)
                showSuccess('Order Accepted', `Order ${order.orderNumber} has been accepted successfully`)
            } catch (error) {
                console.error('Failed to accept order:', error)
                showError('Error', 'Failed to accept order. Please try again.')
            } finally {
                setIsLoading(false)
            }
        }
    }

    const handleReject = async () => {
        const result = await showConfirm(
            'Reject Order',
            `Are you sure you want to reject order ${order.orderNumber}? This action cannot be undone.`,
            'Yes, reject order',
            'Cancel'
        )

        if (result.isConfirmed) {
            setIsLoading(true)
            try {
                await rejectOrder(order.id, 'Rejected by vendor')
                showSuccess('Order Rejected', `Order ${order.orderNumber} has been rejected`)
            } catch (error) {
                console.error('Failed to reject order:', error)
                showError('Error', 'Failed to reject order. Please try again.')
            } finally {
                setIsLoading(false)
            }
        }
    }

    const getActionButtons = () => {
        switch (order.status) {
            case 'PENDING':
                return (
                    <div className="flex space-x-2">
                        <button
                            onClick={handleAccept}
                            disabled={isLoading}
                            className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            <FaCheck className="w-4 h-4 mr-1" />
                            Accept
                        </button>
                        <button
                            onClick={handleReject}
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
                        onClick={() => handleStatusUpdate('PREPARING')}
                        disabled={isLoading}
                        className="flex items-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                        <FaUtensils className="w-4 h-4 mr-1" />
                        Start Preparing
                    </button>
                )
            case 'PREPARING':
                return (
                    <button
                        onClick={() => handleStatusUpdate('READY_FOR_PICKUP')}
                        disabled={isLoading}
                        className="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                        <FaCheck className="w-4 h-4 mr-1" />
                        Mark Ready
                    </button>
                )
            default:
                return null
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                            <p className="text-lg font-bold text-gray-900">{formatNaira(order.total)}</p>
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
                                minute: '2-digit' 
                            })}
                        </div>
                        <div className="flex items-center">
                            <FaMapMarkerAlt className="w-4 h-4 mr-2" />
                            {order.deliveryAddress.title}
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
                            <h4 className="font-medium text-gray-900 mb-3">Order Items</h4>
                            <div className="space-y-2">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                                        <div>
                                            <p className="font-medium text-gray-900">{item.name}</p>
                                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                            {item.specialInstructions && (
                                                <p className="text-xs text-gray-500 italic">Note: {item.specialInstructions}</p>
                                            )}
                                        </div>
                                        <p className="font-medium text-gray-900">{formatNaira(item.totalPrice)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Delivery Details */}
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Delivery Details</h4>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Customer</p>
                                    <p className="text-gray-900">{order.customerName}</p>
                                    {order.customerPhone && (
                                        <p className="text-sm text-gray-600">{order.customerPhone}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Address</p>
                                    <p className="text-gray-900">{order.deliveryAddress.address}</p>
                                    {order.deliveryAddress.city && (
                                        <p className="text-sm text-gray-600">
                                            {order.deliveryAddress.city}, {order.deliveryAddress.state}
                                        </p>
                                    )}
                                </div>
                                {order.specialInstructions && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Special Instructions</p>
                                        <p className="text-gray-900">{order.specialInstructions}</p>
                                    </div>
                                )}
                                {order.rider && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">Rider</p>
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
                    <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="text-gray-900">{formatNaira(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Delivery Fee:</span>
                            <span className="text-gray-900">{formatNaira(order.deliveryFee)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Service Fee:</span>
                            <span className="text-gray-900">{formatNaira(order.serviceFee)}</span>
                        </div>
                        <div className="flex justify-between items-center text-base font-semibold pt-2 border-t border-gray-200">
                            <span className="text-gray-900">Total:</span>
                            <span className="text-gray-900">{formatNaira(order.total)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}