const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Better images per property slug
const IMAGE_MAP = {
  'royal-palms-resort-mumbai': [
    { url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=900&auto=format&fit=crop', isCover: true  },
    { url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=900&auto=format&fit=crop', isCover: false },
    { url: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=900&auto=format&fit=crop', isCover: false },
    { url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=900&auto=format&fit=crop', isCover: false },
  ],
  'emerald-gardens-resort': [
    { url: 'https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?w=900&auto=format&fit=crop', isCover: true  },
    { url: 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=900&auto=format&fit=crop', isCover: false },
    { url: 'https://images.unsplash.com/photo-1519225421980-7e0063b1df58?w=900&auto=format&fit=crop', isCover: false },
  ],
  'grand-imperial-banquet': [
    { url: 'https://images.unsplash.com/photo-1519167758481-83f29c8a4aa9?w=900&auto=format&fit=crop', isCover: true  },
    { url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=900&auto=format&fit=crop', isCover: false },
    { url: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?w=900&auto=format&fit=crop', isCover: false },
  ],
  'shubh-vivah-mandap': [
    { url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=900&auto=format&fit=crop', isCover: true  },
    { url: 'https://images.unsplash.com/photo-1619636175080-25e53f7e1613?w=900&auto=format&fit=crop', isCover: false },
    { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=900&auto=format&fit=crop', isCover: false },
  ],
  'anand-marriage-hall': [
    { url: 'https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=900&auto=format&fit=crop', isCover: true  },
    { url: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=900&auto=format&fit=crop', isCover: false },
    { url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=900&auto=format&fit=crop', isCover: false },
  ],
  'kalyan-vivah-sadan': [
    { url: 'https://images.unsplash.com/photo-1578730169862-749c26f4b8c0?w=900&auto=format&fit=crop', isCover: true  },
    { url: 'https://images.unsplash.com/photo-1573408301185-9519eb7024cb?w=900&auto=format&fit=crop', isCover: false },
    { url: 'https://images.unsplash.com/photo-1583951571768-2e6e3b51218e?w=900&auto=format&fit=crop', isCover: false },
  ],
};

async function main() {
  for (const [slug, images] of Object.entries(IMAGE_MAP)) {
    const property = await prisma.property.findUnique({ where: { slug } });
    if (!property) { console.log(`Skip (not found): ${slug}`); continue; }

    // Delete existing media
    await prisma.propertyMedia.deleteMany({ where: { propertyId: property.id } });

    // Insert new media
    await prisma.propertyMedia.createMany({
      data: images.map((img, i) => ({
        propertyId: property.id,
        mediaType: 'IMAGE',
        url: img.url,
        isCover: img.isCover,
        sortOrder: i,
      })),
    });

    console.log(`Updated images for: ${slug} (${images.length} photos)`);
  }
  console.log('\nAll images updated successfully.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
