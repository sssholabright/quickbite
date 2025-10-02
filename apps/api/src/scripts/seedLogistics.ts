import { VehicleType } from '@prisma/client';
import { PasswordService } from '../utils/password.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚚 Starting logistics companies seeding...');

    // Create logistics companies
    const companies = [
        {
            name: 'Swift Delivery Logistics',
            contactPerson: 'John Adebayo',
            phone: '+2348012345678',
            email: 'contact@swiftdelivery.com',
            address: '123 Lagos Road, Victoria Island, Lagos',
            status: 'ACTIVE' as const
        },
        {
            name: 'Fast Track Couriers',
            contactPerson: 'Mary Johnson',
            phone: '+2348023456789',
            email: 'info@fasttrack.com',
            address: '456 Abuja Avenue, Garki, Abuja',
            status: 'ACTIVE' as const
        },
        {
            name: 'Express Logistics Ltd',
            contactPerson: 'Ahmed Hassan',
            phone: '+2348034567890',
            email: 'admin@expresslogistics.com',
            address: '789 Kano Street, Kano State',
            status: 'ACTIVE' as const
        }
    ];

    console.log('🏢 Creating logistics companies...');
    
    for (const companyData of companies) {
        const company = await prisma.logisticsCompany.upsert({
            where: { name: companyData.name },
            update: companyData,
            create: companyData
        });
        console.log(`✅ Created/Updated company: ${company.name}`);
    }

    // Create sample riders under companies
    const companiesList = await prisma.logisticsCompany.findMany();
    
    console.log('🏍️ Creating sample riders...');
    
    for (let i = 0; i < companiesList.length; i++) {
        const company = companiesList[i];
        
        // Create 2-3 riders per company
        const ridersCount = Math.floor(Math.random() * 2) + 2;
        
        for (let j = 0; j < ridersCount; j++) {
            const riderNumber = j + 1;
            const riderName = `Rider ${riderNumber}`;
            const riderEmail = `rider${riderNumber}@${company?.name.toLowerCase().replace(/\s+/g, '')}.com`;
            
            // Create user for rider
            const hashedPassword = await PasswordService.hashPassword('password123');
            
            const user = await prisma.user.upsert({
                where: { email: riderEmail },
                update: {},
                create: {
                    email: riderEmail,
                    phone: `+234${8000000000 + (i * 10) + j}`,
                    password: hashedPassword,
                    name: riderName,
                    role: 'RIDER',
                    isActive: true
                }
            });

            // Create rider profile
            const vehicleTypes = ['BIKE', 'MOTORCYCLE', 'CAR'] as const;
            const randomVehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
            
            const rider = await prisma.rider.upsert({
                where: { userId: user.id },
                update: {},
                create: {
                    userId: user.id,
                    companyId: company?.id || null,
                    vehicleType: randomVehicleType as VehicleType,
                    isOnline: Math.random() > 0.5, // Random online status
                    isAvailable: Math.random() > 0.3,
                    earnings: Math.floor(Math.random() * 50000) + 10000,
                    completedOrders: Math.floor(Math.random() * 100) + 10,
                    rating: 4.0 + Math.random() * 1.0
                }
            });
            
            console.log(`✅ Created rider: ${riderName} under ${company?.name}`);
        }
    }

    console.log('🎉 Logistics seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error during logistics seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
