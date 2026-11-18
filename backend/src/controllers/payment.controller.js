const Razorpay = require('razorpay');
const crypto = require('crypto');
const { prisma } = require('../utils/prisma');
const { createError } = require('../middleware/errorHandler');
const { audit } = require('../utils/audit');

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID) {
    throw new Error('Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

exports.createOrder = async (req, res) => {
  const { bookingId } = req.body;
  const customer = await prisma.customerProfile.findUnique({ where: { userId: req.user.id } });
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, customerId: customer.id, status: 'PENDING_PAYMENT' },
  });
  if (!booking) throw createError('Booking not found or not ready for payment', 404);

  const amountPaise = Math.round(Number(booking.advanceAmount) * 100);
  const order = await getRazorpay().orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: `booking_${bookingId}`,
    notes: { bookingId },
  });

  const payment = await prisma.payment.create({
    data: {
      bookingId,
      razorpayOrderId: order.id,
      amount: booking.advanceAmount,
      isAdvance: true,
      status: 'PENDING',
    },
  });

  res.json({ orderId: order.id, amount: amountPaise, currency: 'INR', paymentId: payment.id });
};

exports.verifyPayment = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = req.body;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    throw createError('Payment verification failed', 400);
  }

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw createError('Payment record not found', 404);

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: { razorpayPaymentId, status: 'CAPTURED', paidAt: new Date() },
    });
    await tx.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
    });

    // Platform commission
    const config = await tx.platformConfig.findUnique({ where: { key: 'commission_percent' } });
    const ratePercent = config?.value?.value ?? Number(process.env.PLATFORM_COMMISSION_PERCENT ?? 10);
    const commissionAmount = Number(((Number(payment.amount) * ratePercent) / 100).toFixed(2));
    await tx.commission.create({
      data: { paymentId, ratePercent, amount: commissionAmount },
    });
  });

  await audit({
    userId: req.user.id,
    action: 'PAYMENT_CAPTURED',
    entity: 'payment',
    entityId: paymentId,
    after: { razorpayPaymentId },
    ipAddress: req.ip,
  });

  res.json({ message: 'Payment verified and booking confirmed' });
};

exports.handleWebhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ message: 'Invalid webhook signature' });
  }

  const event = JSON.parse(req.body.toString());
  if (event.event === 'payment.failed') {
    const orderId = event.payload.payment.entity.order_id;
    await prisma.payment.updateMany({
      where: { razorpayOrderId: orderId },
      data: { status: 'FAILED' },
    });
  }

  res.json({ received: true });
};

exports.getPaymentHistory = async (req, res) => {
  const customer = await prisma.customerProfile.findUnique({ where: { userId: req.user.id } });
  const payments = await prisma.payment.findMany({
    where: { booking: { customerId: customer.id } },
    include: { booking: { select: { eventDate: true, property: { select: { name: true } } } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(payments);
};
