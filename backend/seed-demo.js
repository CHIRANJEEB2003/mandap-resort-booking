const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data...');

  // â”€â”€ Location â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let state = await prisma.state.findUnique({ where: { code: 'MH' } });
  if (!state) {
    state = await prisma.state.create({ data: { name: 'Maharashtra', code: 'MH' } });
  }

  let cityNode = await prisma.locationNode.findFirst({ where: { slug: 'mumbai' } });
  if (!cityNode) {
    cityNode = await prisma.locationNode.create({
      data: { stateId: state.id, name: 'Mumbai', slug: 'mumbai', level: 1 },
    });
  }

  // â”€â”€ Resort Owner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let resortOwnerUser = await prisma.user.findUnique({ where: { phone: '9900001111' } });
  if (!resortOwnerUser) {
    resortOwnerUser = await prisma.user.create({
      data: {
        phone: '9900001111',
        email: 'resort.owner@demo.com',
        role: 'OWNER',
        passwordHash: '',
        ownerProfile: {
          create: {
            fullName: 'Ramesh Sharma',
            businessName: 'Sharma Hospitality Group',
            address: 'Juhu, Mumbai',
            ownerType: 'RESORT',
            verificationStatus: 'APPROVED',
          },
        },
      },
      include: { ownerProfile: true },
    });
  }
  const resortOwner = resortOwnerUser.ownerProfile
    || await prisma.ownerProfile.findUnique({ where: { userId: resortOwnerUser.id } });

  // â”€â”€ Mandap Owner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  let mandapOwnerUser = await prisma.user.findUnique({ where: { phone: '9900002222' } });
  if (!mandapOwnerUser) {
    mandapOwnerUser = await prisma.user.create({
      data: {
        phone: '9900002222',
        email: 'mandap.owner@demo.com',
        role: 'OWNER',
        passwordHash: '',
        ownerProfile: {
          create: {
            fullName: 'Priya Patel',
            businessName: 'Patel Wedding Halls',
            address: 'Andheri, Mumbai',
            ownerType: 'MANDAP',
            verificationStatus: 'APPROVED',
          },
        },
      },
      include: { ownerProfile: true },
    });
  }
  const mandapOwner = mandapOwnerUser.ownerProfile
    || await prisma.ownerProfile.findUnique({ where: { userId: mandapOwnerUser.id } });

  // â”€â”€ Resort 1 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const r1Exists = await prisma.property.findUnique({ where: { slug: 'royal-palms-resort-mumbai' } });
  if (!r1Exists) {
    await prisma.property.create({
      data: {
        ownerId: resortOwner.id,
        locationNodeId: cityNode.id,
        name: 'Royal Palms Resort',
        slug: 'royal-palms-resort-mumbai',
        description: 'A luxurious beachside resort nestled in the heart of Mumbai. Perfect for grand weddings, corporate retreats and family celebrations. Features lush gardens, an Olympic-size pool and world-class catering.',
        propertyType: 'RESORT',
        addressLine: 'Plot 14, Juhu Beach Road, Mumbai, Maharashtra 400049',
        totalCapacity: 800,
        parkingCapacity: 200,
        hasAC: true,
        hasPool: true,
        hasRooms: true,
        outdoorArea: true,
        status: 'APPROVED',
        approvedAt: new Date(),
        rating: 4.7,
        reviewCount: 38,
        halls: {
          create: [
            { name: 'Grand Ballroom', capacity: 500, area: 1200.0, hasAC: true },
            { name: 'Garden Pavilion', capacity: 300, area: 800.0, hasAC: false },
          ],
        },
        pricingRules: {
          create: [
            { pricingType: 'FULL_DAY', basePrice: 350000, weekendPrice: 50000 },
          ],
        },
        media: {
          create: [
            { mediaType: 'IMAGE', url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800', isCover: true, sortOrder: 1 },
            { mediaType: 'IMAGE', url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800', isCover: false, sortOrder: 2 },
            { mediaType: 'IMAGE', url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800', isCover: false, sortOrder: 3 },
          ],
        },
      },
    });
    console.log('Created: Royal Palms Resort');
  }

  // â”€â”€ Resort 2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const r2Exists = await prisma.property.findUnique({ where: { slug: 'emerald-gardens-resort' } });
  if (!r2Exists) {
    await prisma.property.create({
      data: {
        ownerId: resortOwner.id,
        locationNodeId: cityNode.id,
        name: 'Emerald Gardens Resort',
        slug: 'emerald-gardens-resort',
        description: 'Sprawling 5-acre landscaped resort offering a serene escape from the city. Ideal for destination weddings, sangeet ceremonies and large receptions with breathtaking sunset views.',
        propertyType: 'RESORT',
        addressLine: '7 Versova Road, Andheri West, Mumbai, Maharashtra 400061',
        totalCapacity: 600,
        parkingCapacity: 150,
        hasAC: true,
        hasPool: true,
        hasRooms: true,
        outdoorArea: true,
        status: 'APPROVED',
        approvedAt: new Date(),
        rating: 4.5,
        reviewCount: 24,
        halls: {
          create: [
            { name: 'Crystal Hall', capacity: 400, area: 900.0, hasAC: true },
            { name: 'Poolside Deck', capacity: 200, area: 500.0, hasAC: false },
          ],
        },
        pricingRules: {
          create: [
            { pricingType: 'FULL_DAY', basePrice: 275000, weekendPrice: 40000 },
          ],
        },
        media: {
          create: [
            { mediaType: 'IMAGE', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', isCover: true, sortOrder: 1 },
            { mediaType: 'IMAGE', url: 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=800', isCover: false, sortOrder: 2 },
          ],
        },
      },
    });
    console.log('Created: Emerald Gardens Resort');
  }

  // â”€â”€ Banquet Hall â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const r3Exists = await prisma.property.findUnique({ where: { slug: 'grand-imperial-banquet' } });
  if (!r3Exists) {
    await prisma.property.create({
      data: {
        ownerId: resortOwner.id,
        locationNodeId: cityNode.id,
        name: 'Grand Imperial Banquet Hall',
        slug: 'grand-imperial-banquet',
        description: 'A premium air-conditioned banquet hall in the heart of Mumbai, accommodating up to 1000 guests. Features state-of-the-art sound and lighting, in-house catering and valet parking.',
        propertyType: 'BANQUET_HALL',
        addressLine: 'Linking Road, Bandra West, Mumbai, Maharashtra 400050',
        totalCapacity: 1000,
        parkingCapacity: 300,
        hasAC: true,
        hasPool: false,
        hasRooms: false,
        outdoorArea: false,
        status: 'APPROVED',
        approvedAt: new Date(),
        rating: 4.3,
        reviewCount: 61,
        halls: {
          create: [
            { name: 'Main Banquet', capacity: 700, area: 1800.0, hasAC: true },
            { name: 'Conference Room', capacity: 100, area: 200.0, hasAC: true },
          ],
        },
        pricingRules: {
          create: [
            { pricingType: 'FULL_DAY', basePrice: 200000, weekendPrice: 30000 },
          ],
        },
        media: {
          create: [
            { mediaType: 'IMAGE', url: 'https://images.unsplash.com/photo-1519167758481-83f29c8a4aa9?w=800', isCover: true, sortOrder: 1 },
          ],
        },
      },
    });
    console.log('Created: Grand Imperial Banquet Hall');
  }

  // â”€â”€ Mandap 1 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const m1Exists = await prisma.property.findUnique({ where: { slug: 'shubh-vivah-mandap' } });
  if (!m1Exists) {
    await prisma.property.create({
      data: {
        ownerId: mandapOwner.id,
        locationNodeId: cityNode.id,
        name: 'Shubh Vivah Mandap',
        slug: 'shubh-vivah-mandap',
        description: 'A beautifully decorated traditional mandap with modern amenities. Perfect for Hindu weddings, engagement ceremonies and naming rituals. Experienced priest and decoration team available.',
        propertyType: 'MANDAP',
        addressLine: '22 Tilak Road, Dadar, Mumbai, Maharashtra 400014',
        totalCapacity: 400,
        parkingCapacity: 80,
        hasAC: true,
        hasPool: false,
        hasRooms: false,
        outdoorArea: false,
        status: 'APPROVED',
        approvedAt: new Date(),
        rating: 4.8,
        reviewCount: 92,
        halls: {
          create: [
            { name: 'Mandap Hall', capacity: 400, area: 600.0, hasAC: true },
          ],
        },
        pricingRules: {
          create: [
            { pricingType: 'FULL_DAY', basePrice: 85000, weekendPrice: 15000 },
          ],
        },
        media: {
          create: [
            { mediaType: 'IMAGE', url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=800', isCover: true, sortOrder: 1 },
            { mediaType: 'IMAGE', url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800', isCover: false, sortOrder: 2 },
          ],
        },
      },
    });
    console.log('Created: Shubh Vivah Mandap');
  }

  // â”€â”€ Mandap 2 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const m2Exists = await prisma.property.findUnique({ where: { slug: 'anand-marriage-hall' } });
  if (!m2Exists) {
    await prisma.property.create({
      data: {
        ownerId: mandapOwner.id,
        locationNodeId: cityNode.id,
        name: 'Anand Marriage Hall',
        slug: 'anand-marriage-hall',
        description: 'A spacious and affordable marriage hall suitable for all types of ceremonies. Flexible seating arrangements, in-house catering options and 24/7 generator backup.',
        propertyType: 'MARRIAGE_HALL',
        addressLine: '55 S.V. Road, Borivali West, Mumbai, Maharashtra 400092',
        totalCapacity: 500,
        parkingCapacity: 100,
        hasAC: true,
        hasPool: false,
        hasRooms: false,
        outdoorArea: true,
        status: 'APPROVED',
        approvedAt: new Date(),
        rating: 4.2,
        reviewCount: 47,
        halls: {
          create: [
            { name: 'Main Hall', capacity: 350, area: 700.0, hasAC: true },
            { name: 'Open Lawn', capacity: 150, area: 400.0, hasAC: false },
          ],
        },
        pricingRules: {
          create: [
            { pricingType: 'FULL_DAY', basePrice: 95000, weekendPrice: 12000 },
          ],
        },
        media: {
          create: [
            { mediaType: 'IMAGE', url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800', isCover: true, sortOrder: 1 },
          ],
        },
      },
    });
    console.log('Created: Anand Marriage Hall');
  }

  // â”€â”€ Mandap 3 â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const m3Exists = await prisma.property.findUnique({ where: { slug: 'kalyan-vivah-sadan' } });
  if (!m3Exists) {
    await prisma.property.create({
      data: {
        ownerId: mandapOwner.id,
        locationNodeId: cityNode.id,
        name: 'Kalyan Vivah Sadan',
        slug: 'kalyan-vivah-sadan',
        description: 'A grand traditional mandap with intricate decor, situated near Chhatrapati Shivaji Maharaj Terminus. Known for exceptional service and authentic vegetarian cuisine.',
        propertyType: 'MANDAP',
        addressLine: 'Near CST Station, Fort, Mumbai, Maharashtra 400001',
        totalCapacity: 300,
        parkingCapacity: 60,
        hasAC: true,
        hasPool: false,
        hasRooms: false,
        outdoorArea: false,
        status: 'APPROVED',
        approvedAt: new Date(),
        rating: 4.6,
        reviewCount: 55,
        halls: {
          create: [
            { name: 'Vivah Hall', capacity: 300, area: 500.0, hasAC: true },
          ],
        },
        pricingRules: {
          create: [
            { pricingType: 'FULL_DAY', basePrice: 70000, weekendPrice: 10000 },
          ],
        },
        media: {
          create: [
            { mediaType: 'IMAGE', url: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800', isCover: true, sortOrder: 1 },
          ],
        },
      },
    });
    console.log('Created: Kalyan Vivah Sadan');
  }

  console.log('\nDemo data seeded successfully!');
  console.log('  Resorts: 2 (+ 1 banquet hall)');
  console.log('  Mandaps: 3 (2 mandap + 1 marriage hall)');
  console.log('  Resort owner phone: 9900001111');
  console.log('  Mandap owner phone: 9900002222');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
