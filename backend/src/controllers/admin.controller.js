const { prisma } = require('../utils/prisma');
const { createError } = require('../middleware/errorHandler');
const bcrypt = require('bcryptjs');
const { audit } = require('../utils/audit');

exports.getDashboard = async (req, res) => {
  const RESORT_TYPES = ['RESORT', 'BANQUET_HALL', 'WEDDING_VENUE'];
  const MANDAP_TYPES = ['MANDAP', 'MARRIAGE_HALL'];

  const [
    totalCustomers, totalOwners, totalProperties, approvedProperties,
    pendingProperties, totalBookings, confirmedBookings, cancelledBookings,
    totalRevenue, totalResortOwners, totalMandapOwners,
    totalResorts, totalMandaps, totalRooms, pendingBookings, totalRoomBookings, pendingRoomBookings,
    totalReviews,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.count({ where: { role: 'OWNER' } }),
    prisma.property.count(),
    prisma.property.count({ where: { status: 'APPROVED' } }),
    prisma.property.count({ where: { status: 'PENDING_REVIEW' } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'CONFIRMED' } }),
    prisma.booking.count({ where: { status: 'CANCELLED' } }),
    prisma.payment.aggregate({ where: { status: 'CAPTURED' }, _sum: { amount: true } }),
    prisma.ownerProfile.count({ where: { ownerType: 'RESORT' } }),
    prisma.ownerProfile.count({ where: { ownerType: 'MANDAP' } }),
    prisma.property.count({ where: { propertyType: { in: RESORT_TYPES } } }),
    prisma.property.count({ where: { propertyType: { in: MANDAP_TYPES } } }),
    prisma.room.count({ where: { isActive: true } }),
    prisma.booking.count({ where: { status: { in: ['ENQUIRY', 'PENDING_PAYMENT'] } } }),
    prisma.roomBooking.count(),
    prisma.roomBooking.count({ where: { status: 'PENDING' } }),
    prisma.review.count(),
  ]);

  const platformRevenue = await prisma.commission.aggregate({
    where: { settledAt: null },
    _sum: { amount: true },
  });

  res.json({
    totalCustomers, totalOwners, totalProperties, approvedProperties,
    pendingProperties, totalBookings, confirmedBookings, cancelledBookings,
    totalBookingValue: totalRevenue._sum.amount,
    platformRevenue: platformRevenue._sum.amount,
    totalResortOwners, totalMandapOwners, totalResorts, totalMandaps,
    totalRooms, pendingBookings, totalRoomBookings, pendingRoomBookings,
    totalReviews,
  });
};

exports.getUsers = async (req, res) => {
  const { role, status, search, page = 1, limit = 20 } = req.query;
  const where = {};
  if (role) where.role = role;
  if (status) where.status = status;
  if (search) where.OR = [
    { phone: { contains: search } },
    { email: { contains: search, mode: 'insensitive' } },
  ];

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true, phone: true, email: true, role: true, status: true, createdAt: true,
        customerProfile: { select: { fullName: true } },
        ownerProfile: { select: { fullName: true, verificationStatus: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ users, total });
};

exports.updateUserStatus = async (req, res) => {
  const { status } = req.body;
  if (!['ACTIVE', 'SUSPENDED', 'BLOCKED'].includes(status)) {
    throw createError('Invalid status', 400);
  }
  const user = await prisma.user.update({ where: { id: req.params.id }, data: { status } });
  await audit({ userId: req.user.id, action: `USER_${status}`, entity: 'user', entityId: req.params.id });
  res.json({ message: 'User status updated', user });
};

exports.createAdminUser = async (req, res) => {
  const { email, password, fullName, permissions } = req.body;
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      phone: `admin_${Date.now()}`,
      passwordHash,
      role: 'ADMIN',
      adminProfile: { create: { fullName, permissions } },
    },
  });
  res.status(201).json({ id: user.id, email: user.email, role: user.role });
};

exports.getPendingOwners = async (req, res) => {
  const owners = await prisma.ownerProfile.findMany({
    where: { verificationStatus: 'PENDING' },
    include: { user: { select: { phone: true, email: true } }, documents: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(owners);
};

exports.getOwnerDetail = async (req, res) => {
  const owner = await prisma.ownerProfile.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { phone: true, email: true, status: true } },
      documents: true,
      properties: { select: { id: true, name: true, status: true } },
    },
  });
  if (!owner) throw createError('Owner not found', 404);
  res.json(owner);
};

const updateOwnerStatus = (status) => async (req, res) => {
  const owner = await prisma.ownerProfile.update({
    where: { id: req.params.id },
    data: { verificationStatus: status, verifiedAt: new Date(), verifiedById: req.user.id },
  });
  await audit({ userId: req.user.id, action: `OWNER_${status}`, entity: 'owner', entityId: req.params.id });
  res.json({ message: `Owner ${status.toLowerCase()}`, owner });
};

exports.approveOwner = updateOwnerStatus('APPROVED');
exports.rejectOwner = updateOwnerStatus('REJECTED');
exports.suspendOwner = updateOwnerStatus('SUSPENDED');

exports.getPendingProperties = async (req, res) => {
  const properties = await prisma.property.findMany({
    where: { status: 'PENDING_REVIEW' },
    include: {
      owner: { select: { businessName: true, fullName: true } },
      media: { where: { isCover: true }, take: 1 },
      locality: true,
    },
    orderBy: { createdAt: 'asc' },
  });
  res.json(properties);
};

exports.getPropertyDetail = async (req, res) => {
  const property = await prisma.property.findUnique({
    where: { id: req.params.id },
    include: {
      halls: true,
      media: true,
      pricingRules: true,
      amenities: true,
      eventTypes: true,
      owner: { select: { businessName: true, fullName: true, verificationStatus: true } },
      locality: true,
      locationNode: true,
    },
  });
  if (!property) throw createError('Property not found', 404);
  res.json(property);
};

exports.approveProperty = async (req, res) => {
  const property = await prisma.property.update({
    where: { id: req.params.id },
    data: { status: 'APPROVED', approvedAt: new Date(), approvedById: req.user.id },
  });
  await audit({ userId: req.user.id, action: 'PROPERTY_APPROVED', entity: 'property', entityId: req.params.id });
  res.json({ message: 'Property approved', property });
};

exports.rejectProperty = async (req, res) => {
  const property = await prisma.property.update({
    where: { id: req.params.id },
    data: { status: 'REJECTED', rejectionReason: req.body.reason },
  });
  await audit({ userId: req.user.id, action: 'PROPERTY_REJECTED', entity: 'property', entityId: req.params.id });
  res.json({ message: 'Property rejected', property });
};

exports.getAllBookings = async (req, res) => {
  const { status, page = 1, limit = 20, propertyId } = req.query;
  const where = {};
  if (status) where.status = status;
  if (propertyId) where.propertyId = propertyId;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        property: { select: { name: true } },
        customer: { select: { fullName: true } },
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

exports.getBookingDetail = async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      property: true,
      customer: { include: { user: { select: { phone: true, email: true } } } },
      hall: true,
      services: true,
      payments: true,
      allocations: { include: { propertyResource: { include: { resourceType: true } } } },
    },
  });
  if (!booking) throw createError('Booking not found', 404);
  res.json(booking);
};

exports.getFinanceDashboard = async (req, res) => {
  const [totalRevenue, pendingCommissions, paidCommissions] = await Promise.all([
    prisma.payment.aggregate({ where: { status: 'CAPTURED' }, _sum: { amount: true } }),
    prisma.commission.aggregate({ where: { settledAt: null }, _sum: { amount: true } }),
    prisma.commission.aggregate({ where: { settledAt: { not: null } }, _sum: { amount: true } }),
  ]);
  res.json({
    totalRevenue: totalRevenue._sum.amount,
    pendingCommissions: pendingCommissions._sum.amount,
    paidCommissions: paidCommissions._sum.amount,
  });
};

exports.getCommissions = async (req, res) => {
  const { settled, page = 1, limit = 20 } = req.query;
  const where = settled === 'true' ? { settledAt: { not: null } } : settled === 'false' ? { settledAt: null } : {};
  const commissions = await prisma.commission.findMany({
    where,
    include: { payment: { include: { booking: { select: { id: true, eventDate: true, property: { select: { name: true } } } } } } },
    orderBy: { createdAt: 'desc' },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
  });
  res.json(commissions);
};

exports.updateCommissionRate = async (req, res) => {
  const { rate } = req.body;
  await prisma.platformConfig.upsert({
    where: { key: 'commission_percent' },
    update: { value: { value: rate } },
    create: { key: 'commission_percent', value: { value: rate } },
  });
  res.json({ message: 'Commission rate updated', rate });
};

exports.revenueReport = async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;
  const payments = await prisma.payment.findMany({
    where: {
      status: 'CAPTURED',
      paidAt: { gte: new Date(Number(year), 0, 1), lt: new Date(Number(year) + 1, 0, 1) },
    },
    select: { amount: true, paidAt: true },
  });
  const monthly = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    revenue: payments.filter(p => p.paidAt?.getMonth() === i).reduce((s, p) => s + Number(p.amount), 0),
  }));
  res.json({ year: Number(year), monthly });
};

exports.bookingsReport = async (req, res) => {
  const { year = new Date().getFullYear() } = req.query;
  const bookings = await prisma.booking.groupBy({
    by: ['status'],
    where: {
      createdAt: { gte: new Date(Number(year), 0, 1), lt: new Date(Number(year) + 1, 0, 1) },
    },
    _count: true,
  });
  res.json(bookings);
};

exports.getAuditLogs = async (req, res) => {
  const { entity, page = 1, limit = 50 } = req.query;
  const where = entity ? { entity } : {};
  const logs = await prisma.auditLog.findMany({
    where,
    include: { user: { select: { phone: true, email: true, role: true } } },
    orderBy: { createdAt: 'desc' },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
  });
  res.json(logs);
};

// ─── Reviews & Feedback ───────────────────────────────────────────────────────

exports.getAllReviews = async (req, res) => {
  const { rating, propertyId, search, published, page = 1, limit = 20 } = req.query;
  const where = {};
  if (rating)     where.rating     = Number(rating);
  if (propertyId) where.propertyId = propertyId;
  if (published === 'true')  where.isPublished = true;
  if (published === 'false') where.isPublished = false;
  if (search) {
    where.OR = [
      { comment:  { contains: search, mode: 'insensitive' } },
      { property: { name: { contains: search, mode: 'insensitive' } } },
      { customer: { fullName: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        property: { select: { id: true, name: true, slug: true, propertyType: true } },
        customer: { select: { fullName: true, user: { select: { email: true, phone: true } } } },
        booking:  { select: { id: true, eventDate: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip:  (Number(page) - 1) * Number(limit),
      take:  Number(limit),
    }),
    prisma.review.count({ where }),
  ]);

  const avg = await prisma.review.aggregate({ _avg: { rating: true } });
  res.json({ reviews, total, avgRating: avg._avg.rating });
};

exports.toggleReview = async (req, res) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) throw createError('Review not found', 404);
  const updated = await prisma.review.update({
    where: { id: req.params.id },
    data:  { isPublished: !review.isPublished },
  });
  await audit({ userId: req.user.id, action: updated.isPublished ? 'REVIEW_PUBLISHED' : 'REVIEW_HIDDEN', entity: 'review', entityId: req.params.id });
  res.json({ message: `Review ${updated.isPublished ? 'published' : 'hidden'}`, review: updated });
};

exports.deleteReview = async (req, res) => {
  await prisma.review.delete({ where: { id: req.params.id } });
  await audit({ userId: req.user.id, action: 'REVIEW_DELETED', entity: 'review', entityId: req.params.id });
  res.json({ message: 'Review deleted' });
};

// ─── Platform Config ──────────────────────────────────────────────────────────

exports.getPlatformConfig = async (req, res) => {
  const configs = await prisma.platformConfig.findMany();
  const map = {};
  configs.forEach(c => { map[c.key] = c.value; });
  res.json(map);
};

exports.setPlatformConfig = async (req, res) => {
  const { key, value } = req.body;
  if (!key) throw createError('key is required', 400);
  const config = await prisma.platformConfig.upsert({
    where:  { key },
    update: { value },
    create: { key, value },
  });
  await audit({ userId: req.user.id, action: 'CONFIG_UPDATED', entity: 'platformConfig', entityId: String(config.id) });
  res.json({ message: 'Config updated', config });
};

exports.getLocations = async (req, res) => {
  const states = await prisma.state.findMany({ include: { nodes: { where: { level: 1 } } } });
  res.json(states);
};

exports.addState = async (req, res) => {
  const state = await prisma.state.create({ data: req.body });
  res.status(201).json(state);
};

exports.addLocationNode = async (req, res) => {
  const node = await prisma.locationNode.create({ data: req.body });
  res.status(201).json(node);
};

// ─── Owner Registration by Admin ─────────────────────────────────────────────

exports.registerOwner = async (req, res) => {
  const { phone, email, fullName, businessName, address, ownerType, password } = req.body;
  if (!phone || !fullName || !businessName || !email) {
    throw createError('phone, email, fullName and businessName are required', 400);
  }

  const [byPhone, byEmail] = await Promise.all([
    prisma.user.findUnique({ where: { phone } }),
    email ? prisma.user.findFirst({ where: { email } }) : null,
  ]);
  if (byPhone) throw createError('Phone number already registered', 409);
  if (byEmail) throw createError('Email address already registered', 409);

  if (!password) throw createError('Password is required', 400);
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      phone,
      email: email || null,
      role: 'OWNER',
      passwordHash,
      ownerProfile: {
        create: {
          fullName,
          businessName,
          address: address || '',
          ownerType: ownerType || 'GENERAL',
        },
      },
    },
    include: { ownerProfile: true },
  });

  await audit(req.user.id, 'REGISTER_OWNER', { targetUserId: user.id, ownerType });
  res.status(201).json({ message: 'Owner registered', user });
};

// ─── Owners by Type ───────────────────────────────────────────────────────────

exports.getOwnersByType = async (req, res) => {
  const { type, search, status, page = 1, limit = 20 } = req.query;
  const ownerTypeFilter = type
    ? { ownerType: { in: [type, 'GENERAL'] } }
    : {};
  const where = { ...ownerTypeFilter };
  if (status) where.verificationStatus = status;
  if (search) where.AND = [
    ...(where.AND || []),
    { OR: [
      { fullName: { contains: search, mode: 'insensitive' } },
      { businessName: { contains: search, mode: 'insensitive' } },
    ]},
  ];

  const [owners, total] = await Promise.all([
    prisma.ownerProfile.findMany({
      where,
      include: {
        user: { select: { id: true, phone: true, email: true, status: true, createdAt: true } },
        _count: { select: { properties: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.ownerProfile.count({ where }),
  ]);
  res.json({ owners, total });
};

// ─── Admin Venue CRUD ─────────────────────────────────────────────────────────

function makeSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    + '-' + Date.now().toString(36);
}

exports.getOwnersForDropdown = async (req, res) => {
  const owners = await prisma.ownerProfile.findMany({
    select: {
      id: true,
      fullName: true,
      businessName: true,
      ownerType: true,
      user: { select: { email: true, phone: true } },
    },
    orderBy: { businessName: 'asc' },
  });
  res.json(owners);
};

exports.createVenue = async (req, res) => {
  const {
    name, description, propertyType, addressLine, totalCapacity,
    locationNodeId, ownerId, hasAC, hasPool, hasRooms, outdoorArea,
    termsConditions, parkingCapacity, status,
  } = req.body;

  if (!name || !description || !propertyType || !addressLine || !totalCapacity || !locationNodeId || !ownerId) {
    throw createError('name, description, propertyType, addressLine, totalCapacity, locationNodeId and ownerId are required', 400);
  }

  const slug = makeSlug(name);

  const property = await prisma.property.create({
    data: {
      name,
      slug,
      description,
      propertyType,
      addressLine,
      totalCapacity: Number(totalCapacity),
      locationNodeId: String(locationNodeId),
      ownerId,
      hasAC: Boolean(hasAC),
      hasPool: Boolean(hasPool),
      hasRooms: Boolean(hasRooms),
      outdoorArea: Boolean(outdoorArea),
      termsConditions: termsConditions || null,
      parkingCapacity: parkingCapacity ? Number(parkingCapacity) : null,
      status: status || 'APPROVED',
      approvedAt: (!status || status === 'APPROVED') ? new Date() : null,
      approvedById: (!status || status === 'APPROVED') ? req.user.id : null,
    },
    include: {
      owner: { select: { businessName: true, fullName: true } },
      locationNode: { select: { name: true } },
    },
  });

  await audit({ userId: req.user.id, action: 'VENUE_CREATED', entity: 'property', entityId: property.id });
  res.status(201).json({ message: 'Venue created', property });
};

exports.updateVenue = async (req, res) => {
  const { id } = req.params;
  const {
    name, description, propertyType, addressLine, totalCapacity,
    locationNodeId, ownerId, hasAC, hasPool, hasRooms, outdoorArea,
    termsConditions, parkingCapacity, status,
  } = req.body;

  const existing = await prisma.property.findUnique({ where: { id } });
  if (!existing) throw createError('Property not found', 404);

  const data = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;
  if (propertyType !== undefined) data.propertyType = propertyType;
  if (addressLine !== undefined) data.addressLine = addressLine;
  if (totalCapacity !== undefined) data.totalCapacity = Number(totalCapacity);
  if (locationNodeId !== undefined) data.locationNodeId = String(locationNodeId);
  if (ownerId !== undefined) data.ownerId = ownerId;
  if (hasAC !== undefined) data.hasAC = Boolean(hasAC);
  if (hasPool !== undefined) data.hasPool = Boolean(hasPool);
  if (hasRooms !== undefined) data.hasRooms = Boolean(hasRooms);
  if (outdoorArea !== undefined) data.outdoorArea = Boolean(outdoorArea);
  if (termsConditions !== undefined) data.termsConditions = termsConditions || null;
  if (parkingCapacity !== undefined) data.parkingCapacity = parkingCapacity ? Number(parkingCapacity) : null;
  if (status !== undefined) data.status = status;

  const property = await prisma.property.update({
    where: { id },
    data,
    include: {
      owner: { select: { businessName: true, fullName: true } },
      locationNode: { select: { name: true } },
    },
  });

  await audit({ userId: req.user.id, action: 'VENUE_UPDATED', entity: 'property', entityId: id });
  res.json({ message: 'Venue updated', property });
};

exports.deleteVenue = async (req, res) => {
  const { id } = req.params;
  const existing = await prisma.property.findUnique({
    where: { id },
    include: { _count: { select: { bookings: true } } },
  });
  if (!existing) throw createError('Property not found', 404);
  if (existing._count.bookings > 0) {
    throw createError('Cannot delete a venue with existing bookings. Deactivate it instead.', 409);
  }
  await prisma.property.delete({ where: { id } });
  await audit({ userId: req.user.id, action: 'VENUE_DELETED', entity: 'property', entityId: id });
  res.json({ message: 'Venue deleted' });
};

exports.updateVenueStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const VALID_STATUSES = ['APPROVED', 'INACTIVE', 'PENDING_REVIEW', 'DRAFT', 'REJECTED'];
  if (!VALID_STATUSES.includes(status)) throw createError('Invalid status', 400);

  const property = await prisma.property.update({
    where: { id },
    data: { status },
  });
  await audit({ userId: req.user.id, action: `VENUE_${status}`, entity: 'property', entityId: id });
  res.json({ message: `Venue status set to ${status}`, property });
};

// ─── Properties by Category ───────────────────────────────────────────────────

exports.getPropertiesByCategory = async (req, res) => {
  const { category, search, status, page = 1, limit = 20 } = req.query;
  const RESORT_TYPES = ['RESORT', 'BANQUET_HALL', 'WEDDING_VENUE'];
  const MANDAP_TYPES = ['MANDAP', 'MARRIAGE_HALL'];

  const typeFilter = category === 'resort' ? RESORT_TYPES : category === 'mandap' ? MANDAP_TYPES : undefined;
  const where = {};
  if (typeFilter) where.propertyType = { in: typeFilter };
  if (status) where.status = status;
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { addressLine: { contains: search, mode: 'insensitive' } },
  ];

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      include: {
        owner: { select: { businessName: true, fullName: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.property.count({ where }),
  ]);
  res.json({ properties, total });
};
