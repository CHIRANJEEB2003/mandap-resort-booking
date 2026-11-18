const { prisma } = require('../utils/prisma');
const { createError } = require('../middleware/errorHandler');
const slugify = require('slugify');
const { v4: uuidv4 } = require('uuid');

const PROPERTY_PUBLIC_SELECT = {
  id: true, name: true, slug: true, description: true, propertyType: true,
  addressLine: true, lat: true, lng: true, totalCapacity: true,
  hasAC: true, hasPool: true, hasRooms: true, outdoorArea: true,
  rating: true, reviewCount: true, status: true,
  media: { where: { isCover: true }, take: 1 },
  locality: { select: { name: true, pinCode: true } },
  locationNode: { select: { name: true, level: true } },
};

exports.listProperties = async (req, res) => {
  const {
    locationNodeId, propertyType, minPrice, maxPrice,
    capacity, hasAC, hasPool, hasRooms, page = 1, limit = 20,
    eventDate, search,
  } = req.query;

  const where = { status: 'APPROVED' };
  if (locationNodeId) where.locationNodeId = Number(locationNodeId);
  if (propertyType) where.propertyType = propertyType;
  if (hasAC === 'true') where.hasAC = true;
  if (hasPool === 'true') where.hasPool = true;
  if (hasRooms === 'true') where.hasRooms = true;
  if (capacity) where.totalCapacity = { gte: Number(capacity) };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { addressLine: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (minPrice || maxPrice) {
    where.pricingRules = {
      some: {
        isActive: true,
        basePrice: {
          ...(minPrice ? { gte: Number(minPrice) } : {}),
          ...(maxPrice ? { lte: Number(maxPrice) } : {}),
        },
      },
    };
  }

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      select: { ...PROPERTY_PUBLIC_SELECT, pricingRules: { where: { isActive: true }, take: 1 } },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { rating: 'desc' },
    }),
    prisma.property.count({ where }),
  ]);

  res.json({ properties, total, page: Number(page), limit: Number(limit) });
};

exports.getFeatured = async (req, res) => {
  const properties = await prisma.property.findMany({
    where: { status: 'APPROVED' },
    select: PROPERTY_PUBLIC_SELECT,
    orderBy: { rating: 'desc' },
    take: 8,
  });
  res.json(properties);
};

exports.getPropertyBySlug = async (req, res) => {
  const property = await prisma.property.findUnique({
    where: { slug: req.params.slug },
    include: {
      halls: { where: { isActive: true } },
      media: { orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }] },
      pricingRules: { where: { isActive: true } },
      amenities: true,
      eventTypes: true,
      locality: true,
      locationNode: { include: { parent: { include: { parent: { include: { parent: true } } } } } },
      owner: { select: { businessName: true, fullName: true, verificationStatus: true } },
      _count: { select: { reviews: true } },
    },
  });

  if (!property) throw createError('Property not found', 404);
  if (property.status !== 'APPROVED' && req.user?.id !== property.owner?.userId) {
    throw createError('Property not found', 404);
  }

  res.json(property);
};

exports.getAvailability = async (req, res) => {
  const { id } = req.params;
  const { month, year } = req.query;

  const start = new Date(Number(year), Number(month) - 1, 1);
  const end = new Date(Number(year), Number(month), 0);

  const bookings = await prisma.booking.findMany({
    where: {
      propertyId: id,
      eventDate: { gte: start, lte: end },
      status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] },
    },
    select: { eventDate: true, hallId: true },
  });

  res.json({ bookedDates: bookings.map(b => b.eventDate) });
};

exports.getReviews = async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const reviews = await prisma.review.findMany({
    where: { propertyId: id, isPublished: true },
    include: { customer: { select: { fullName: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
  });

  res.json(reviews);
};

exports.createProperty = async (req, res) => {
  const owner = await prisma.ownerProfile.findUnique({ where: { userId: req.user.id } });
  if (!owner) throw createError('Owner profile not found', 404);
  if (owner.verificationStatus !== 'APPROVED') {
    throw createError('Owner account must be verified before listing properties', 403);
  }

  const { name, ...rest } = req.body;
  const baseSlug = slugify(name, { lower: true, strict: true });
  const slug = `${baseSlug}-${uuidv4().slice(0, 8)}`;

  const property = await prisma.property.create({
    data: { name, slug, ownerId: owner.id, ...rest, status: 'PENDING_REVIEW' },
  });

  res.status(201).json(property);
};

exports.updateProperty = async (req, res) => {
  const owner = await prisma.ownerProfile.findUnique({ where: { userId: req.user.id } });
  const property = await prisma.property.findFirst({
    where: { id: req.params.id, ownerId: owner.id },
  });
  if (!property) throw createError('Property not found', 404);

  const updated = await prisma.property.update({
    where: { id: req.params.id },
    data: { ...req.body, status: 'PENDING_REVIEW' },
  });
  res.json(updated);
};

exports.deleteProperty = async (req, res) => {
  const owner = await prisma.ownerProfile.findUnique({ where: { userId: req.user.id } });
  const hasActiveBookings = await prisma.booking.count({
    where: { propertyId: req.params.id, status: { in: ['CONFIRMED', 'PENDING_PAYMENT'] } },
  });
  if (hasActiveBookings > 0) throw createError('Cannot delete property with active bookings', 400);

  await prisma.property.update({
    where: { id: req.params.id },
    data: { status: 'INACTIVE' },
  });
  res.json({ message: 'Property deactivated' });
};

exports.uploadMedia = async (req, res) => {
  const files = req.uploadedFiles || [];
  const mediaItems = files.map((f, i) => ({
    propertyId: req.params.id,
    mediaType: f.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE',
    url: f.url,
    sortOrder: i,
  }));

  await prisma.propertyMedia.createMany({ data: mediaItems });
  res.json({ uploaded: mediaItems.length });
};

exports.deleteMedia = async (req, res) => {
  await prisma.propertyMedia.delete({ where: { id: req.params.mediaId } });
  res.json({ message: 'Media deleted' });
};

exports.addHall = async (req, res) => {
  const hall = await prisma.hall.create({
    data: { propertyId: req.params.id, ...req.body },
  });
  res.status(201).json(hall);
};

exports.updateHall = async (req, res) => {
  const hall = await prisma.hall.update({
    where: { id: req.params.hallId },
    data: req.body,
  });
  res.json(hall);
};

exports.deleteHall = async (req, res) => {
  await prisma.hall.update({ where: { id: req.params.hallId }, data: { isActive: false } });
  res.json({ message: 'Hall deactivated' });
};

exports.setPricing = async (req, res) => {
  const { rules } = req.body;
  for (const rule of rules) {
    await prisma.pricingRule.upsert({
      where: { id: rule.id || 'new' },
      update: rule,
      create: { propertyId: req.params.id, ...rule },
    });
  }
  res.json({ message: 'Pricing updated' });
};

exports.getResources = async (req, res) => {
  const resources = await prisma.propertyResource.findMany({
    where: { propertyId: req.params.id },
    include: { resourceType: true },
  });
  res.json(resources);
};

exports.addResource = async (req, res) => {
  const resource = await prisma.propertyResource.create({
    data: { propertyId: req.params.id, ...req.body },
    include: { resourceType: true },
  });
  res.status(201).json(resource);
};

exports.updateResource = async (req, res) => {
  const resource = await prisma.propertyResource.update({
    where: { id: req.params.resourceId },
    data: req.body,
  });
  res.json(resource);
};

// ─── CATERING PACKAGES ────────────────────────────────────────────────────────

exports.getCateringPackages = async (req, res) => {
  const pkgs = await prisma.cateringPackage.findMany({
    where: { propertyId: req.params.id, isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(pkgs);
};

exports.addCateringPackage = async (req, res) => {
  const pkg = await prisma.cateringPackage.create({
    data: { propertyId: req.params.id, ...req.body },
  });
  res.status(201).json(pkg);
};

exports.updateCateringPackage = async (req, res) => {
  const pkg = await prisma.cateringPackage.update({
    where: { id: req.params.pkgId },
    data: req.body,
  });
  res.json(pkg);
};

exports.deleteCateringPackage = async (req, res) => {
  await prisma.cateringPackage.update({
    where: { id: req.params.pkgId },
    data: { isActive: false },
  });
  res.json({ message: 'Package deactivated' });
};

// ─── DECORATION PACKAGES ──────────────────────────────────────────────────────

exports.getDecorationPackages = async (req, res) => {
  const pkgs = await prisma.decorationPackage.findMany({
    where: { propertyId: req.params.id, isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json(pkgs);
};

exports.addDecorationPackage = async (req, res) => {
  const pkg = await prisma.decorationPackage.create({
    data: { propertyId: req.params.id, ...req.body },
  });
  res.status(201).json(pkg);
};

exports.updateDecorationPackage = async (req, res) => {
  const pkg = await prisma.decorationPackage.update({
    where: { id: req.params.pkgId },
    data: req.body,
  });
  res.json(pkg);
};

exports.deleteDecorationPackage = async (req, res) => {
  await prisma.decorationPackage.update({
    where: { id: req.params.pkgId },
    data: { isActive: false },
  });
  res.json({ message: 'Package deactivated' });
};
