const { prisma } = require('../utils/prisma');

exports.getStates = async (req, res) => {
  const states = await prisma.state.findMany({ orderBy: { name: 'asc' } });
  res.json(states);
};

exports.getNodes = async (req, res) => {
  const { stateId, level } = req.query;
  const where = {};
  if (stateId) where.stateId = Number(stateId);
  if (level) where.level = Number(level);
  const nodes = await prisma.locationNode.findMany({ where, orderBy: { name: 'asc' } });
  res.json(nodes);
};

exports.getChildren = async (req, res) => {
  const children = await prisma.locationNode.findMany({
    where: { parentId: Number(req.params.id) },
    orderBy: { name: 'asc' },
  });
  res.json(children);
};

exports.searchLocations = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json([]);

  const nodes = await prisma.locationNode.findMany({
    where: { name: { contains: q, mode: 'insensitive' } },
    include: { state: { select: { name: true } } },
    take: 15,
  });
  res.json(nodes);
};
