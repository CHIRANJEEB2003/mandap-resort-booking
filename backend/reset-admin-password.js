/**
 * Run once to reset admin password: node reset-admin-password.js
 * Delete this file after running.
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const newPassword = 'Admin@12345';
  const passwordHash = await bcrypt.hash(newPassword, 12);

  const result = await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: { passwordHash, status: 'ACTIVE' },
  });

  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { email: true, status: true },
  });

  console.log(`\nUpdated ${result.count} admin user(s).`);
  console.log('\nAdmin login credentials:');
  admins.forEach(a => console.log(`  Email: ${a.email}  |  Password: Admin@12345  |  Status: ${a.status}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
