const { prisma } = require('../utils/prisma');
const { createError } = require('../middleware/errorHandler');

function computeNights(checkIn, checkOut) {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

async function getAvailableRooms(roomId, checkIn, checkOut, excludeBookingId) {
  const where = {
    roomId,
    status: { in: ['PENDING', 'CONFIRMED'] },
    checkIn: { lt: new Date(checkOut) },
    checkOut: { gt: new Date(checkIn) },
  };
  if (excludeBookingId) where.id = { not: excludeBookingId };

  const bookings = await prisma.roomBooking.findMany({ where, select: { roomCount: true } });
  const booked = bookings.reduce((s, b) => s + b.roomCount, 0);
  return booked;
}

exports.createRoomBooking = async (req, res) => {
  const { roomId, checkIn, checkOut, roomCount, guestCount, notes } = req.body;

  const customer = await prisma.customerProfile.findUnique({ where: { userId: req.user.id } });
  if (!customer) throw createError('Customer profile not found', 404);

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: { property: { select: { status: true } } },
  });
  if (!room || !room.isActive) throw createError('Room not found or unavailable', 404);
  if (room.property.status !== 'APPROVED') throw createError('Property is not available for booking', 400);

  const nights = computeNights(checkIn, checkOut);
  if (nights <= 0) throw createError('checkOut must be after checkIn', 400);

  const booked = await getAvailableRooms(roomId, checkIn, checkOut);
  if (room.totalRooms - booked < roomCount) {
    throw createError(`Only ${room.totalRooms - booked} rooms available for the selected dates`, 400);
  }

  const totalAmount = Number(room.pricePerNight) * nights * Number(roomCount);
  const taxAmount = Math.round(totalAmount * 0.18 * 100) / 100;
  const advanceAmount = Math.round((totalAmount + taxAmount) * 0.3 * 100) / 100;

  const booking = await prisma.roomBooking.create({
    data: {
      roomId,
      customerId: customer.id,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      nights,
      roomCount: Number(roomCount),
      guestCount: Number(guestCount),
      totalAmount: totalAmount + taxAmount,
      taxAmount,
      advanceAmount,
      notes,
      status: 'PENDING',
    },
    include: {
      room: {
        select: { name: true, category: true, pricePerNight: true,
          property: { select: { id: true, name: true, addressLine: true } } },
      },
    },
  });

  res.status(201).json(booking);
};

exports.getMyRoomBookings = async (req, res) => {
  const customer = await prisma.customerProfile.findUnique({ where: { userId: req.user.id } });
  if (!customer) throw createError('Customer profile not found', 404);

  const { status, page = 1, limit = 20 } = req.query;
  const where = { customerId: customer.id };
  if (status) where.status = status;

  const [bookings, total] = await Promise.all([
    prisma.roomBooking.findMany({
      where,
      include: {
        room: {
          include: {
            media: { where: { isCover: true }, take: 1 },
            property: { select: { id: true, name: true, addressLine: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.roomBooking.count({ where }),
  ]);

  res.json({ bookings, total, page: Number(page), limit: Number(limit) });
};

exports.getRoomBookingDetail = async (req, res) => {
  const booking = await prisma.roomBooking.findUnique({
    where: { id: req.params.id },
    include: {
      room: {
        include: {
          media: { orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }] },
          property: { select: { id: true, name: true, addressLine: true, slug: true, lat: true, lng: true } },
        },
      },
      customer: { select: { fullName: true, user: { select: { phone: true, email: true } } } },
      payments: true,
    },
  });
  if (!booking) throw createError('Booking not found', 404);

  const isOwner = req.user.role === 'OWNER';
  const isCustomer = req.user.role === 'CUSTOMER';
  const isAdmin = req.user.role === 'ADMIN';

  if (isCustomer) {
    const customer = await prisma.customerProfile.findUnique({ where: { userId: req.user.id } });
    if (booking.customerId !== customer?.id) throw createError('Not authorized', 403);
  } else if (isOwner) {
    const owner = await prisma.ownerProfile.findUnique({ where: { userId: req.user.id } });
    const prop = await prisma.property.findFirst({ where: { id: booking.room.property.id, ownerId: owner?.id } });
    if (!prop) throw createError('Not authorized', 403);
  } else if (!isAdmin) {
    throw createError('Not authorized', 403);
  }

  res.json(booking);
};

exports.cancelRoomBooking = async (req, res) => {
  const customer = await prisma.customerProfile.findUnique({ where: { userId: req.user.id } });
  if (!customer) throw createError('Customer profile not found', 404);

  const booking = await prisma.roomBooking.findFirst({
    where: { id: req.params.id, customerId: customer.id },
  });
  if (!booking) throw createError('Booking not found', 404);
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    throw createError('This booking cannot be cancelled', 400);
  }

  const updated = await prisma.roomBooking.update({
    where: { id: req.params.id },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelReason: req.body.reason || 'Cancelled by customer',
    },
  });
  res.json(updated);
};
