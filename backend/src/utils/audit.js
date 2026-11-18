const { prisma } = require('./prisma');

const audit = async ({ userId, action, entity, entityId, before, after, ipAddress }) => {
  try {
    await prisma.auditLog.create({
      data: { userId, action, entity, entityId, before, after, ipAddress },
    });
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
};

module.exports = { audit };
