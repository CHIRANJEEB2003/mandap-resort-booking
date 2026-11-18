const { prisma } = require('../utils/prisma');
const { createError } = require('../middleware/errorHandler');

const getOwnerOrFail = async (userId) => {
  const owner = await prisma.ownerProfile.findUnique({ where: { userId } });
  if (!owner) throw createError('Owner profile not found', 404);
  return owner;
};

exports.getDashboard = async (req, res) => {
  const owner = await getOwnerOrFail(req.user.id);
  const propertyIds = (await prisma.property.findMany({
    where: { ownerId: owner.id },
    select: { id: true },
  })).map(p => p.id);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [totalProperties, totalBookings, pendingRequests, confirmedBookings, todayEvents, monthRevenue] =
    await Promise.all([
      prisma.property.count({ where: { ownerId: owner.id } }),
      prisma.booking.count({ where: { propertyId: { in: propertyIds } } }),
      prisma.booking.count({ where: { propertyId: { in: propertyIds }, status: 'ENQUIRY' } }),
      prisma.booking.count({ where: { propertyId: { in: propertyIds }, status: 'CONFIRMED' } }),
      prisma.booking.count({
        where: { propertyId: { in: propertyIds }, status: 'CONFIRMED', eventDate: { gte: today, lt: tomorrow } },
      }),
      prisma.payment.aggregate({
        where: {
          booking: { propertyId: { in: propertyIds } },
          status: 'CAPTURED',
          paidAt: {
            gte: new Date(today.getFullYear(), today.getMonth(), 1),
            lt: new Date(today.getFullYear(), today.getMonth() + 1, 1),
          },
        },
        _sum: { amount: true },
      }),
    ]);

  res.json({ totalProperties, totalBookings, pendingRequests, confirmedBookings, todayEvents, monthRevenue: monthRevenue._sum.amount });
};

exports.getProfile = async (req, res) => {
  const owner = await prisma.ownerProfile.findUnique({
    where: { userId: req.user.id },
    include: { documents: true },
  });
  res.json(owner);
};

exports.updateProfile = async (req, res) => {
  const owner = await getOwnerOrFail(req.user.id);
  const updated = await prisma.ownerProfile.update({
    where: { id: owner.id },
    data: req.body,
  });
  res.json(updated);
};

exports.uploadDocument = async (req, res) => {
  const owner = await getOwnerOrFail(req.user.id);
  const { docType } = req.body;
  const fileUrl = req.fileUrl;
  if (!fileUrl) throw createError('No file uploaded', 400);

  const doc = await prisma.ownerDocument.create({
    data: { ownerId: owner.id, docType, fileUrl },
  });
  res.status(201).json(doc);
};

exports.getDocuments = async (req, res) => {
  const owner = await getOwnerOrFail(req.user.id);
  const docs = await prisma.ownerDocument.findMany({ where: { ownerId: owner.id } });
  res.json(docs);
};

exports.getProperties = async (req, res) => {
  const owner = await getOwnerOrFail(req.user.id);
  const properties = await prisma.property.findMany({
    where: { ownerId: owner.id },
    include: { halls: true, media: { where: { isCover: true }, take: 1 } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(properties);
};

exports.getBookings = async (req, res) => {
  const owner = await getOwnerOrFail(req.user.id);
  const { status, page = 1, limit = 20 } = req.query;
  const propertyIds = (await prisma.property.findMany({
    where: { ownerId: owner.id }, select: { id: true },
  })).map(p => p.id);

  const where = { propertyId: { in: propertyIds } };
  if (status) where.status = status;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        customer: { select: { fullName: true, user: { select: { phone: true } } } },
        property: { select: { name: true } },
        payments: { where: { status: 'CAPTURED' } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.booking.count({ where }),
  ]);

  res.json({ bookings, total });
};

exports.getRevenue = async (req, res) => {
  const owner = await getOwnerOrFail(req.user.id);
  const propertyIds = (await prisma.property.findMany({
    where: { ownerId: owner.id }, select: { id: true },
  })).map(p => p.id);

  const { year = new Date().getFullYear() } = req.query;

  // Monthly revenue breakdown
  const payments = await prisma.payment.findMany({
    where: {
      booking: { propertyId: { in: propertyIds } },
      status: 'CAPTURED',
      paidAt: {
        gte: new Date(Number(year), 0, 1),
        lt: new Date(Number(year) + 1, 0, 1),
      },
    },
    select: { amount: true, paidAt: true },
  });

  const monthly = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    revenue: payments
      .filter(p => p.paidAt?.getMonth() === i)
      .reduce((sum, p) => sum + Number(p.amount), 0),
  }));

  res.json({ year: Number(year), monthly });
};

exports.getCalendar = async (req, res) => {
  const owner = await getOwnerOrFail(req.user.id);
  const { month, year } = req.query;
  const propertyIds = (await prisma.property.findMany({
    where: { ownerId: owner.id }, select: { id: true },
  })).map(p => p.id);

  const start = new Date(Number(year), Number(month) - 1, 1);
  const end = new Date(Number(year), Number(month), 0);

  const bookings = await prisma.booking.findMany({
    where: {
      propertyId: { in: propertyIds },
      eventDate: { gte: start, lte: end },
      status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] },
    },
    include: {
      customer: { select: { fullName: true } },
      property: { select: { name: true } },
    },
  });

  res.json(bookings);
};

exports.getStaff = async (req, res) => {
  const owner = await getOwnerOrFail(req.user.id);
  const staff = await prisma.staffMember.findMany({ where: { ownerId: owner.id } });
  res.json(staff);
};

exports.addStaff = async (req, res) => {
  const owner = await getOwnerOrFail(req.user.id);
  const member = await prisma.staffMember.create({ data: { ownerId: owner.id, ...req.body } });
  res.status(201).json(member);
};

exports.updateStaff = async (req, res) => {
  const member = await prisma.staffMember.update({ where: { id: req.params.id }, data: req.body });
  res.json(member);
};

exports.deleteStaff = async (req, res) => {
  await prisma.staffMember.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ message: 'Staff member deactivated' });
};
