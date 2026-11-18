const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── PUBLIC / CUSTOMER ────────────────────────────────────────────────────────

const getMenuCategories = async (req, res) => {
  const { isVeg } = req.query;
  const where = { isActive: true };
  if (isVeg !== undefined) {
    const vegBool = isVeg === 'true';
    // Return categories that apply to this preference: shared (null) + specific (matching)
    where.OR = [{ isVeg: null }, { isVeg: vegBool }];
  }
  const categories = await prisma.menuCategory.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
  });
  res.json(categories);
};

const getMenuItems = async (req, res) => {
  const { categoryId, menuType, isVeg } = req.query;
  const where = { isActive: true };
  if (categoryId) where.categoryId = categoryId;
  if (menuType && menuType !== 'BOTH') {
    where.OR = [{ menuType: menuType }, { menuType: 'BOTH' }];
  }
  if (isVeg !== undefined) where.isVeg = isVeg === 'true';

  const items = await prisma.menuItem.findMany({
    where,
    include: { category: { select: { id: true, name: true } } },
    orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
  });
  res.json(items);
};

const getMenuPackages = async (req, res) => {
  const { menuType, isVeg } = req.query;
  const where = { isActive: true };
  if (menuType && menuType !== 'BOTH') {
    where.OR = [{ menuType: menuType }, { menuType: 'BOTH' }];
  }
  if (isVeg !== undefined) where.isVeg = isVeg === 'true';

  const packages = await prisma.menuPackage.findMany({ where, orderBy: { name: 'asc' } });
  res.json(packages);
};

const saveMenuSelection = async (req, res) => {
  const { bookingId, roomBookingId, packageId, selectedItems, guestCount, isVeg, totalCost, notes } = req.body;

  if (!bookingId && !roomBookingId) {
    return res.status(400).json({ message: 'Either bookingId or roomBookingId is required' });
  }
  if (!guestCount || guestCount < 1) {
    return res.status(400).json({ message: 'Guest count must be at least 1' });
  }

  // Look up customer profile directly (consistent with booking/payment controllers)
  let customer = await prisma.customerProfile.findUnique({ where: { userId: req.user.id } });

  // Auto-create a minimal profile for CUSTOMER users who registered before this was enforced
  if (!customer && req.user.role === 'CUSTOMER') {
    customer = await prisma.customerProfile.create({
      data: {
        userId: req.user.id,
        fullName: req.user.email || req.user.phone || 'Customer',
      },
    });
  }

  if (!customer) return res.status(403).json({ message: 'Customer profile required' });
  const customerId = customer.id;

  if (bookingId) {
    const booking = await prisma.booking.findFirst({ where: { id: bookingId, customerId } });
    if (!booking) return res.status(403).json({ message: 'Booking not found or access denied' });
  }
  if (roomBookingId) {
    const booking = await prisma.roomBooking.findFirst({ where: { id: roomBookingId, customerId } });
    if (!booking) return res.status(403).json({ message: 'Room booking not found or access denied' });
  }

  // Upsert: one selection per booking
  const whereClause = bookingId ? { bookingId } : { roomBookingId };
  const existing = await prisma.bookingMenuSelection.findFirst({ where: whereClause });

  const data = {
    packageId: packageId || null,
    selectedItems: selectedItems || [],
    guestCount: parseInt(guestCount),
    isVeg: Boolean(isVeg),
    totalCost: parseFloat(totalCost) || 0,
    notes: notes || null,
  };

  let selection;
  if (existing) {
    selection = await prisma.bookingMenuSelection.update({ where: { id: existing.id }, data });
  } else {
    selection = await prisma.bookingMenuSelection.create({
      data: {
        ...data,
        bookingId: bookingId || null,
        roomBookingId: roomBookingId || null,
      },
    });
  }

  res.json(selection);
};

const getMenuSelection = async (req, res) => {
  const { bookingId, roomBookingId } = req.query;
  if (!bookingId && !roomBookingId) {
    return res.status(400).json({ message: 'bookingId or roomBookingId required' });
  }

  const whereClause = bookingId ? { bookingId } : { roomBookingId };
  const selection = await prisma.bookingMenuSelection.findFirst({ where: whereClause });

  if (!selection) return res.status(404).json({ message: 'No menu selection found' });
  res.json(selection);
};

// ─── ADMIN ────────────────────────────────────────────────────────────────────

const adminGetCategories = async (req, res) => {
  const cats = await prisma.menuCategory.findMany({
    orderBy: { sortOrder: 'asc' },
    include: { _count: { select: { items: true } } },
  });
  res.json(cats);
};

const adminCreateCategory = async (req, res) => {
  const { name, sortOrder } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });
  const cat = await prisma.menuCategory.create({ data: { name, sortOrder: parseInt(sortOrder) || 0 } });
  res.status(201).json(cat);
};

const adminUpdateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, sortOrder, isActive } = req.body;
  const cat = await prisma.menuCategory.update({
    where: { id },
    data: { name, sortOrder: sortOrder !== undefined ? parseInt(sortOrder) : undefined, isActive },
  });
  res.json(cat);
};

const adminGetItems = async (req, res) => {
  const { categoryId, menuType, isVeg, page = 1, limit = 50 } = req.query;
  const where = {};
  if (categoryId) where.categoryId = categoryId;
  if (menuType) where.menuType = menuType;
  if (isVeg !== undefined) where.isVeg = isVeg === 'true';

  const [items, total] = await Promise.all([
    prisma.menuItem.findMany({
      where,
      include: { category: { select: { id: true, name: true } } },
      orderBy: [{ categoryId: 'asc' }, { name: 'asc' }],
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
    prisma.menuItem.count({ where }),
  ]);

  res.json({ items, total, page: parseInt(page) });
};

const adminCreateItem = async (req, res) => {
  const { categoryId, name, description, pricePerPlate, isVeg, imageUrl, menuType } = req.body;
  if (!categoryId || !name || !pricePerPlate) {
    return res.status(400).json({ message: 'categoryId, name and pricePerPlate are required' });
  }
  const item = await prisma.menuItem.create({
    data: {
      categoryId,
      name,
      description: description || null,
      pricePerPlate: parseFloat(pricePerPlate),
      isVeg: isVeg !== false && isVeg !== 'false',
      imageUrl: imageUrl || null,
      menuType: menuType || 'BOTH',
    },
    include: { category: { select: { id: true, name: true } } },
  });
  res.status(201).json(item);
};

const adminUpdateItem = async (req, res) => {
  const { id } = req.params;
  const { categoryId, name, description, pricePerPlate, isVeg, imageUrl, menuType, isActive } = req.body;
  const item = await prisma.menuItem.update({
    where: { id },
    data: {
      categoryId,
      name,
      description,
      pricePerPlate: pricePerPlate !== undefined ? parseFloat(pricePerPlate) : undefined,
      isVeg,
      imageUrl,
      menuType,
      isActive,
    },
    include: { category: { select: { id: true, name: true } } },
  });
  res.json(item);
};

const adminDeleteItem = async (req, res) => {
  const { id } = req.params;
  await prisma.menuItem.update({ where: { id }, data: { isActive: false } });
  res.json({ message: 'Item deactivated' });
};

const adminGetPackages = async (req, res) => {
  const packages = await prisma.menuPackage.findMany({ orderBy: [{ menuType: 'asc' }, { name: 'asc' }] });
  res.json(packages);
};

const adminCreatePackage = async (req, res) => {
  const { name, description, packageType, menuType, isVeg, pricePerPlate, itemIds } = req.body;
  if (!name || !packageType || !menuType || !pricePerPlate) {
    return res.status(400).json({ message: 'name, packageType, menuType and pricePerPlate are required' });
  }
  const pkg = await prisma.menuPackage.create({
    data: {
      name,
      description: description || null,
      packageType,
      menuType,
      isVeg: isVeg !== false && isVeg !== 'false',
      pricePerPlate: parseFloat(pricePerPlate),
      itemIds: itemIds || [],
    },
  });
  res.status(201).json(pkg);
};

const adminUpdatePackage = async (req, res) => {
  const { id } = req.params;
  const { name, description, packageType, menuType, isVeg, pricePerPlate, itemIds, isActive } = req.body;
  const pkg = await prisma.menuPackage.update({
    where: { id },
    data: {
      name,
      description,
      packageType,
      menuType,
      isVeg,
      pricePerPlate: pricePerPlate !== undefined ? parseFloat(pricePerPlate) : undefined,
      itemIds,
      isActive,
    },
  });
  res.json(pkg);
};

const adminDeletePackage = async (req, res) => {
  const { id } = req.params;
  await prisma.menuPackage.update({ where: { id }, data: { isActive: false } });
  res.json({ message: 'Package deactivated' });
};

const adminGetAllSelections = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const [selections, total] = await Promise.all([
    prisma.bookingMenuSelection.findMany({
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
    prisma.bookingMenuSelection.count(),
  ]);
  res.json({ selections, total, page: parseInt(page) });
};

module.exports = {
  getMenuCategories, getMenuItems, getMenuPackages,
  saveMenuSelection, getMenuSelection,
  adminGetCategories, adminCreateCategory, adminUpdateCategory,
  adminGetItems, adminCreateItem, adminUpdateItem, adminDeleteItem,
  adminGetPackages, adminCreatePackage, adminUpdatePackage, adminDeletePackage,
  adminGetAllSelections,
};
