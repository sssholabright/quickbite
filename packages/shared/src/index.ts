export const helloShared = () => "If you see this, you're good to go!";
export type OrderStatus =
    | "PENDING" | "ACCEPTED" | "PREPARING"
    | "READY_FOR_PICKUP" | "PICKED_UP" | "CANCELLED" | "REFUNDED";