import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';
import PageTransition from '../components/PageTransition';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Reset token is missing. Please use the email link again.');
    }
  }, [token]);

  const handleChange = (event) => {
    setFormData((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!token) {
      setError('Reset token is missing.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', {
        token,
        newPassword: formData.password
      });
      setCompleted(true);
      toast.success('Password updated successfully.');
      setTimeout(() => navigate('/login'), 1800);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-[92vh] flex items-center justify-center bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8">
            {completed ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Password reset complete</h1>
                <p className="mt-3 text-gray-500 dark:text-gray-400">You can now sign in with your new password.</p>
                <Link to="/login" className="inline-flex items-center gap-2 mt-6 text-green-600 dark:text-green-400 font-semibold hover:text-green-700">
                  <ArrowLeft className="w-4 h-4" /> Back to login
                </Link>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
                    <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reset your password</h1>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">Choose a new password for your account.</p>
                </div>

                {error && (
                  <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">New Password</label>
                    <input
                      type="password"
                      name="password"
                      className="input-field"
                      placeholder="Enter a new password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      className="input-field"
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !token}
                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 py-3.5 font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? 'Updating...' : 'Update password'}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  Remembered it already?{' '}
                  <Link to="/login" className="font-semibold text-green-600 dark:text-green-400 hover:text-green-700">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default ResetPassword;
