const crypto = require('crypto');

// In-memory OTP store — replace with Redis in production
const otpStore = new Map();

const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const storeOtp = (phone, otp) => {
  otpStore.set(phone, { otp, expiresAt: Date.now() + OTP_EXPIRY_MS });
};

const verifyOtp = (phone, otp) => {
  const record = otpStore.get(phone);
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    otpStore.delete(phone);
    return false;
  }
  if (record.otp !== otp) return false;
  otpStore.delete(phone);
  return true;
};

const sendSmsOtp = async (phone, otp) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[OTP] Phone: ${phone} | OTP: ${otp}`);
    return;
  }
  // TODO: integrate Msg91 / Twilio / Fast2SMS
  throw new Error('SMS service not configured');
};

module.exports = { generateOtp, storeOtp, verifyOtp, sendSmsOtp };
