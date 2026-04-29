import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, Sprout, Shield, Eye, EyeOff, Mail, CheckCircle, RefreshCw } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import api from '../services/api';
import { toast } from 'react-toastify';
import { AuthContext } from '../context/AuthContext';
import { BrandLogo, BrandWordmark } from '../components/BrandAssets';

const Login = () => {
  const [activeTab, setActiveTab] = useState('farmer');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // OTP verification states
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  const navigate = useNavigate();
  const { setSession } = useContext(AuthContext);

  const tabs = [
    { id: 'farmer', label: 'Farmer', icon: Sprout, color: 'nature' },
    { id: 'expert', label: 'Expert', icon: Leaf, color: 'violet' },
    { id: 'admin', label: 'Admin', icon: Shield, color: 'amber' }
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post(`/api/auth/${activeTab}/login`, {
        email: formData.email,
        password: formData.password
      });

      // If OTP verification is required, show OTP step
      if (response.data.requiresOTPVerification) {
        // Admin should never need OTP
        if (activeTab === 'admin') {
          throw new Error('Admin login should not require OTP. Please try again.');
        }
        setOtpStep(true);
        toast.success('OTP sent to your email!');
      } else if (response.data.data?.token) {
        // Direct login with tokens (for admin - no OTP)
        setSession(response.data.data);
        toast.success('Login successful!');
        
        // Redirect based on role
        const redirectPath = response.data.data.role === 'admin' 
          ? '/admin-dashboard' 
          : response.data.data.role === 'expert'
          ? '/expert-dashboard'
          : '/user-dashboard';
        navigate(redirectPath);
      }
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      const localMessage = err.message;
      const message = serverMessage || localMessage || 'Invalid credentials. Please try again.';

      // If user picked wrong tab, guide them (and optionally auto-switch)
      const mismatchMatch = typeof message === 'string'
        ? message.match(/registered as (\w+), not (\w+)/i)
        : null;
      const actualRole = mismatchMatch?.[1]?.toLowerCase();
      if (actualRole && ['farmer', 'expert', 'admin'].includes(actualRole) && actualRole !== activeTab) {
        setActiveTab(actualRole);
        toast.info(`This account is a ${actualRole}. Switched login tab.`);
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setOtpError('');
    
    if (!otp || otp.length !== 6) {
      return setOtpError('Please enter a valid 6-digit OTP');
    }

    setOtpLoading(true);
    try {
      const response = await api.post('/api/auth/verify-login-otp', {
        email: formData.email,
        otp
      });

      // Store tokens and user data
      setSession(response.data.data);
      
      toast.success('Login successful!');
      
      // Redirect based on role
      const redirectPath = response.data.data.role === 'admin' 
        ? '/admin-dashboard' 
        : response.data.data.role === 'expert'
        ? '/expert-dashboard'
        : '/user-dashboard';
      navigate(redirectPath);
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtpLoading(true);
    try {
      await api.post('/api/auth/resend-otp', { email: formData.email });
      setOtp('');
      toast.success('OTP resent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const gradients = {
    farmer: 'from-green-600 to-emerald-700',
    expert: 'from-violet-600 to-purple-700',
    admin: 'from-amber-600 to-orange-700'
  };

  // OTP verification step
  if (otpStep) {
    return (
      <PageTransition>
        <div className="min-h-[92vh] flex items-center justify-center bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-12 px-4 transition-colors">
          <div className="max-w-md w-full">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <Mail className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Verify with OTP</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">We've sent an OTP to</p>
              <p className="font-semibold text-gray-900 dark:text-white break-all">{formData.email}</p>
            </div>

            {/* Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden p-8">
              {otpError && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm">
                  ⚠️ {otpError}
                </div>
              )}

              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Enter OTP</label>
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center text-2xl tracking-widest font-bold py-4 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:border-green-500 dark:focus:border-green-400 focus:outline-none transition-colors bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">OTP valid for 10 minutes</p>
                </div>

                <button
                  type="submit"
                  disabled={otpLoading || otp.length !== 6}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {otpLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Verify & Login
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOtpStep(false);
                    setOtp('');
                    setOtpError('');
                  }}
                  disabled={loading}
                  className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  Back to Login
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Didn't receive OTP?{' '}
                  <button
                    onClick={handleResendOTP}
                    disabled={otpLoading}
                    className="font-semibold text-green-600 dark:text-green-400 hover:text-green-700 disabled:opacity-50"
                  >
                    {otpLoading ? 'Resending...' : 'Resend'}
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-[92vh] flex items-center justify-center bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-12 px-4 transition-colors">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className={`h-14 w-14 bg-gradient-to-br ${gradients[activeTab]} rounded-2xl flex items-center justify-center shadow-lg`}>
                <BrandLogo className="h-9 w-9" alt="Farmix login logo" />
              </div>
            </div>
            <div className="flex justify-center">
              <BrandWordmark className="h-10 sm:h-12" alt="Farmix login brand name" />
            </div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Sign in to your account</p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b border-gray-100 dark:border-gray-700">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setError(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-all duration-300 border-b-2 ${
                      activeTab === tab.id
                        ? `border-${tab.color === 'nature' ? 'green' : tab.color}-500 text-${tab.color === 'nature' ? 'green' : tab.color}-600 dark:text-${tab.color === 'nature' ? 'green' : tab.color}-400 bg-${tab.color === 'nature' ? 'green' : tab.color}-50/50 dark:bg-${tab.color === 'nature' ? 'green' : tab.color}-900/10`
                        : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                    style={activeTab === tab.id ? {
                      borderBottomColor: tab.id === 'farmer' ? '#16a34a' : tab.id === 'expert' ? '#7c3aed' : '#d97706',
                      color: tab.id === 'farmer' ? '#16a34a' : tab.id === 'expert' ? '#7c3aed' : '#d97706'
                    } : {}}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Form */}
            <div className="p-8">
              {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="input-field"
                    placeholder={activeTab === 'expert' ? 'expert@example.com' : activeTab === 'admin' ? 'info.farmix@gmail.com' : 'farmer@example.com'}
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Password</label>
                  <div className="relative">
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      className="input-field pr-12"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-700">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r ${gradients[activeTab]} hover:shadow-xl`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Signing in...
                    </span>
                  ) : `Sign in as ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`}
                </button>
              </form>

              {activeTab !== 'admin' && (
                <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  Don't have an account?{' '}
                  <Link to="/register" className="font-semibold text-green-600 dark:text-green-400 hover:text-green-700">
                    Create account
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Login;
