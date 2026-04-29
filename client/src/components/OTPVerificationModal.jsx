import React, { useState, useEffect } from 'react';
import { Phone, Mail, Clock, ArrowRight, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

const OTPVerificationModal = ({ email, phone, onOTPVerified, onCancel }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(600); // 10 minutes
  const [otpSent, setOtpSent] = useState(false);
  const [step, setStep] = useState('send'); // 'send', 'verify', 'verified'

  // Timer countdown
  useEffect(() => {
    if (!otpSent || timer <= 0) return;
    
    const interval = setInterval(() => {
      setTimer(t => t - 1);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [otpSent, timer]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSendOTP = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/api/auth/send-otp', {
        email: email.toLowerCase(),
        phone: phone
      });

      if (res.data.success) {
        setOtpSent(true);
        setStep('verify');
        setTimer(600);
        toast.success('OTP sent to your email!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
      toast.error('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/api/api/auth/verify-otp', {
        email: email.toLowerCase(),
        otp: otp
      });

      if (res.data.success) {
        setStep('verified');
        toast.success('Phone verified successfully!');
        setTimeout(() => {
          onOTPVerified();
        }, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
      toast.error('Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/api/auth/resend-otp', {
        email: email.toLowerCase()
      });

      if (res.data.success) {
        setTimer(600);
        setOtp('');
        toast.success('New OTP sent!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
      toast.error('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <Phone className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Verify Phone</h2>
          </div>
          <p className="text-green-100 text-sm">Secure verification via email</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Step 1: Send OTP */}
          {step === 'send' && (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-blue-900 dark:text-blue-100">Email Verification</p>
                    <p className="text-blue-700 dark:text-blue-300 text-xs mt-1">
                      We'll send a 6-digit OTP to <strong>{email}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  disabled
                  className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 cursor-not-allowed"
                />
              </div>

              <button
                onClick={handleSendOTP}
                disabled={loading}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Sending...' : <><Phone className="w-4 h-4" /> Send OTP to Email</>}
              </button>
            </>
          )}

          {/* Step 2: Verify OTP */}
          {step === 'verify' && (
            <>
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                  Enter the 6-digit code sent to <strong>{email}</strong>
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start gap-2">
                <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-100">
                    Time remaining: <span className="text-lg">{formatTime(timer)}</span>
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                    OTP expires in 10 minutes
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setOtp(val);
                    setError('');
                  }}
                  placeholder="000000"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-center text-2xl font-bold tracking-widest bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : <><ArrowRight className="w-4 h-4" /> Verify OTP</>}
              </button>

              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Didn't receive the code?
                </p>
                <button
                  onClick={handleResendOTP}
                  disabled={loading || timer > 300}
                  className="text-green-600 dark:text-green-400 hover:text-green-700 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {timer > 300 ? `Resend in ${formatTime(timer - 300)}` : 'Resend OTP'}
                </button>
              </div>
            </>
          )}

          {/* Step 3: Success */}
          {step === 'verified' && (
            <div className="text-center py-6">
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">✓</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Verified!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Your phone number has been verified successfully.
              </p>
            </div>
          )}

          {/* Cancel button */}
          {step !== 'verified' && (
            <button
              onClick={onCancel}
              disabled={loading}
              className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OTPVerificationModal;
