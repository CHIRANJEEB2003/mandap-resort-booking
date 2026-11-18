const { prisma } = require('../utils/prisma');
const { createError } = require('../middleware/errorHandler');

// ─── helpers ──────────────────────────────────────────────────────────────────

function computeNights(checkIn, checkOut) {
  const a = new Date(checkIn);
  const b = new Date(checkOut);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

async function getBookedRoomCount(roomId, checkIn, checkOut) {
  const bookings = await prisma.roomBooking.findMany({
    where: {
      roomId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      checkIn: { lt: new Date(checkOut) },
      checkOut: { gt: new Date(checkIn) },
    },
    select: { roomCount: true },
  });
  return bookings.reduce((sum, b) => sum + b.roomCount, 0);
}

// ─── public ───────────────────────────────────────────────────────────────────

exports.listResortRooms = async (req, res) => {
  const { propertyId, category } = req.query;
  if (!propertyId) throw createError('propertyId is required', 400);

  const where = { propertyId, isActive: true };
  if (category) where.category = category;

  const rooms = await prisma.room.findMany({
    where,
    include: { media: { orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }] } },
    orderBy: [{ category: 'asc' }, { pricePerNight: 'asc' }],
  });
  res.json(rooms);
};

exports.getRoomDetail = async (req, res) => {
  const room = await prisma.room.findUnique({
    where: { id: req.params.id },
    include: {
      media: { orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }] },
      property: { select: { id: true, name: true, slug: true, addressLine: true, propertyType: true } },
    },
  });
  if (!room) throw createError('Room not found', 404);
  res.json(room);
};

exports.checkRoomAvailability = async (req, res) => {
  const { checkIn, checkOut } = req.query;
  if (!checkIn || !checkOut) throw createError('checkIn and checkOut are required', 400);

  const nights = computeNights(checkIn, checkOut);
  if (nights <= 0) throw createError('checkOut must be after checkIn', 400);

  const room = await prisma.room.findUnique({ where: { id: req.params.id } });
  if (!room) throw createError('Room not found', 404);

  const bookedCount = await getBookedRoomCount(room.id, checkIn, checkOut);
  const availableRooms = room.totalRooms - bookedCount;

  res.json({ available: availableRooms > 0, availableRooms, nights });
};

// ─── owner: room management ───────────────────────────────────────────────────

exports.getOwnerRooms = async (req, res) => {
  const owner = await prisma.ownerProfile.findUnique({
    where: { userId: req.user.id },
    select: { id: true },
  });
  if (!owner) throw createError('Owner profile not found', 404);

  const properties = await prisma.property.findMany({
    where: { ownerId: owner.id },
    select: {
      id: true, name: true, slug: true, propertyType: true, status: true,
      rooms: {
        include: { media: { where: { isCover: true }, take: 1 } },
        orderBy: { category: 'asc' },
      },
    },
  });
  res.json(properties);
};

exports.createRoom = async (req, res) => {
  const { propertyId, category, name, description, pricePerNight, totalRooms, maxGuests, facilities } = req.body;

  const owner = await prisma.ownerProfile.findUnique({ where: { userId: req.user.id } });
  if (!owner) throw createError('Owner profile not found', 404);

  const property = await prisma.property.findFirst({
    where: { id: propertyId, ownerId: owner.id },
  });
  if (!property) throw createError('Property not found or not yours', 404);

  const room = await prisma.room.create({
    data: {
      propertyId,
      category,
      name,
      description,
      pricePerNight: Number(pricePerNight),
      totalRooms: Number(totalRooms),
      maxGuests: maxGuests ? Number(maxGuests) : 2,
      facilities: facilities || [],
    },
    include: { media: true },
  });
  res.status(201).json(room);
};

exports.updateRoom = async (req, res) => {
  const owner = await prisma.ownerProfile.findUnique({ where: { userId: req.user.id } });
  if (!owner) throw createError('Owner profile not found', 404);

  const room = await prisma.room.findFirst({
    where: { id: req.params.id, property: { ownerId: owner.id } },
  });
  if (!room) throw createError('Room not found or not yours', 404);

  const { category, name, description, pricePerNight, totalRooms, maxGuests, facilities, isActive } = req.body;

  const updated = await prisma.room.update({
    where: { id: req.params.id },
    data: {
      ...(category !== undefined && { category }),
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(pricePerNight !== undefined && { pricePerNight: Number(pricePerNight) }),
      ...(totalRooms !== undefined && { totalRooms: Number(totalRooms) }),
      ...(maxGuests !== undefined && { maxGuests: Number(maxGuests) }),
      ...(facilities !== undefined && { facilities }),
      ...(isActive !== undefined && { isActive }),
    },
    include: { media: true },
  });
  res.json(updated);
};

exports.deleteRoom = async (req, res) => {
  const owner = await prisma.ownerProfile.findUnique({ where: { userId: req.user.id } });
  if (!owner) throw createError('Owner profile not found', 404);

  const room = await prisma.room.findFirst({
    where: { id: req.params.id, property: { ownerId: owner.id } },
  });
  if (!room) throw createError('Room not found or not yours', 404);

  await prisma.room.update({ where: { id: req.params.id }, data: { isActive: false } });
  res.json({ message: 'Room deactivated' });
};

exports.addRoomMedia = async (req, res) => {
  const { url, isCover } = req.body;
  const owner = await prisma.ownerProfile.findUnique({ where: { userId: req.user.id } });
  const room = await prisma.room.findFirst({
    where: { id: req.params.id, property: { ownerId: owner.id } },
  });
  if (!room) throw createError('Room not found or not yours', 404);

  if (isCover) {
    await prisma.roomMedia.updateMany({ where: { roomId: room.id }, data: { isCover: false } });
  }
  const count = await prisma.roomMedia.count({ where: { roomId: room.id } });
  const media = await prisma.roomMedia.create({
    data: { roomId: room.id, url, isCover: Boolean(isCover), sortOrder: count },
  });
  res.status(201).json(media);
};

exports.deleteRoomMedia = async (req, res) => {
  const owner = await prisma.ownerProfile.findUnique({ where: { userId: req.user.id } });
  const room = await prisma.room.findFirst({
    where: { id: req.params.id, property: { ownerId: owner.id } },
  });
  if (!room) throw createError('Room not found or not yours', 404);

  await prisma.roomMedia.delete({ where: { id: req.params.mediaId } });
  res.json({ message: 'Media removed' });
};

// ─── owner: room bookings ─────────────────────────────────────────────────────

exports.getOwnerRoomBookings = async (req, res) => {
  const owner = await prisma.ownerProfile.findUnique({ where: { userId: req.user.id } });
  if (!owner) throw createError('Owner profile not found', 404);

  const { status, page = 1, limit = 20 } = req.query;
  const where = { room: { property: { ownerId: owner.id } } };
  if (status) where.status = status;

  const [bookings, total] = await Promise.all([
    prisma.roomBooking.findMany({
      where,
      include: {
        room: { select: { id: true, name: true, category: true, property: { select: { id: true, name: true } } } },
        customer: { select: { fullName: true, user: { select: { phone: true, email: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.roomBooking.count({ where }),
  ]);

  res.json({ bookings, total, page: Number(page), limit: Number(limit) });
};

exports.confirmRoomBooking = async (req, res) => {
  const owner = await prisma.ownerProfile.findUnique({ where: { userId: req.user.id } });

  const booking = await prisma.roomBooking.findFirst({
    where: { id: req.params.id, room: { property: { ownerId: owner.id } } },
  });
  if (!booking) throw createError('Booking not found', 404);
  if (booking.status !== 'PENDING') throw createError('Booking is not in PENDING state', 400);

  const updated = await prisma.roomBooking.update({
    where: { id: req.params.id },
    data: { status: 'CONFIRMED', confirmedAt: new Date() },
    include: { room: { select: { name: true, category: true } }, customer: { select: { fullName: true } } },
  });
  res.json(updated);
};

exports.rejectRoomBooking = async (req, res) => {
  const owner = await prisma.ownerProfile.findUnique({ where: { userId: req.user.id } });

  const booking = await prisma.roomBooking.findFirst({
    where: { id: req.params.id, room: { property: { ownerId: owner.id } } },
  });
  if (!booking) throw createError('Booking not found', 404);
  if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
    throw createError('Cannot cancel this booking', 400);
  }

  const updated = await prisma.roomBooking.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED', cancelledAt: new Date(), cancelReason: req.body.reason || 'Rejected by owner' },
  });
  res.json(updated);
};

// ─── admin ────────────────────────────────────────────────────────────────────

exports.getAllRoomsAdmin = async (req, res) => {
  const { propertyId, category, page = 1, limit = 20 } = req.query;
  const where = {};
  if (propertyId) where.propertyId = propertyId;
  if (category) where.category = category;

  const [rooms, total] = await Promise.all([
    prisma.room.findMany({
      where,
      include: {
        property: { select: { id: true, name: true, owner: { select: { businessName: true } } } },
        media: { where: { isCover: true }, take: 1 },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.room.count({ where }),
  ]);
  res.json({ rooms, total, page: Number(page), limit: Number(limit) });
};

exports.getAllRoomBookingsAdmin = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const where = {};
  if (status) where.status = status;

  const [bookings, total] = await Promise.all([
    prisma.roomBooking.findMany({
      where,
      include: {
        room: { select: { name: true, category: true, property: { select: { name: true } } } },
        customer: { select: { fullName: true, user: { select: { phone: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.roomBooking.count({ where }),
  ]);
  res.json({ bookings, total, page: Number(page), limit: Number(limit) });
};

exports.toggleRoomAdmin = async (req, res) => {
  const room = await prisma.room.findUnique({ where: { id: req.params.id } });
  if (!room) throw createError('Room not found', 404);
  const updated = await prisma.room.update({
    where: { id: req.params.id },
    data: { isActive: !room.isActive },
  });
  res.json(updated);
};
