/**
 * One-time setup for the LOCAL dev MongoDB started by ../start-mongo-dev.ps1:
 * turns the fresh mongod into a single-node replica set "rs0", which Prisma
 * requires for transactions and nested writes. Not needed for MongoDB Atlas.
 *
 * Usage: node prisma/init-replset.js [port]   (default 27018)
 */
const port = process.argv[2] || '27018';
process.env.DATABASE_URL = `mongodb://127.0.0.1:${port}/admin?directConnection=true`;
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma
  .$runCommandRaw({ replSetInitiate: { _id: 'rs0', members: [{ _id: 0, host: `127.0.0.1:${port}` }] } })
  .then(() => console.log(`Replica set rs0 initiated on 127.0.0.1:${port}`))
  .catch((e) => {
    if (/already initialized/i.test(e.message)) console.log('Replica set already initiated.');
    else { console.error(e.message); process.exitCode = 1; }
  })
  .finally(() => prisma.$disconnect());
