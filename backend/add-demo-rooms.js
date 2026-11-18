const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DEMO_ROOMS = {
  'royal-palms-resort-mumbai': [
    {
      category: 'STANDARD',
      name: 'Standard Garden Room',
      description: 'Comfortable room with garden view, ideal for couples.',
      pricePerNight: 3500,
      totalRooms: 20,
      maxGuests: 2,
      facilities: ['AC', 'WiFi', 'TV', 'Hot Water', 'Wardrobe', 'Attached Bathroom'],
      media: [
        { url: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&auto=format&fit=crop', isCover: true },
      ],
    },
    {
      category: 'DELUXE',
      name: 'Deluxe Pool View Room',
      description: 'Spacious deluxe room with stunning pool views and premium amenities.',
      pricePerNight: 6500,
      totalRooms: 12,
      maxGuests: 3,
      facilities: ['AC', 'WiFi', 'TV', 'Hot Water', 'Mini Fridge', 'Wardrobe', 'Pool View', 'King Bed', 'Attached Bathroom', 'Balcony'],
      media: [
        { url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop', isCover: true },
      ],
    },
    {
      category: 'LUXURY',
      name: 'Royal Suite',
      description: 'Lavish suite with private plunge pool, butler service, and panoramic views.',
      pricePerNight: 15000,
      totalRooms: 4,
      maxGuests: 4,
      facilities: ['AC', 'WiFi', 'TV', 'Hot Water', 'Mini Fridge', 'Wardrobe', 'Pool View', 'King Bed', 'Attached Bathroom', 'Bathtub', 'Balcony', 'Work Desk'],
      media: [
        { url: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&auto=format&fit=crop', isCover: true },
      ],
    },
  ],
  'emerald-gardens-resort': [
    {
      category: 'STANDARD',
      name: 'Standard Room',
      description: 'Cozy and clean room with garden access.',
      pricePerNight: 2800,
      totalRooms: 15,
      maxGuests: 2,
      facilities: ['AC', 'WiFi', 'TV', 'Hot Water', 'Attached Bathroom'],
      media: [
        { url: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&auto=format&fit=crop', isCover: true },
      ],
    },
    {
      category: 'DELUXE',
      name: 'Deluxe Garden Suite',
      description: 'Premium room with private garden patio and upgraded furnishings.',
      pricePerNight: 5500,
      totalRooms: 8,
      maxGuests: 3,
      facilities: ['AC', 'WiFi', 'TV', 'Hot Water', 'Mini Fridge', 'Balcony', 'King Bed', 'Attached Bathroom', 'Bathtub'],
      media: [
        { url: 'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?w=800&auto=format&fit=crop', isCover: true },
      ],
    },
  ],
};

async function main() {
  for (const [slug, rooms] of Object.entries(DEMO_ROOMS)) {
    const property = await prisma.property.findUnique({ where: { slug } });
    if (!property) { console.log(`Skip (not found): ${slug}`); continue; }

    // Update hasRooms flag
    await prisma.property.update({ where: { id: property.id }, data: { hasRooms: true } });

    // Add rooms (skip if already exist)
    const existing = await prisma.room.count({ where: { propertyId: property.id } });
    if (existing > 0) { console.log(`Rooms already exist for: ${slug}`); continue; }

    for (const room of rooms) {
      const { media, ...roomData } = room;
      const created = await prisma.room.create({
        data: { ...roomData, propertyId: property.id },
      });
      if (media?.length) {
        await prisma.roomMedia.createMany({
          data: media.map((m, i) => ({ roomId: created.id, url: m.url, isCover: m.isCover, sortOrder: i })),
        });
      }
      console.log(`  Added ${room.category} room: ${room.name}`);
    }
    console.log(`Done: ${slug}`);
  }
  console.log('\nDemo rooms added successfully!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
