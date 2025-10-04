import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('�� Starting database seeding...')

    // Create categories
    const categories = [
        {
            name: 'Meals',
            description: 'Main course dishes and hearty meals',
            image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500&h=300&fit=crop'
        },
        {
            name: 'Drinks',
            description: 'Beverages, juices, and refreshments',
            image: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=500&h=300&fit=crop'
        },
        {
            name: 'Snacks',
            description: 'Quick bites and light snacks',
            image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500&h=300&fit=crop'
        },
        {
            name: 'Desserts',
            description: 'Sweet treats and desserts',
            image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&h=300&fit=crop'
        },
        {
            name: 'Appetizers',
            description: 'Starter dishes and small plates',
            image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=500&h=300&fit=crop'
        },
        {
            name: 'Salads',
            description: 'Fresh salads and healthy options',
            image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&h=300&fit=crop'
        },
        {
            name: 'Soups',
            description: 'Warm soups and broths',
            image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&h=300&fit=crop'
        },
        {
            name: 'Breakfast',
            description: 'Morning meals and breakfast items',
            image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=500&h=300&fit=crop'
        }
    ]

    console.log('�� Creating categories...')
    
    for (const categoryData of categories) {
        const category = await prisma.category.upsert({
            where: { name: categoryData.name },
            update: categoryData,
            create: categoryData
        })
        console.log(`✅ Created/Updated category: ${category.name}`)
    }

    // Create a sample vendor for testing
    console.log('��‍🍳 Creating sample vendor...')
    
    const sampleVendor = await prisma.vendor.upsert({
        where: { id: 'sample-vendor-1' },
        update: {},
        create: {
            id: 'sample-vendor-1',
            userId: 'sample-user-1',
            businessName: 'QuickBite Test Kitchen',
            businessAddress: '123 Test Street, Lagos, Nigeria',
            latitude: 6.5244,
            longitude: 3.3792,
            description: 'A test vendor for development purposes',
            logo: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&h=200&fit=crop',
            isActive: true,
            isOpen: true,
            rating: 4.5
        }
    })

    // Create a sample user for the vendor
    await prisma.user.upsert({
        where: { id: 'sample-user-1' },
        update: {},
        create: {
            id: 'sample-user-1',
            email: 'vendor@quickbite.com',
            phone: '+2348012345678',
            password: '$2b$10$example.hash', // This should be a real hash in production
            name: 'Test Vendor',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
            isActive: true,
            role: 'VENDOR'
        }
    })

    // Create sample menu items
    console.log('🍽️ Creating sample menu items...')
    
    const mealsCategory = await prisma.category.findUnique({ where: { name: 'Meals' } })
    const drinksCategory = await prisma.category.findUnique({ where: { name: 'Drinks' } })
    const snacksCategory = await prisma.category.findUnique({ where: { name: 'Snacks' } })

    if (mealsCategory && drinksCategory && snacksCategory) {
        const sampleMenuItems = [
            {
                name: 'Jollof Rice with Chicken',
                description: 'Traditional Nigerian jollof rice served with grilled chicken',
                price: 2500,
                image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500&h=300&fit=crop',
                categoryId: mealsCategory.id,
                preparationTime: 25,
                addOns: [
                    {
                        name: 'Extra Chicken',
                        description: 'Additional piece of grilled chicken',
                        price: 800,
                        isRequired: false,
                        maxQuantity: 2,
                        category: 'EXTRA'
                    },
                    {
                        name: 'Extra Rice',
                        description: 'Additional portion of jollof rice',
                        price: 500,
                        isRequired: false,
                        maxQuantity: 1,
                        category: 'SIZE'
                    }
                ]
            },
            {
                name: 'Fried Rice with Beef',
                description: 'Mixed vegetable fried rice with tender beef strips',
                price: 2200,
                image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&h=300&fit=crop',
                categoryId: mealsCategory.id,
                preparationTime: 20,
                addOns: [
                    {
                        name: 'Extra Beef',
                        description: 'Additional beef strips',
                        price: 600,
                        isRequired: false,
                        maxQuantity: 2,
                        category: 'EXTRA'
                    }
                ]
            },
            {
                name: 'Fresh Orange Juice',
                description: 'Freshly squeezed orange juice',
                price: 800,
                image: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=500&h=300&fit=crop',
                categoryId: drinksCategory.id,
                preparationTime: 5,
                addOns: []
            },
            {
                name: 'Chicken Shawarma',
                description: 'Grilled chicken wrapped in soft bread with vegetables',
                price: 1800,
                image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500&h=300&fit=crop',
                categoryId: snacksCategory.id,
                preparationTime: 15,
                addOns: [
                    {
                        name: 'Extra Sauce',
                        description: 'Additional sauce options',
                        price: 100,
                        isRequired: false,
                        maxQuantity: 3,
                        category: 'CUSTOMIZATION'
                    }
                ]
            }
        ]

        for (const itemData of sampleMenuItems) {
            const { addOns, ...itemInfo } = itemData
            
            const menuItem = await prisma.menuItem.create({
                data: {
                    ...itemInfo,
                    vendorId: sampleVendor.id,
                    addOns: {
                        create: addOns.map(addOn => ({
                            name: addOn.name,
                            description: addOn.description,
                            price: addOn.price,
                            isRequired: addOn.isRequired,
                            maxQuantity: addOn.maxQuantity,
                            category: addOn.category as any // Cast to any to bypass type checking
                        }))
                    }
                }
            })
            console.log(`✅ Created menu item: ${menuItem.name}`)
        }
    }

    
    console.log('🎉 Database seeding completed successfully!')
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
