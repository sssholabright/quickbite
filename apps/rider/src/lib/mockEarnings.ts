export type EarningEntry = {
	id: string;
	date: string; // ISO date
	orderId: string;
	amount: number;
	status: "pending" | "paid";
};

export const mockEarnings: EarningEntry[] = [
	{ id: "e1", date: new Date().toISOString(), orderId: "QB1234", amount: 650, status: "pending" },
	{ id: "e2", date: new Date().toISOString(), orderId: "QB1235", amount: 500, status: "pending" },
	{ id: "e3", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), orderId: "QB1222", amount: 800, status: "paid" },
	{ id: "e4", date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), orderId: "QB1211", amount: 450, status: "paid" },
	{ id: "e5", date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(), orderId: "QB1101", amount: 700, status: "paid" },
];

export function filterByRange(entries: EarningEntry[], range: "day" | "week" | "month") {
	const now = new Date();
	const start = new Date(now);
	if (range === "day") start.setHours(0, 0, 0, 0);
	if (range === "week") {
		const day = (now.getDay() + 6) % 7; // Monday as start
		start.setDate(now.getDate() - day);
		start.setHours(0, 0, 0, 0);
	}
	if (range === "month") {
		start.setDate(1);
		start.setHours(0, 0, 0, 0);
	}
	return entries.filter(e => new Date(e.date) >= start);
}
