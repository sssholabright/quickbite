import { prisma } from '../config/db.js';
import { logger } from '../utils/logger.js';

/**
 * 🚀 DEBUG SCRIPT: Check rider status and availability
 * This will help us understand why the rider isn't receiving orders
 */
async function checkRiderStatus() {
    try {
        console.log('🔍 Checking rider status...');
        
        // Get all riders
        const riders = await prisma.rider.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        role: true,
                        isActive: true
                    }
                }
            }
        });

        console.log(`📊 Found ${riders.length} riders:`);
        
        riders.forEach((rider, index) => {
            console.log(`\n🚴 Rider ${index + 1}:`);
            console.log(`   ID: ${rider.id}`);
            console.log(`   Name: ${rider.user.name}`);
            console.log(`   Email: ${rider.user.email}`);
            console.log(`   Phone: ${rider.user.phone}`);
            console.log(`   Is Online: ${rider.isOnline}`);
            console.log(`   Current Lat: ${rider.currentLat}`);
            console.log(`   Current Lng: ${rider.currentLng}`);
            console.log(`   Vehicle Type: ${rider.vehicleType}`);
            console.log(`   User Active: ${rider.user.isActive}`);
        });

        // Check for online riders
        const onlineRiders = riders.filter(r => r.isOnline);
        console.log(`\n🟢 Online riders: ${onlineRiders.length}`);

        // Check for available riders
        const availableRiders = riders.filter(r => r.isOnline);
        console.log(`🟡 Available riders: ${availableRiders.length}`);

        // Check for riders with location
        const ridersWithLocation = riders.filter(r => r.currentLat && r.currentLng);
        console.log(`📍 Riders with location: ${ridersWithLocation.length}`);

        // Check for riders that meet all criteria
        const eligibleRiders = riders.filter(r => 
            r.isOnline && 
            r.currentLat && 
            r.currentLng
        );
        console.log(`✅ Eligible riders (online + available + location): ${eligibleRiders.length}`);

        if (eligibleRiders.length === 0) {
            console.log('\n❌ NO ELIGIBLE RIDERS FOUND!');
            console.log('This is why you\'re not receiving orders.');
            console.log('\n🔧 To fix this:');
            console.log('1. Make sure your rider is marked as online');
            console.log('2. Make sure your rider has location data');
        } else {
            console.log('\n✅ Found eligible riders!');
            eligibleRiders.forEach(rider => {
                console.log(`   - ${rider.user.name} (${rider.id})`);
            });
        }

    } catch (error) {
        console.error('💥 Error checking rider status:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
checkRiderStatus();
