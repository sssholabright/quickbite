import { OrderStats as OrderStatsType } from '../../types/order'
import { FaClipboardList, FaUtensils, FaCheckCircle, FaTimes } from 'react-icons/fa'

interface OrderStatsProps {
    stats: OrderStatsType
}

export default function OrderStats({ stats }: OrderStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <FaClipboardList className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Pending</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <FaUtensils className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Preparing</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.preparing}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FaCheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Ready</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.ready}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <FaCheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Delivered</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <FaTimes className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">Cancelled</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}