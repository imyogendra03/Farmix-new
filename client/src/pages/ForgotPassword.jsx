import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import PageTransition from '../components/PageTransition';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/api/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-[92vh] flex items-center justify-center bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
            {sent ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check Your Email</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  If an account with <strong>{email}</strong> exists, we've sent a password reset link.
                </p>
                <p className="text-sm text-gray-400">The link expires in 30 minutes.</p>
                <Link to="/login" className="inline-flex items-center gap-2 mt-6 text-green-600 dark:text-green-400 font-semibold hover:text-green-700">
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
                    <Mail className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Forgot Password?</h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-2">Enter your email and we'll send a reset link</p>
                </div>

                {error && (
                  <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-red-600 dark:text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                    <input
                      type="email"
                      required
                      className="input-field"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 disabled:opacity-60"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>
                <Link to="/login" className="flex items-center justify-center gap-2 mt-6 text-gray-500 dark:text-gray-400 hover:text-green-600 text-sm font-medium">
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default ForgotPassword;
