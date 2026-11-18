const bcrypt = require('bcryptjs');
const { prisma } = require('../utils/prisma');
const { signToken, signRefreshToken, verifyToken } = require('../utils/jwt');
const { generateOtp, storeOtp, verifyOtp: checkOtp, sendSmsOtp } = require('../utils/otp');
const { createError } = require('../middleware/errorHandler');

exports.register = async (req, res) => {
  const { fullName, email, phone, password, role, businessName, ownerType, address, city, state, pinCode } = req.body;

  // Owner accounts are created exclusively by admin
  if (role === 'OWNER') {
    throw createError('Owner accounts can only be created by an administrator', 403);
  }

  // Uniqueness checks
  const [byEmail, byPhone] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { phone } }),
  ]);
  if (byEmail) throw createError('Email address is already registered', 409);
  if (byPhone) throw createError('Mobile number is already registered', 409);

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      phone,
      email,
      role,
      passwordHash,
      customerProfile: role === 'CUSTOMER' ? {
        create: {
          fullName,
          address: address || null,
          city: city || null,
          state: state || null,
          pinCode: pinCode || null,
        },
      } : undefined,
      ownerProfile: role === 'OWNER' ? {
        create: {
          fullName,
          businessName: businessName || fullName,
          address: address || '',
          ownerType: ownerType || 'GENERAL',
        },
      } : undefined,
    },
  });

  const token = signToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);
  const { passwordHash: _ph, ...safeUser } = user;
  res.status(201).json({ token, refreshToken, role: user.role, user: safeUser });
};

exports.login = async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password) throw createError('Email/mobile and password are required', 400);

  // Find by email or phone
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase().trim() },
        { phone: identifier.trim() },
      ],
      NOT: { role: 'ADMIN' },
    },
    include: {
      customerProfile: true,
      ownerProfile: true,
    },
  });

  if (!user || !user.passwordHash) throw createError('Invalid email/mobile or password', 401);
  if (user.status !== 'ACTIVE') throw createError('Your account has been suspended', 403);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw createError('Invalid email/mobile or password', 401);

  const token = signToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);
  const { passwordHash, ...safeUser } = user;
  res.json({ token, refreshToken, role: user.role, user: safeUser });
};

exports.sendOtp = async (req, res) => {
  const { phone } = req.body;
  const otp = generateOtp();
  storeOtp(phone, otp);
  await sendSmsOtp(phone, otp);
  res.json({ message: 'OTP sent successfully' });
};

exports.verifyOtp = async (req, res) => {
  const { phone, otp, role, name, email, address, city, state, pinCode, ownerType, businessName } = req.body;

  if (!checkOtp(phone, otp)) {
    throw createError('Invalid or expired OTP', 400);
  }

  let user = await prisma.user.findUnique({ where: { phone } });
  const isNewUser = !user;

  if (!user) {
    user = await prisma.user.create({
      data: {
        phone,
        role: role || 'CUSTOMER',
        email: email || null,
        passwordHash: '',
        customerProfile: (role === 'CUSTOMER' || !role) ? {
          create: {
            fullName: name || 'User',
            address: address || null,
            city: city || null,
            state: state || null,
            pinCode: pinCode || null,
          },
        } : undefined,
        ownerProfile: role === 'OWNER' ? {
          create: {
            fullName: name || 'Owner',
            businessName: businessName || name || 'Business',
            address: address || '',
            ownerType: ownerType || 'GENERAL',
          },
        } : undefined,
      },
    });
  }

  if (user.status !== 'ACTIVE') throw createError('Account is suspended', 403);

  const token = signToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);

  const { passwordHash: _ph, ...safeUser } = user;
  res.json({ token, refreshToken, role: user.role, user: safeUser, isNewUser });
};

exports.adminLogin = async (req, res) => {
  const { password } = req.body;
  const email = req.body.email?.toLowerCase().trim();

  const user = await prisma.user.findFirst({
    where: { email, role: 'ADMIN' },
    include: { adminProfile: true },
  });

  if (!user) throw createError('Invalid credentials', 401);
  if (user.status !== 'ACTIVE') throw createError('Account is suspended', 403);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw createError('Invalid credentials', 401);

  const token = signToken(user.id, user.role);
  const refreshToken = signRefreshToken(user.id);

  const { passwordHash, ...safeUser } = user;
  res.json({ token, refreshToken, role: user.role, user: safeUser });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await prisma.user.findFirst({ where: { email: email?.toLowerCase().trim() } });
  // Always return success to prevent user enumeration
  if (!user) return res.json({ message: 'If that email exists, a reset OTP has been sent.' });

  const { generateOtp, storeOtp } = require('../utils/otp');
  const otp = generateOtp();
  storeOtp(`reset:${user.id}`, otp);

  // In production, send via email. Here we return it in dev mode.
  const isDev = process.env.NODE_ENV !== 'production';
  res.json({
    message: 'Reset OTP sent. Check your email.',
    ...(isDev ? { _devOtp: otp } : {}),
  });
};

exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) throw createError('Email, OTP, and new password are required', 400);
  if (newPassword.length < 8) throw createError('Password must be at least 8 characters', 400);

  const user = await prisma.user.findFirst({ where: { email: email.toLowerCase().trim() } });
  if (!user) throw createError('Invalid request', 400);

  const { verifyOtp: checkOtp } = require('../utils/otp');
  if (!checkOtp(`reset:${user.id}`, otp)) throw createError('Invalid or expired OTP', 400);

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  res.json({ message: 'Password reset successfully. Please sign in.' });
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw createError('Refresh token required', 400);

  const decoded = verifyToken(refreshToken);
  if (decoded.type !== 'refresh') throw createError('Invalid token type', 400);

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, role: true, status: true },
  });

  if (!user || user.status !== 'ACTIVE') throw createError('User not found or inactive', 401);

  const newToken = signToken(user.id, user.role);
  res.json({ token: newToken });
};

exports.logout = async (req, res) => {
  res.json({ message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      customerProfile: req.user.role === 'CUSTOMER',
      ownerProfile: req.user.role === 'OWNER',
      adminProfile: req.user.role === 'ADMIN',
    },
  });
  res.json(user);
};
