import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const STEPS = { EMAIL: 'EMAIL', OTP: 'OTP', DONE: 'DONE' };

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  const sendOtp = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      if (data._devOtp) setDevOtp(data._devOtp);
      toast.success('OTP sent to your email');
      setStep(STEPS.OTP);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetPwd = async (e) => {
    e.preventDefault();
    if (!otp || !newPwd || newPwd.length < 8) return;
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword: newPwd });
      toast.success('Password reset! Please sign in.');
      setStep(STEPS.DONE);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid OTP or error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src="/logo.png" alt="Mandap & Resort Booking" className="h-16 w-auto object-contain mx-auto" />
          </Link>
          <p className="text-gray-500 text-sm mt-3">Reset your password</p>
        </div>

        <div className="card p-8">
          {step === STEPS.EMAIL && (
            <form onSubmit={sendOtp} className="space-y-5">
              <div>
                <h2 className="font-display text-lg font-semibold text-gray-900 mb-1">Forgot your password?</h2>
                <p className="text-sm text-gray-500">Enter your registered email address and we'll send you an OTP.</p>
              </div>
              <div>
                <label className="label" htmlFor="email">Email Address *</label>
                <input id="email" type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" className="input" autoFocus />
              </div>
              <button type="submit" disabled={!email || loading} className="btn-primary w-full">
                {loading ? 'Sending OTP…' : 'Send Reset OTP'}
              </button>
              <p className="text-center text-sm text-gray-500">
                Remember your password?{' '}
                <Link to="/login" className="text-forest-600 font-medium hover:underline">Sign in</Link>
              </p>
            </form>
          )}

          {step === STEPS.OTP && (
            <form onSubmit={resetPwd} className="space-y-5">
              <div>
                <h2 className="font-display text-lg font-semibold text-gray-900 mb-1">Enter OTP</h2>
                <p className="text-sm text-gray-500">A 6-digit OTP was sent to <strong>{email}</strong>.</p>
                {devOtp && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-700">
                    Dev mode OTP: <strong>{devOtp}</strong>
                  </div>
                )}
              </div>
              <div>
                <label className="label" htmlFor="otp">6-Digit OTP *</label>
                <input id="otp" type="text" value={otp} maxLength={6}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456" className="input tracking-widest text-center text-lg" autoFocus />
              </div>
              <div>
                <label className="label" htmlFor="newpwd">New Password *</label>
                <div className="relative">
                  <input id="newpwd" type={showPwd ? 'text' : 'password'} value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    placeholder="Minimum 8 characters" className="input pr-10" />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                  </button>
                </div>
                {newPwd && newPwd.length < 8 && <p className="text-xs text-red-500 mt-1">At least 8 characters</p>}
              </div>
              <button type="submit" disabled={otp.length < 6 || newPwd.length < 8 || loading} className="btn-primary w-full">
                {loading ? 'Resetting…' : 'Reset Password'}
              </button>
              <button type="button" onClick={() => setStep(STEPS.EMAIL)} className="text-sm text-gray-500 hover:text-gray-700 w-full text-center">
                ← Change email
              </button>
            </form>
          )}

          {step === STEPS.DONE && (
            <div className="text-center space-y-4 py-4">
              <div className="text-5xl">✅</div>
              <h2 className="font-display text-lg font-semibold text-gray-900">Password Reset!</h2>
              <p className="text-sm text-gray-500">Your password has been updated. You can now sign in with your new password.</p>
              <button onClick={() => navigate('/login')} className="btn-primary w-full">Go to Sign In</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
