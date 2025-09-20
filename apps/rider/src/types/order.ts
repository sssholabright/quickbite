export type RiderOrderItem = {
	id: string;
	name: string;
	quantity: number;
};

export type RiderAvailableOrder = {
	id: string;
	vendor: {
		id: string;
		name: string;
		pickupLocation: string;
        lat?: number
        lng?: number
	};
	dropoffAddress: string;
    dropoffLat?: number
    dropoffLng?: number
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