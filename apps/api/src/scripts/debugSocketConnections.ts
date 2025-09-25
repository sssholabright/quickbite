import { getSocketManager } from '../config/socket.js';
import { logger } from '../utils/logger.js';

/**
 * 🚀 DEBUG SCRIPT: Check socket connections and rider rooms
 * This will help us understand why riders aren't receiving orders
 */
async function debugSocketConnections() {
    try {
        console.log('🔍 Checking socket connections...');
        
        const socketManager = getSocketManager();
        const io = socketManager.getIO();
        
        // Get all connected sockets
        const allSockets = Array.from(io.sockets.sockets.values());
        console.log(`📡 Total connected sockets: ${allSockets.length}`);
        
        // Check riders room
        const ridersRoom = io.sockets.adapter.rooms.get('riders');
        const ridersInRoom = ridersRoom ? ridersRoom.size : 0;
        console.log(`�� Riders in 'riders' room: ${ridersInRoom}`);
        
        // List all rooms
        const allRooms = Array.from(io.sockets.adapter.rooms.keys());
        console.log(`🏠 All rooms: ${allRooms.join(', ')}`);
        
        // Check each socket
        allSockets.forEach((socket, index) => {
            const rooms = Array.from(socket.rooms);
            console.log(`\n🔌 Socket ${index + 1}:`);
            console.log(`   ID: ${socket.id}`);
            console.log(`   Rooms: ${rooms.join(', ')}`);
            console.log(`   User ID: ${(socket as any).userId || 'N/A'}`);
            console.log(`   User Role: ${(socket as any).userRole || 'N/A'}`);
            console.log(`   Rider ID: ${(socket as any).riderId || 'N/A'}`);
        });
        
        // Check connected riders count
        const connectedRidersCount = socketManager.getConnectedRidersCount();
        console.log(`\n📊 Connected riders count: ${connectedRidersCount}`);
        
        if (ridersInRoom === 0) {
            console.log('\n❌ NO RIDERS IN SOCKET ROOM!');
            console.log('This is why riders aren\'t receiving orders.');
            console.log('\n🔧 To fix this:');
            console.log('1. Make sure the rider app is connected to the socket');
            console.log('2. Check if the rider app is running');
            console.log('3. Check if the socket connection is established');
        } else {
            console.log('\n✅ Found riders in socket room!');
        }
        
    } catch (error) {
        console.error('�� Error checking socket connections:', error);
    }
}

// Run the script
debugSocketConnections();
