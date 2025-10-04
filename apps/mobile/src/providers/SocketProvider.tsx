import React, { createContext, useContext, ReactNode } from 'react';
import { useSocket } from '../hooks/useSocket';

interface SocketContextType {
    socket: any;
    isConnected: boolean;
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
    joinOrderRoom: (orderId: string) => void;
    leaveOrderRoom: (orderId: string) => void;
    requestOrderUpdate: (orderId: string) => void;
    sendCustomerFeedback: (orderId: string, rating: number, comment?: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocketContext = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocketContext must be used within a SocketProvider');
    }
    return context;
};

interface SocketProviderProps {
    children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
    const socketData = useSocket();

    return (
        <SocketContext.Provider value={socketData}>
            {children}
        </SocketContext.Provider>
    );
};
