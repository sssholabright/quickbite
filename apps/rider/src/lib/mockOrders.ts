import { RiderAvailableOrder } from "../types/order";

export const mockAvailableOrders: RiderAvailableOrder[] = [
	{
		id: "r-1",
		vendor: { id: "v-1", name: "Mama Nkechi's Kitchen", pickupLocation: "Block A, Room 12", lat: 6.4301, lng: 3.4219 },
		dropoffAddress: "Hall 3, Room 204",
		dropoffLat: 6.432, dropoffLng: 3.419,
		customerPhone: "+2348012345678",
		distanceKm: 0.8,
		payout: 650,
		items: [
			{ id: "i-1", name: "Jollof Rice", quantity: 2 },
			{ id: "i-2", name: "Fried Chicken", quantity: 1 }
		],
		createdAt: new Date(Date.now() - 5 * 60 * 1000)
	},
	{
		id: "r-2",
		vendor: { id: "v-2", name: "Uncle Tunde's Spot", pickupLocation: "Block B, Room 8", lat: 6.4295, lng: 3.4228 },
		dropoffAddress: "Faculty of Science, Gate",
		customerPhone: "+2348098765432",
		distanceKm: 1.4,
		payout: 800,
		items: [{ id: "i-3", name: "Pounded Yam & Egusi", quantity: 1 }],
		createdAt: new Date(Date.now() - 10 * 60 * 1000)
	},
	{
		id: "r-3",
		vendor: { id: "v-3", name: "Aunty Grace's Place", pickupLocation: "Block C, Room 5" },
		dropoffAddress: "Hostel A, Reception",
		customerPhone: "+2347011122233",
		distanceKm: 0.5,
		payout: 500,
		items: [
			{ id: "i-4", name: "Beans & Plantain", quantity: 1 },
			{ id: "i-5", name: "Fish Stew", quantity: 1 }
		],
		createdAt: new Date(Date.now() - 20 * 60 * 1000)
	}
];