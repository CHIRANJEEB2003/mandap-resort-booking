const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CEREMONY_TYPES = ['MEHENDI', 'HALDI', 'MARRIAGE', 'RECEPTION', 'COMPLETE'];
const PHOTO_SERVICE_TYPES = ['PRE_WEDDING', 'WEDDING', 'CINEMATIC', 'DRONE', 'ALBUM', 'CANDID', 'TRADITIONAL', 'COMPLETE'];
const DECOR_SERVICE_TYPES = ['MEHENDI', 'HALDI', 'STAGE', 'RECEPTION', 'MANDAP', 'ENTRANCE', 'FLORAL', 'LIGHTING', 'COMPLETE', 'GENERAL'];
const GALLERY_CATEGORIES = ['GENERAL', 'INTERIOR', 'EXTERIOR', 'STAGE', 'DECORATION', 'ROOM', 'POOL'];

function createError(msg, code) { const e = new Error(msg); e.statusCode = code; return e; }

// ── Helpers ───────────────────────────────────────────────────────────────────

async function getOwnerPropertyIds(ownerId) {
  const props = await prisma.property.findMany({
    where: { ownerId },
    select: { id: true },
  });
  return props.map(p => p.id);
}

async function assertOwnsProperty(ownerId, propertyId) {
  const prop = await prisma.property.findFirst({ where: { id: propertyId, ownerId } });
  if (!prop) throw createError('Property not found or not yours', 403);
  return prop;
}

// ── PUBLIC – Browse Packages ──────────────────────────────────────────────────

exports.getPublicWeddingPackages = async (req, res) => {
  const { propertyId, ceremonyType, page = 1, limit = 20 } = req.query;
  const where = { isActive: true };
  if (propertyId) where.propertyId = propertyId;
  if (ceremonyType) where.ceremonyType = ceremonyType;

  const [packages, total] = await Promise.all([
    prisma.weddingPackage.findMany({
      where,
      include: {
        property: { select: { id: true, name: true, addressLine: true, propertyType: true, locationNode: { select: { name: true } } } },
      },
      orderBy: [{ ceremonyType: 'asc' }, { startingPrice: 'asc' }],
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.weddingPackage.count({ where }),
  ]);
  res.json({ packages, total, page: Number(page), limit: Number(limit) });
};

exports.getPublicPhotographyServices = async (req, res) => {
  const { propertyId, serviceType } = req.query;
  const where = { isActive: true };
  if (propertyId) where.propertyId = propertyId;
  if (serviceType) where.serviceType = serviceType;
  const services = await prisma.photographyService.findMany({
    where,
    include: { property: { select: { id: true, name: true } } },
    orderBy: [{ serviceType: 'asc' }, { price: 'asc' }],
  });
  res.json(services);
};

exports.getPublicDecorationServices = async (req, res) => {
  const { propertyId, serviceType } = req.query;
  const where = { isActive: true };
  if (propertyId) where.propertyId = propertyId;
  if (serviceType) where.serviceType = serviceType;
  const services = await prisma.decorationPackage.findMany({
    where,
    include: { property: { select: { id: true, name: true } } },
    orderBy: [{ serviceType: 'asc' }, { price: 'asc' }],
  });
  res.json(services);
};

exports.getPublicGallery = async (req, res) => {
  const { propertyId, category } = req.query;
  if (!propertyId) throw createError('propertyId is required', 400);
  const where = { propertyId, mediaType: 'IMAGE' };
  if (category && category !== 'ALL') where.category = category;
  const photos = await prisma.propertyMedia.findMany({
    where,
    orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  res.json(photos);
};

exports.getPublicVenueWeddingData = async (req, res) => {
  const { propertyId } = req.params;
  const [weddingPackages, photography, decoration, gallery] = await Promise.all([
    prisma.weddingPackage.findMany({ where: { propertyId, isActive: true }, orderBy: { startingPrice: 'asc' } }),
    prisma.photographyService.findMany({ where: { propertyId, isActive: true }, orderBy: { price: 'asc' } }),
    prisma.decorationPackage.findMany({ where: { propertyId, isActive: true }, orderBy: { price: 'asc' } }),
    prisma.propertyMedia.findMany({ where: { propertyId, mediaType: 'IMAGE' }, orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }] }),
  ]);
  res.json({ weddingPackages, photography, decoration, gallery });
};

// ── OWNER – Wedding Packages ──────────────────────────────────────────────────

exports.ownerGetWeddingPackages = async (req, res) => {
  const ownerId = req.user.ownerProfile?.id;
  if (!ownerId) throw createError('Owner profile not found', 403);
  const { propertyId } = req.query;
  const propertyIds = propertyId ? [propertyId] : await getOwnerPropertyIds(ownerId);
  if (propertyId) await assertOwnsProperty(ownerId, propertyId);

  const packages = await prisma.weddingPackage.findMany({
    where: { propertyId: { in: propertyIds } },
    include: { property: { select: { id: true, name: true } } },
    orderBy: [{ propertyId: 'asc' }, { ceremonyType: 'asc' }],
  });
  res.json(packages);
};

exports.ownerCreateWeddingPackage = async (req, res) => {
  const ownerId = req.user.ownerProfile?.id;
  if (!ownerId) throw createError('Owner profile not found', 403);
  const { propertyId, name, ceremonyType, description, guestCapacity, durationDays, startingPrice, includedServices, images, coverImageUrl } = req.body;

  if (!propertyId || !name || !ceremonyType || !startingPrice) throw createError('propertyId, name, ceremonyType, startingPrice are required', 400);
  if (!CEREMONY_TYPES.includes(ceremonyType)) throw createError('Invalid ceremonyType', 400);
  await assertOwnsProperty(ownerId, propertyId);

  const pkg = await prisma.weddingPackage.create({
    data: {
      propertyId, name, ceremonyType,
      description: description || null,
      guestCapacity: guestCapacity ? Number(guestCapacity) : 100,
      durationDays: durationDays ? Number(durationDays) : 1,
      startingPrice: Number(startingPrice),
      includedServices: includedServices || [],
      images: images || [],
      coverImageUrl: coverImageUrl || null,
    },
  });
  res.status(201).json(pkg);
};

exports.ownerUpdateWeddingPackage = async (req, res) => {
  const ownerId = req.user.ownerProfile?.id;
  if (!ownerId) throw createError('Owner profile not found', 403);
  const { id } = req.params;

  const existing = await prisma.weddingPackage.findUnique({ where: { id } });
  if (!existing) throw createError('Package not found', 404);
  await assertOwnsProperty(ownerId, existing.propertyId);

  const { name, ceremonyType, description, guestCapacity, durationDays, startingPrice, includedServices, images, coverImageUrl, isActive } = req.body;
  if (ceremonyType && !CEREMONY_TYPES.includes(ceremonyType)) throw createError('Invalid ceremonyType', 400);

  const updated = await prisma.weddingPackage.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(ceremonyType !== undefined && { ceremonyType }),
      ...(description !== undefined && { description }),
      ...(guestCapacity !== undefined && { guestCapacity: Number(guestCapacity) }),
      ...(durationDays !== undefined && { durationDays: Number(durationDays) }),
      ...(startingPrice !== undefined && { startingPrice: Number(startingPrice) }),
      ...(includedServices !== undefined && { includedServices }),
      ...(images !== undefined && { images }),
      ...(coverImageUrl !== undefined && { coverImageUrl }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) }),
    },
  });
  res.json(updated);
};

exports.ownerDeleteWeddingPackage = async (req, res) => {
  const ownerId = req.user.ownerProfile?.id;
  if (!ownerId) throw createError('Owner profile not found', 403);
  const { id } = req.params;

  const existing = await prisma.weddingPackage.findUnique({ where: { id } });
  if (!existing) throw createError('Package not found', 404);
  await assertOwnsProperty(ownerId, existing.propertyId);

  await prisma.weddingPackage.delete({ where: { id } });
  res.json({ message: 'Package deleted' });
};

// ── OWNER – Photography Services ──────────────────────────────────────────────

exports.ownerGetPhotographyServices = async (req, res) => {
  const ownerId = req.user.ownerProfile?.id;
  if (!ownerId) throw createError('Owner profile not found', 403);
  const { propertyId } = req.query;
  const propertyIds = propertyId ? [propertyId] : await getOwnerPropertyIds(ownerId);
  if (propertyId) await assertOwnsProperty(ownerId, propertyId);

  const services = await prisma.photographyService.findMany({
    where: { propertyId: { in: propertyIds } },
    include: { property: { select: { id: true, name: true } } },
    orderBy: [{ propertyId: 'asc' }, { serviceType: 'asc' }],
  });
  res.json(services);
};

exports.ownerCreatePhotographyService = async (req, res) => {
  const ownerId = req.user.ownerProfile?.id;
  if (!ownerId) throw createError('Owner profile not found', 403);
  const { propertyId, name, serviceType, description, price, images } = req.body;

  if (!propertyId || !name || !serviceType || price === undefined) throw createError('propertyId, name, serviceType, price are required', 400);
  if (!PHOTO_SERVICE_TYPES.includes(serviceType)) throw createError('Invalid serviceType', 400);
  await assertOwnsProperty(ownerId, propertyId);

  const service = await prisma.photographyService.create({
    data: { propertyId, name, serviceType, description: description || null, price: Number(price), images: images || [] },
  });
  res.status(201).json(service);
};

exports.ownerUpdatePhotographyService = async (req, res) => {
  const ownerId = req.user.ownerProfile?.id;
  if (!ownerId) throw createError('Owner profile not found', 403);
  const { id } = req.params;

  const existing = await prisma.photographyService.findUnique({ where: { id } });
  if (!existing) throw createError('Service not found', 404);
  await assertOwnsProperty(ownerId, existing.propertyId);

  const { name, serviceType, description, price, images, isActive } = req.body;
  if (serviceType && !PHOTO_SERVICE_TYPES.includes(serviceType)) throw createError('Invalid serviceType', 400);

  const updated = await prisma.photographyService.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(serviceType !== undefined && { serviceType }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: Number(price) }),
      ...(images !== undefined && { images }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) }),
    },
  });
  res.json(updated);
};

exports.ownerDeletePhotographyService = async (req, res) => {
  const ownerId = req.user.ownerProfile?.id;
  if (!ownerId) throw createError('Owner profile not found', 403);
  const { id } = req.params;

  const existing = await prisma.photographyService.findUnique({ where: { id } });
  if (!existing) throw createError('Service not found', 404);
  await assertOwnsProperty(ownerId, existing.propertyId);

  await prisma.photographyService.delete({ where: { id } });
  res.json({ message: 'Service deleted' });
};

// ── OWNER – Decoration Services ───────────────────────────────────────────────

exports.ownerGetDecorationServices = async (req, res) => {
  const ownerId = req.user.ownerProfile?.id;
  if (!ownerId) throw createError('Owner profile not found', 403);
  const { propertyId } = req.query;
  const propertyIds = propertyId ? [propertyId] : await getOwnerPropertyIds(ownerId);
  if (propertyId) await assertOwnsProperty(ownerId, propertyId);

  const services = await prisma.decorationPackage.findMany({
    where: { propertyId: { in: propertyIds } },
    include: { property: { select: { id: true, name: true } } },
    orderBy: [{ propertyId: 'asc' }, { serviceType: 'asc' }],
  });
  res.json(services);
};

exports.ownerCreateDecorationService = async (req, res) => {
  const ownerId = req.user.ownerProfile?.id;
  if (!ownerId) throw createError('Owner profile not found', 403);
  const { propertyId, name, serviceType, description, price, images, imageUrl } = req.body;

  if (!propertyId || !name || price === undefined) throw createError('propertyId, name, price are required', 400);
  if (serviceType && !DECOR_SERVICE_TYPES.includes(serviceType)) throw createError('Invalid serviceType', 400);
  await assertOwnsProperty(ownerId, propertyId);

  const service = await prisma.decorationPackage.create({
    data: {
      propertyId, name,
      serviceType: serviceType || 'GENERAL',
      description: description || null,
      price: Number(price),
      images: images || [],
      imageUrl: imageUrl || null,
    },
  });
  res.status(201).json(service);
};

exports.ownerUpdateDecorationService = async (req, res) => {
  const ownerId = req.user.ownerProfile?.id;
  if (!ownerId) throw createError('Owner profile not found', 403);
  const { id } = req.params;

  const existing = await prisma.decorationPackage.findUnique({ where: { id } });
  if (!existing) throw createError('Service not found', 404);
  await assertOwnsProperty(ownerId, existing.propertyId);

  const { name, serviceType, description, price, images, imageUrl, isActive } = req.body;
  if (serviceType && !DECOR_SERVICE_TYPES.includes(serviceType)) throw createError('Invalid serviceType', 400);

  const updated = await prisma.decorationPackage.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(serviceType !== undefined && { serviceType }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price: Number(price) }),
      ...(images !== undefined && { images }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) }),
    },
  });
  res.json(updated);
};

exports.ownerDeleteDecorationService = async (req, res) => {
  const ownerId = req.user.ownerProfile?.id;
  if (!ownerId) throw createError('Owner profile not found', 403);
  const { id } = req.params;

  const existing = await prisma.decorationPackage.findUnique({ where: { id } });
  if (!existing) throw createError('Service not found', 404);
  await assertOwnsProperty(ownerId, existing.propertyId);

  await prisma.decorationPackage.delete({ where: { id } });
  res.json({ message: 'Service deleted' });
};

// ── OWNER – Gallery Management ────────────────────────────────────────────────

exports.ownerGetGallery = async (req, res) => {
  const ownerId = req.user.ownerProfile?.id;
  if (!ownerId) throw createError('Owner profile not found', 403);
  const { propertyId, category } = req.query;
  if (!propertyId) throw createError('propertyId is required', 400);
  await assertOwnsProperty(ownerId, propertyId);

  const where = { propertyId, mediaType: 'IMAGE' };
  if (category && category !== 'ALL') where.category = category;

  const photos = await prisma.propertyMedia.findMany({
    where,
    orderBy: [{ isCover: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
  });
  res.json(photos);
};

exports.ownerAddGalleryPhoto = async (req, res) => {
  const ownerId = req.user.ownerProfile?.id;
  if (!ownerId) throw createError('Owner profile not found', 403);
  const { propertyId, url, category, altText, isCover, sortOrder } = req.body;

  if (!propertyId || !url) throw createError('propertyId and url are required', 400);
  await assertOwnsProperty(ownerId, propertyId);

  if (isCover) {
    await prisma.propertyMedia.updateMany({ where: { propertyId }, data: { isCover: false } });
  }

  const photo = await prisma.propertyMedia.create({
    data: {
      propertyId, url, mediaType: 'IMAGE',
      category: category || 'GENERAL',
      altText: altText || null,
      isCover: Boolean(isCover),
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : 0,
    },
  });
  res.status(201).json(photo);
};

exports.ownerUpdateGalleryPhoto = async (req, res) => {
  const ownerId = req.user.ownerProfile?.id;
  if (!ownerId) throw createError('Owner profile not found', 403);
  const { id } = req.params;

  const existing = await prisma.propertyMedia.findUnique({ where: { id } });
  if (!existing) throw createError('Photo not found', 404);
  await assertOwnsProperty(ownerId, existing.propertyId);

  const { category, altText, isCover, sortOrder } = req.body;

  if (isCover) {
    await prisma.propertyMedia.updateMany({ where: { propertyId: existing.propertyId }, data: { isCover: false } });
  }

  const updated = await prisma.propertyMedia.update({
    where: { id },
    data: {
      ...(category !== undefined && { category }),
      ...(altText !== undefined && { altText }),
      ...(isCover !== undefined && { isCover: Boolean(isCover) }),
      ...(sortOrder !== undefined && { sortOrder: Number(sortOrder) }),
    },
  });
  res.json(updated);
};

exports.ownerDeleteGalleryPhoto = async (req, res) => {
  const ownerId = req.user.ownerProfile?.id;
  if (!ownerId) throw createError('Owner profile not found', 403);
  const { id } = req.params;

  const existing = await prisma.propertyMedia.findUnique({ where: { id } });
  if (!existing) throw createError('Photo not found', 404);
  await assertOwnsProperty(ownerId, existing.propertyId);

  await prisma.propertyMedia.delete({ where: { id } });
  res.json({ message: 'Photo deleted' });
};

// ── ADMIN ─────────────────────────────────────────────────────────────────────

exports.adminGetAllWeddingPackages = async (req, res) => {
  const { propertyId, ceremonyType, isActive, page = 1, limit = 20 } = req.query;
  const where = {};
  if (propertyId) where.propertyId = propertyId;
  if (ceremonyType) where.ceremonyType = ceremonyType;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const [packages, total] = await Promise.all([
    prisma.weddingPackage.findMany({
      where,
      include: { property: { select: { id: true, name: true, owner: { select: { fullName: true, businessName: true } } } } },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    }),
    prisma.weddingPackage.count({ where }),
  ]);
  res.json({ packages, total });
};

exports.adminGetAllPhotographyServices = async (req, res) => {
  const { propertyId, serviceType, isActive } = req.query;
  const where = {};
  if (propertyId) where.propertyId = propertyId;
  if (serviceType) where.serviceType = serviceType;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const services = await prisma.photographyService.findMany({
    where,
    include: { property: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(services);
};

exports.adminGetAllDecorationServices = async (req, res) => {
  const { propertyId, serviceType, isActive } = req.query;
  const where = {};
  if (propertyId) where.propertyId = propertyId;
  if (serviceType) where.serviceType = serviceType;
  if (isActive !== undefined) where.isActive = isActive === 'true';

  const services = await prisma.decorationPackage.findMany({
    where,
    include: { property: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(services);
};

exports.adminToggleWeddingPackage = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;
  const pkg = await prisma.weddingPackage.findUnique({ where: { id } });
  if (!pkg) throw createError('Package not found', 404);
  const updated = await prisma.weddingPackage.update({ where: { id }, data: { isActive: Boolean(isActive) } });
  res.json(updated);
};

exports.adminGetOverview = async (req, res) => {
  const [totalWeddingPkgs, activeWeddingPkgs, totalPhotography, totalDecoration] = await Promise.all([
    prisma.weddingPackage.count(),
    prisma.weddingPackage.count({ where: { isActive: true } }),
    prisma.photographyService.count({ where: { isActive: true } }),
    prisma.decorationPackage.count({ where: { isActive: true } }),
  ]);
  res.json({ totalWeddingPkgs, activeWeddingPkgs, totalPhotography, totalDecoration });
};

exports.CEREMONY_TYPES = CEREMONY_TYPES;
exports.PHOTO_SERVICE_TYPES = PHOTO_SERVICE_TYPES;
exports.DECOR_SERVICE_TYPES = DECOR_SERVICE_TYPES;
exports.GALLERY_CATEGORIES = GALLERY_CATEGORIES;
