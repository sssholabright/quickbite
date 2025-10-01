import { UnifiedOrder } from '../types/order';

/**
 * 🚀 UNIFIED: Single data transformation utility
 * Converts backend data to frontend format consistently
 */
export class DataTransform {
    /**
     * Transform backend delivery job data to unified frontend format
     */
    static transformDeliveryJob(backendData: any): UnifiedOrder {
        return {
            id: backendData.orderId,
            orderId: backendData.orderId,
            orderNumber: backendData.orderNumber,
            vendor: {
                id: backendData.vendorId,
                name: backendData.vendorName,
                phone: '', // Will be updated from vendor data
                pickupLocation: backendData.pickupAddress || '',
                address: backendData.pickupAddress || '',
                lat: 0, // Will be updated from vendor location
                lng: 0  // Will be updated from vendor location
            },
            customer: {
                id: backendData.customerId,
                name: backendData.customerName,
                phone: '', // Will be updated from customer data
                address: typeof backendData.deliveryAddress === 'string' 
                    ? JSON.parse(backendData.deliveryAddress).address 
                    : backendData.deliveryAddress?.address || '',
                dropoffAddress: typeof backendData.deliveryAddress === 'string' 
                    ? JSON.parse(backendData.deliveryAddress).address 
                    : backendData.deliveryAddress?.address || '',
                lat: typeof backendData.deliveryAddress === 'string'
                    ? JSON.parse(backendData.deliveryAddress).coordinates?.lat || 0
                    : backendData.deliveryAddress?.coordinates?.lat || 0,
                lng: typeof backendData.deliveryAddress === 'string'
                    ? JSON.parse(backendData.deliveryAddress).coordinates?.lng || 0
                    : backendData.deliveryAddress?.coordinates?.lng || 0,
                dropoffLat: typeof backendData.deliveryAddress === 'string'
                    ? JSON.parse(backendData.deliveryAddress).coordinates?.lat || 0
                    : backendData.deliveryAddress?.coordinates?.lat || 0,
                dropoffLng: typeof backendData.deliveryAddress === 'string'
                    ? JSON.parse(backendData.deliveryAddress).coordinates?.lng || 0
                    : backendData.deliveryAddress?.coordinates?.lng || 0
            },
            deliveryAddress: backendData.deliveryAddress,
            deliveryFee: backendData.deliveryFee || 0,
            payout: backendData.deliveryFee || 0,
            estimatedDistance: backendData.distance || 0,
            distanceKm: backendData.distance || 0,
            items: backendData.items || [],
            createdAt: new Date().toISOString(),
            expiresIn: backendData.timer || 30,
            timer: backendData.timer || 30
        };
    }

    /**
     * Transform backend order data to unified frontend format
     */
    static transformOrder(backendOrder: any): UnifiedOrder {
        return {
            id: backendOrder.id,
            orderId: backendOrder.id,
            orderNumber: backendOrder.orderNumber,
            vendor: {
                id: backendOrder.vendor?.id || '',
                name: backendOrder.vendor?.businessName || 'Unknown Vendor',
                phone: backendOrder.vendor?.phone || '',
                pickupLocation: backendOrder.vendor?.businessAddress || '',
                address: backendOrder.vendor?.businessAddress || '',
                lat: backendOrder.vendor?.latitude || 0,
                lng: backendOrder.vendor?.longitude || 0
            },
            customer: {
                id: backendOrder.customer?.id || '',
                name: backendOrder.customer?.user?.name || 'Customer',
                phone: backendOrder.customer?.user?.phone || '',
                address: backendOrder.deliveryAddress?.address || '',
                dropoffAddress: backendOrder.deliveryAddress?.address || '',
                lat: backendOrder.deliveryAddress?.coordinates?.lat || 0,
                lng: backendOrder.deliveryAddress?.coordinates?.lng || 0,
                dropoffLat: backendOrder.deliveryAddress?.coordinates?.lat || 0,
                dropoffLng: backendOrder.deliveryAddress?.coordinates?.lng || 0
            },
            deliveryAddress: backendOrder.deliveryAddress,
            deliveryFee: backendOrder.deliveryFee || 0,
            payout: backendOrder.deliveryFee || 0,
            estimatedDistance: 0, // Will be calculated
            distanceKm: 0,
            items: (backendOrder.items || []).map((item: any) => ({
                id: item.id,
                name: item.menuItem?.name || 'Unknown Item',
                quantity: item.quantity || 1,
                price: item.unitPrice || 0
            })),
            createdAt: new Date(backendOrder.createdAt).toISOString(),
            expiresIn: backendOrder.timer || 60,
            timer: backendOrder.timer || 60
        };
    }
}
