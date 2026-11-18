/**
 * Creates MongoDB indexes that Prisma's schema cannot express.
 * Run after `prisma db push`:  node prisma/ensure-indexes.js
 *
 * User.email is optional (phone-OTP customers have none). A plain unique index
 * would treat every missing email as the same value and allow only one such user,
 * so uniqueness is enforced only for documents where email is a string.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$runCommandRaw({
    createIndexes: 'User',
    indexes: [{
      key: { email: 1 },
      name: 'User_email_unique_when_set',
      unique: true,
      partialFilterExpression: { email: { $type: 'string' } },
    }],
  });
  console.log('Indexes ensured: User.email (unique when set)');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
