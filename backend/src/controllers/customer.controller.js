const { prisma } = require('../utils/prisma');

exports.getProfile = async (req, res) => {
  const profile = await prisma.customerProfile.findUnique({
    where: { userId: req.user.id },
    include: { user: { select: { phone: true, email: true } } },
  });
  res.json(profile);
};

exports.updateProfile = async (req, res) => {
  const { fullName, address, preferences } = req.body;
  const profile = await prisma.customerProfile.update({
    where: { userId: req.user.id },
    data: { fullName, address, preferences },
  });
  res.json(profile);
};

exports.getNotifications = async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(notifications);
};

exports.markNotificationRead = async (req, res) => {
  await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
  res.json({ success: true });
};

exports.markAllNotificationsRead = async (req, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user.id, isRead: false },
    data: { isRead: true },
  });
  res.json({ success: true });
};
