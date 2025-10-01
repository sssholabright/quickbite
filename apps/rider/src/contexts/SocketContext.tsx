import React, { createContext, useContext, ReactNode } from 'react';
import { useSocket } from '../hooks/useSocket';

interface SocketContextType {
    socket: any;
    isConnected: boolean;
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
    joinOrderRoom: (orderId: string) => void;
    leaveOrderRoom: (orderId: string) => void;
    sendLocationUpdate: (data: any) => void;
    markOrderPickedUp: (orderId: string) => void;
    markOrderDelivered: (orderId: string) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const socketData = useSocket();
    
    // 🚀 FIXED: Remove duplicate emission - useSocket already handles this
    
    return (
        <SocketContext.Provider value={socketData}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocketContext = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocketContext must be used within SocketProvider');
    }
    return context;
};