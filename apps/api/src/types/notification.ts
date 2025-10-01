// Mobile notification types (direct socket + FCM)
export interface MobileNotification {
    type: 'delivery_job' | 'order_status_update' | 'rider_assigned' | 'order_delivered' | 'eta_update';
    data: any;
    pushNotification?: {
        title: string;
        body: string;
        data?: any;
    };
}

// Web notification types (socket + queue)
export interface WebNotification {
    type: 'new_order' | 'order_status_update' | 'system_alert' | 'delivery_update';
    title: string;
    message: string;
    data: any;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    actions?: Array<{
        label: string;
        action: string;
        data?: any;
    }>;
}