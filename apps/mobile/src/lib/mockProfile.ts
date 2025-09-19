import { User, Address, PaymentMethod, Settings } from '../types/profile';

export const mockUser: User = {
    id: '1',
    name: 'Bright O.',
    email: 'bright@example.com',
    phone: '+234 801 234 5678',
    avatar: 'https://via.placeholder.com/100'
};

export const mockAddresses: Address[] = [
    {
        id: '1',
        label: 'Home',
        address: 'Hostel A, Room 12',
        isDefault: true,
        landmark: 'Near the main gate'
    },
    {
        id: '2',
        label: 'Faculty',
        address: 'Faculty of Engineering, Block B',
        isDefault: false,
        landmark: 'Computer Science Department'
    },
    {
        id: '3',
        label: 'Library',
        address: 'Central Library, 2nd Floor',
        isDefault: false,
        landmark: 'Study Area 3'
    }
];

export const mockPaymentMethods: PaymentMethod[] = [
    {
        id: '1',
        type: 'card',
        name: 'Visa Card',
        lastFour: '1234',
        isDefault: true
    },
    {
        id: '2',
        type: 'wallet',
        name: 'Paystack Wallet',
        balance: 5000,
        isDefault: false
    }
];

export const mockSettings: Settings = {
    notifications: {
        push: true,
        email: true,
        sms: false
    },
    preferences: {
        language: 'English',
        defaultAddress: '1'
    }
};
