import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';
import PageTransition from '../components/PageTransition';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token is missing. Please use the email link again.');
        return;
      }

      try {
        await api.post('/api/api/auth/verify-email', { token });
        setStatus('success');
        setMessage('Your email address has been verified successfully.');
        toast.success('Email verified successfully.');
        setTimeout(() => navigate('/login'), 1800);
      } catch (requestError) {
        setStatus('error');
        setMessage(requestError.response?.data?.message || 'Verification failed. Please try again.');
      }
    };

    verify();
  }, [navigate, token]);

  return (
    <PageTransition>
      <div className="min-h-[92vh] flex items-center justify-center bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 py-12 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 text-center">
            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${status === 'success' ? 'bg-green-100 dark:bg-green-900/30' : status === 'error' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
              {status === 'success' ? (
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              ) : (
                <Mail className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              )}
            </div>

            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {status === 'success' ? 'Email verified' : status === 'error' ? 'Verification issue' : 'Verifying email'}
            </h1>
            <p className="mt-3 text-gray-500 dark:text-gray-400">{message}</p>

            {status === 'error' && (
              <div className="mt-6 space-y-3">
                <Link to="/login" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-700 px-4 py-3 font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl">
                  <ArrowLeft className="w-4 h-4" /> Back to login
                </Link>
                <Link to="/register" className="inline-flex w-full items-center justify-center rounded-xl border border-gray-200 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700">
                  Create a new account
                </Link>
              </div>
            )}

            {status === 'verifying' && (
              <p className="mt-6 text-sm text-gray-400">Please keep this page open for a moment.</p>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default VerifyEmail;
