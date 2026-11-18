const { prisma } = require('../utils/prisma');
const { createError } = require('../middleware/errorHandler');
const { audit } = require('../utils/audit');
const { toDateOnly } = require('../utils/date');

exports.createBooking = async (req, res) => {
  const { propertyId, hallId, eventDate, eventType, guestCount, services = [], notes } = req.body;

  const customer = await prisma.customerProfile.findUnique({ where: { userId: req.user.id } });
  if (!customer) throw createError('Customer profile not found', 404);

  const property = await prisma.property.findFirst({
    where: { id: propertyId, status: 'APPROVED' },
    include: { pricingRules: { where: { isActive: true }, take: 1 } },
  });
  if (!property) throw createError('Property not found or unavailable', 404);

  // Check date not already booked
  const existing = await prisma.booking.findFirst({
    where: {
      propertyId,
      hallId: hallId || null,
      eventDate: toDateOnly(eventDate),
      status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] },
    },
  });
  if (existing) throw createError('Selected date is already booked', 409);

  const baseAmount = property.pricingRules[0]?.basePrice ?? 0;
  const servicesAmount = services.reduce((sum, s) => sum + (s.totalPrice || 0), 0);
  const taxAmount = Number(((Number(baseAmount) + servicesAmount) * 0.18).toFixed(2));
  const totalAmount = Number(baseAmount) + servicesAmount + taxAmount;
  const advancePercent = property.pricingRules[0]?.advancePercent ?? 30;
  const advanceAmount = Number(((totalAmount * advancePercent) / 100).toFixed(2));

  const booking = await prisma.booking.create({
    data: {
      propertyId,
      hallId: hallId || null,
      customerId: customer.id,
      eventDate: toDateOnly(eventDate),
      eventType,
      guestCount,
      notes,
      baseAmount,
      servicesAmount,
      taxAmount,
      totalAmount,
      advanceAmount,
      status: 'ENQUIRY',
      // MongoDB rejects an empty insertMany, so only nest when there are services
      ...(services.length ? { services: { createMany: { data: services } } } : {}),
    },
    include: { services: true, property: { select: { name: true } } },
  });

  await audit({
    userId: req.user.id,
    action: 'BOOKING_CREATED',
    entity: 'booking',
    entityId: booking.id,
    after: { status: booking.status },
    ipAddress: req.ip,
  });

  res.status(201).json(booking);
};

exports.getBooking = async (req, res) => {
  const booking = await prisma.booking.findUnique({
    where: { id: req.params.id },
    include: {
      property: { select: { name: true, addressLine: true, owner: { select: { businessName: true } } } },
      hall: { select: { name: true } },
      customer: { select: { fullName: true, user: { select: { phone: true } } } },
      services: true,
      payments: true,
    },
  });

  if (!booking) throw createError('Booking not found', 404);

  const isOwner = req.user.role === 'OWNER';
  const isCustomer = req.user.role === 'CUSTOMER';
  const isAdmin = req.user.role === 'ADMIN';

  if (!isAdmin) {
    if (isCustomer) {
      const customer = await prisma.customerProfile.findUnique({ where: { userId: req.user.id } });
      if (booking.customerId !== customer?.id) throw createError('Not authorized', 403);
    }
    if (isOwner) {
      const owner = await prisma.ownerProfile.findUnique({ where: { userId: req.user.id } });
      const prop = await prisma.property.findFirst({ where: { id: booking.propertyId, ownerId: owner?.id } });
      if (!prop) throw createError('Not authorized', 403);
    }
  }

  res.json(booking);
};

exports.getMyBookings = async (req, res) => {
  const customer = await prisma.customerProfile.findUnique({ where: { userId: req.user.id } });
  const { status, page = 1, limit = 10, includeHidden } = req.query;

  const where = { customerId: customer.id };
  if (status) where.status = status;
  if (!includeHidden) where.hiddenFromHistory = false;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        property: { select: { name: true, addressLine: true, media: { where: { isCover: true }, take: 1 } } },
        payments: { where: { status: 'CAPTURED' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.booking.count({ where }),
  ]);

  res.json({ bookings, total });
};

exports.getOwnerRequests = async (req, res) => {
  const owner = await prisma.ownerProfile.findUnique({ where: { userId: req.user.id } });
  const { status = 'ENQUIRY', page = 1, limit = 10 } = req.query;

  const properties = await prisma.property.findMany({
    where: { ownerId: owner.id },
    select: { id: true },
  });
  const propertyIds = properties.map(p => p.id);

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where: { propertyId: { in: propertyIds }, status },
      include: {
        customer: { select: { fullName: true, user: { select: { phone: true } } } },
        property: { select: { name: true } },
        hall: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.booking.count({ where: { propertyId: { in: propertyIds }, status } }),
  ]);

  res.json({ bookings, total });
};

exports.confirmBooking = async (req, res) => {
  const booking = await _verifyOwnerBooking(req.params.id, req.user.id);
  if (booking.status !== 'ENQUIRY') throw createError('Booking cannot be confirmed in current state', 400);

  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: { status: 'PENDING_PAYMENT', confirmedAt: new Date(), ownerNotes: req.body.notes },
  });

  await audit({ userId: req.user.id, action: 'BOOKING_CONFIRMED', entity: 'booking', entityId: req.params.id });
  res.json(updated);
};

exports.rejectBooking = async (req, res) => {
  const booking = await _verifyOwnerBooking(req.params.id, req.user.id);
  if (!['ENQUIRY'].includes(booking.status)) throw createError('Cannot reject booking in current state', 400);

  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: req.body.reason },
  });

  await audit({ userId: req.user.id, action: 'BOOKING_REJECTED', entity: 'booking', entityId: req.params.id });
  res.json(updated);
};

exports.cancelByCustomer = async (req, res) => {
  const customer = await prisma.customerProfile.findUnique({ where: { userId: req.user.id } });
  const booking = await prisma.booking.findFirst({
    where: { id: req.params.id, customerId: customer.id },
  });
  if (!booking) throw createError('Booking not found', 404);
  if (!['ENQUIRY', 'PENDING_PAYMENT', 'CONFIRMED'].includes(booking.status)) {
    throw createError('Booking cannot be cancelled', 400);
  }

  // Refund policy: 10% of totalAmount back to client, 20% retained by owner.
  // Applies only to confirmed bookings where advance has been paid.
  const total = Number(booking.totalAmount);
  const refundAmount = Number((total * 0.10).toFixed(2));
  const ownerRetentionAmount = Number((total * 0.20).toFixed(2));

  const updated = await prisma.booking.update({
    where: { id: req.params.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelReason: req.body.reason,
      refundAmount,
      ownerRetentionAmount,
    },
  });

  await audit({
    userId: req.user.id,
    action: 'BOOKING_CANCELLED',
    entity: 'booking',
    entityId: req.params.id,
    after: { status: 'CANCELLED', refundAmount, ownerRetentionAmount },
    ipAddress: req.ip,
  });

  res.json(updated);
};

exports.hideFromHistory = async (req, res) => {
  const customer = await prisma.customerProfile.findUnique({ where: { userId: req.user.id } });
  const booking = await prisma.booking.findFirst({
    where: { id: req.params.id, customerId: customer.id },
  });
  if (!booking) throw createError('Booking not found', 404);
  if (!['CANCELLED', 'COMPLETED'].includes(booking.status)) {
    throw createError('Only completed or cancelled bookings can be removed from history', 400);
  }
  await prisma.booking.update({
    where: { id: req.params.id },
    data: { hiddenFromHistory: true },
  });
  res.json({ success: true });
};

exports.submitReview = async (req, res) => {
  const customer = await prisma.customerProfile.findUnique({ where: { userId: req.user.id } });
  const booking = await prisma.booking.findFirst({
    where: { id: req.params.id, customerId: customer.id, status: 'COMPLETED' },
  });
  if (!booking) throw createError('Can only review completed bookings', 400);

  const { rating, comment } = req.body;
  if (rating < 1 || rating > 5) throw createError('Rating must be 1–5', 400);

  const review = await prisma.review.create({
    data: { propertyId: booking.propertyId, customerId: customer.id, bookingId: booking.id, rating, comment },
  });

  // Update property aggregate rating
  const agg = await prisma.review.aggregate({
    where: { propertyId: booking.propertyId, isPublished: true },
    _avg: { rating: true },
    _count: true,
  });
  await prisma.property.update({
    where: { id: booking.propertyId },
    data: { rating: agg._avg.rating, reviewCount: agg._count },
  });

  res.status(201).json(review);
};

exports.getAllBookings = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const where = status ? { status } : {};
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        property: { select: { name: true } },
        customer: { select: { fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.booking.count({ where }),
  ]);
  res.json({ bookings, total });
};

async function _verifyOwnerBooking(bookingId, userId) {
  const owner = await prisma.ownerProfile.findUnique({ where: { userId } });
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw createError('Booking not found', 404);

  const prop = await prisma.property.findFirst({ where: { id: booking.propertyId, ownerId: owner.id } });
  if (!prop) throw createError('Not authorized', 403);
  return booking;
}
