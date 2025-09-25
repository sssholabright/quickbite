export type RiderOrderItem = {
	id: string;
	name: string;
	quantity: number;
    price: number; // Add this line
};

export type RiderAvailableOrder = {
	id: string;
	vendor: {
		id: string;
		name: string;
		phone?: string;
		pickupLocation: string;
        lat?: number
        lng?: number
	};
	dropoffAddress: string;
    dropoffLat?: number
    dropoffLng?: number
    customerName?: string;
    customerPhone?: string
	distanceKm: number;
	payout: number; // rider payout / delivery fee
	items: RiderOrderItem[];
	createdAt: Date;
};

export type AvailableOrderCardProps = {
	order: RiderAvailableOrder;
	onPress: () => void;
};