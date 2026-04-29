import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Leaf, Eye, EyeOff, User, Briefcase, RefreshCw, Mail, CheckCircle } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import api from '../services/api';
import { toast } from 'react-toastify';
import { BrandLogo, BrandWordmark } from '../components/BrandAssets';

const Register = () => {
  const [activeRole, setActiveRole] = useState('farmer');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // OTP verification states
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [otpError, setOtpError] = useState('');

  const [farmerData, setFarmerData] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '', cropType: '', city: '', state: ''
  });
  const [expertData, setExpertData] = useState({
    name: '', email: '', password: '', confirmPassword: '', phone: '',
    expertiseAreas: '', qualifications: '', experienceYears: '', licenseNumber: '', consultationFee: ''
  });

  const { registerFarmer, registerExpert } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleFarmerChange = (e) => setFarmerData({ ...farmerData, [e.target.name]: e.target.value });
  const handleExpertChange = (e) => setExpertData({ ...expertData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const data = activeRole === 'farmer' ? farmerData : expertData;
    if (data.password !== data.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (data.password.length < 8) {
      return setError('Password must be at least 8 characters');
    }

    setLoading(true);
    try {
      if (activeRole === 'farmer') {
        const response = await registerFarmer({
          name: farmerData.name,
          email: farmerData.email,
          password: farmerData.password,
          phone: farmerData.phone,
          cropType: farmerData.cropType,
          location: { city: farmerData.city, state: farmerData.state }
        });
        setRegisteredEmail(response.data.email);
      } else {
        const response = await registerExpert({
          name: expertData.name,
          email: expertData.email,
          password: expertData.password,
          phone: expertData.phone,
          expertiseAreas: expertData.expertiseAreas.split(',').map(s => s.trim()).filter(Boolean),
          qualifications: expertData.qualifications.split(',').map(s => s.trim()).filter(Boolean),
          experienceYears: parseInt(expertData.experienceYears) || 0,
          licenseNumber: expertData.licenseNumber,
          consultationFee: parseInt(expertData.consultationFee) || 0
        });
        setRegisteredEmail(expertData.email.toLowerCase() || response.data?.email || '');
      }

      setOtp('');
      setOtpError('');
      setOtpStep(true);
      toast.info('OTP sent. Registration tab complete hoga after OTP verification.');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
      await api.post('/api/auth/verify-registration-otp', {
        email: registeredEmail,
        otp
      });

      toast.success(
        activeRole === 'expert'
          ? 'Email verified. Your expert account now waits for admin approval.'
          : 'Email verified. You can now login.'
      );
      setTimeout(() => {
        if (activeRole === 'farmer') {
          navigate('/login?role=farmer');
        } else {
          navigate('/login?role=expert');
        }
      }, 1500);
    } catch (err) {
      setOtpError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtpLoading(true);
    try {
      await api.post('/api/auth/resend-otp', { email: registeredEmail });
      setOtp('');
      toast.success('OTP resent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const getPasswordStrength = (pw) => {
    if (!pw) return { label: '', color: '', width: '0%' };
    let score = 0;
    if (pw.length >= 6) score++;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    const levels = [
      { label: 'Very Weak', color: 'bg-red-500', width: '20%' },
      { label: 'Weak', color: 'bg-orange-500', width: '40%' },
      { label: 'Fair', color: 'bg-yellow-500', width: '60%' },
      { label: 'Good', color: 'bg-blue-500', width: '80%' },
      { label: 'Strong', color: 'bg-green-500', width: '100%' }
    ];
    return levels[Math.min(score, 4)];
  };

  const currentPass = activeRole === 'farmer' ? farmerData.password : expertData.password;
  const strength = getPasswordStrength(currentPass);

  // OTP verification step
  if (otpStep) {
    return (
      <PageTransition>
        <div className="min-h-[92vh] flex items-center justify-center bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-12 px-4 transition-colors">
          <div className="max-w-lg w-full">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <Mail className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Verify Your Email</h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">We've sent an OTP to</p>
              <p className="font-semibold text-gray-900 dark:text-white break-all">{registeredEmail}</p>
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
                      Verify OTP
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
                  Back to Registration
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
        <div className="max-w-lg w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-14 w-14 bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl flex items-center justify-center shadow-lg">
                <BrandLogo className="h-9 w-9" alt="Farmix registration logo" />
              </div>
            </div>
            <div className="flex justify-center">
              <BrandWordmark className="h-10 sm:h-12" alt="Farmix registration brand name" />
            </div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Create your account to get started</p>
          </div>

          {/* Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Role Toggle */}
            <div className="flex p-4 gap-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <button
                onClick={() => { setActiveRole('farmer'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  activeRole === 'farmer'
                    ? 'bg-gradient-to-r from-green-600 to-emerald-700 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-green-300'
                }`}
              >
                <User className="w-4 h-4" /> Farmer
              </button>
              <button
                onClick={() => { setActiveRole('expert'); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  activeRole === 'expert'
                    ? 'bg-gradient-to-r from-violet-600 to-purple-700 text-white shadow-lg'
                    : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-violet-300'
                }`}
              >
                <Briefcase className="w-4 h-4" /> Expert
              </button>
            </div>

            {/* Form */}
            <div className="p-8">
              {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm">
                  ⚠️ {error}
                </div>
              )}

              {activeRole === 'expert' && (
                <div className="mb-6 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-4 text-violet-700 dark:text-violet-300 text-sm flex items-start gap-2">
                  <Leaf className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Expert accounts require admin approval before activation. You'll be notified via email.</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* FARMER FORM */}
                {activeRole === 'farmer' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                        <input name="name" type="text" required className="input-field" placeholder="Ramesh Kumar" value={farmerData.name} onChange={handleFarmerChange} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
                        <input name="phone" type="tel" className="input-field" placeholder="+91 98765 43210" value={farmerData.phone} onChange={handleFarmerChange} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                      <input name="email" type="email" required className="input-field" placeholder="farmer@example.com" value={farmerData.email} onChange={handleFarmerChange} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">City</label>
                        <input name="city" type="text" className="input-field" placeholder="Lucknow" value={farmerData.city} onChange={handleFarmerChange} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">State</label>
                        <input name="state" type="text" className="input-field" placeholder="Uttar Pradesh" value={farmerData.state} onChange={handleFarmerChange} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Primary Crop</label>
                      <select name="cropType" className="input-field" value={farmerData.cropType} onChange={handleFarmerChange}>
                        <option value="">Select crop (optional)</option>
                        <option value="wheat">🌾 Wheat</option>
                        <option value="rice">🍚 Rice</option>
                        <option value="sugarcane">🎋 Sugarcane</option>
                        <option value="tomato">🍅 Tomato</option>
                        <option value="potato">🥔 Potato</option>
                        <option value="cotton">☁️ Cotton</option>
                        <option value="corn">🌽 Corn</option>
                        <option value="soybean">🫘 Soybean</option>
                        <option value="other">📦 Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                      <div className="relative">
                        <input name="password" type={showPassword ? 'text' : 'password'} required className="input-field pr-12" placeholder="Min. 8 characters" value={farmerData.password} onChange={handleFarmerChange} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {currentPass && (
                        <div className="mt-2">
                          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full ${strength.color} transition-all duration-500 rounded-full`} style={{ width: strength.width }} />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{strength.label}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
                      <input name="confirmPassword" type="password" required className="input-field" placeholder="••••••••" value={farmerData.confirmPassword} onChange={handleFarmerChange} />
                    </div>
                  </>
                )}

                {/* EXPERT FORM */}
                {activeRole === 'expert' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
                        <input name="name" type="text" required className="input-field" placeholder="Dr. Rajesh Kumar" value={expertData.name} onChange={handleExpertChange} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phone</label>
                        <input name="phone" type="tel" className="input-field" placeholder="+91 98765 43210" value={expertData.phone} onChange={handleExpertChange} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email Address</label>
                      <input name="email" type="email" required className="input-field" placeholder="expert@example.com" value={expertData.email} onChange={handleExpertChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Expertise Areas</label>
                      <input name="expertiseAreas" type="text" required className="input-field" placeholder="Vegetable Farming, Pest Management, Soil Testing" value={expertData.expertiseAreas} onChange={handleExpertChange} />
                      <p className="text-xs text-gray-400 mt-1">Separate with commas</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Experience (years)</label>
                        <input name="experienceYears" type="number" min="0" className="input-field" placeholder="10" value={expertData.experienceYears} onChange={handleExpertChange} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Consultation Fee (₹)</label>
                        <input name="consultationFee" type="number" min="0" className="input-field" placeholder="500" value={expertData.consultationFee} onChange={handleExpertChange} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">License Number</label>
                        <input name="licenseNumber" type="text" className="input-field" placeholder="AGR-12345" value={expertData.licenseNumber} onChange={handleExpertChange} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Qualifications</label>
                        <input name="qualifications" type="text" className="input-field" placeholder="PhD, MSc Agri" value={expertData.qualifications} onChange={handleExpertChange} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
                      <div className="relative">
                        <input name="password" type={showPassword ? 'text' : 'password'} required className="input-field pr-12" placeholder="Min. 8 characters" value={expertData.password} onChange={handleExpertChange} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {currentPass && (
                        <div className="mt-2">
                          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full ${strength.color} transition-all duration-500 rounded-full`} style={{ width: strength.width }} />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{strength.label}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Confirm Password</label>
                      <input name="confirmPassword" type="password" required className="input-field" placeholder="••••••••" value={expertData.confirmPassword} onChange={handleExpertChange} />
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed bg-gradient-to-r ${
                    activeRole === 'farmer' ? 'from-green-600 to-emerald-700' : 'from-violet-600 to-purple-700'
                  } hover:shadow-xl`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Creating account...
                    </span>
                  ) : activeRole === 'farmer' ? 'Create Farmer Account' : 'Apply as Expert'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-green-600 dark:text-green-400 hover:text-green-700">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Register;
