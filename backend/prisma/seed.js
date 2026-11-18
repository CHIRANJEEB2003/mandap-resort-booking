const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database…');

  // Platform config
  await prisma.platformConfig.upsert({
    where: { key: 'commission_percent' },
    update: {},
    create: { key: 'commission_percent', value: { value: 10 } },
  });

  // Seed default resource types
  const resourceTypes = [
    { name: 'Mandap', category: 'MANDAP_HALL', isSystem: true },
    { name: 'Hall', category: 'MANDAP_HALL', isSystem: true },
    { name: 'Decoration Team', category: 'DECORATION_TEAM', isSystem: true },
    { name: 'Flower Decoration Team', category: 'FLOWER_DECORATION_TEAM', isSystem: true },
    { name: 'Cleaning Team', category: 'CLEANING_TEAM', isSystem: true },
    { name: 'Catering Team', category: 'CATERING_TEAM', isSystem: true },
    { name: 'Management Team', category: 'MANAGEMENT_TEAM', isSystem: true },
    { name: 'Security Team', category: 'SECURITY_TEAM', isSystem: true },
  ];

  // Fixed ids ("1".."7") keep this idempotent now that ids are strings (MongoDB)
  for (const [i, rt] of resourceTypes.entries()) {
    const id = String(i + 1);
    await prisma.resourceType.upsert({
      where: { id },
      update: {},
      create: { id, ...rt },
    });
  }

  // Seed admin user
  const adminEmail = 'admin@mandapbooking.in';
  const adminExists = await prisma.user.findFirst({ where: { email: adminEmail } });
  if (!adminExists) {
    const passwordHash = await bcrypt.hash('Admin@12345', 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        phone: 'admin_seed',
        passwordHash,
        role: 'ADMIN',
        adminProfile: { create: { fullName: 'Platform Admin' } },
      },
    });
    console.log('Admin user created: admin@mandapbooking.in / Admin@12345');
  }

  // Seed sample states
  const states = [
    { name: 'Gujarat', code: 'GJ' },
    { name: 'Maharashtra', code: 'MH' },
    { name: 'Rajasthan', code: 'RJ' },
    { name: 'Delhi', code: 'DL' },
    { name: 'Karnataka', code: 'KA' },
    { name: 'Tamil Nadu', code: 'TN' },
    { name: 'Uttar Pradesh', code: 'UP' },
  ];

  for (const state of states) {
    const s = await prisma.state.upsert({
      where: { code: state.code },
      update: {},
      create: state,
    });

    // Add a sample district node
    const districtName = `${state.name} Central`;
    const existing = await prisma.locationNode.findFirst({ where: { stateId: s.id, level: 1 } });
    if (!existing) {
      await prisma.locationNode.create({
        data: {
          stateId: s.id,
          name: districtName,
          slug: districtName.toLowerCase().replace(/\s+/g, '-'),
          level: 1,
        },
      });
    }
  }

  console.log('Seed complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
