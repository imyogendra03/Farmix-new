import React, { useState } from 'react';
import { Star, Send, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { toast } from 'react-toastify';

const ReviewForm = ({ expertId, expertName, appointmentId, onSuccess, onCancel }) => {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [categoryRatings, setCategoryRatings] = useState({
    expertise: 5,
    communication: 5,
    timeliness: 5
  });
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!rating) {
      setError('Please select a rating');
      return;
    }

    if (feedback.trim().length < 10) {
      setError('Feedback must be at least 10 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/reviews', {
        appointmentId: appointmentId || null,
        expertId,
        rating,
        feedback: feedback.trim(),
        categoryRatings,
        wouldRecommend
      });

      if (res.data.success) {
        toast.success('Review submitted! Admin will verify it shortly.');
        setFeedback('');
        setRating(5);
        setCategoryRatings({ expertise: 5, communication: 5, timeliness: 5 });
        if (onSuccess) onSuccess(res.data.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit review';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (value, setValue) => (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setValue(star)}
          className="transition-transform hover:scale-125 active:scale-100"
        >
          <Star
            size={32}
            className={`${star <= value ? 'text-orange-400 fill-orange-400' : 'text-gray-300'}`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Leave a Review</h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Share your experience with {expertName}
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Overall Rating */}
        <div>
          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">
            Overall Rating <span className="text-red-500">*</span>
          </label>
          {renderStars(rating, setRating)}
        </div>

        {/* Category Ratings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Expertise
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    setCategoryRatings({ ...categoryRatings, expertise: star })
                  }
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={24}
                    className={`${
                      star <= categoryRatings.expertise
                        ? 'text-blue-400 fill-blue-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Communication
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    setCategoryRatings({ ...categoryRatings, communication: star })
                  }
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={24}
                    className={`${
                      star <= categoryRatings.communication
                        ? 'text-green-400 fill-green-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Timeliness
            </label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() =>
                    setCategoryRatings({ ...categoryRatings, timeliness: star })
                  }
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    size={24}
                    className={`${
                      star <= categoryRatings.timeliness
                        ? 'text-purple-400 fill-purple-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback */}
        <div>
          <label htmlFor="feedback" className="block text-sm font-bold text-gray-900 dark:text-white mb-3">
            Your Feedback <span className="text-red-500">*</span> (min 10 characters)
          </label>
          <textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share details about your experience, what went well, and suggestions for improvement..."
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-32 resize-none"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {feedback.length} characters ({10 - feedback.length > 0 ? `${10 - feedback.length} more needed` : 'ready to submit'})
          </p>
        </div>

        {/* Would Recommend */}
        <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
          <input
            type="checkbox"
            id="recommend"
            checked={wouldRecommend}
            onChange={(e) => setWouldRecommend(e.target.checked)}
            className="w-5 h-5 cursor-pointer accent-green-600"
          />
          <label htmlFor="recommend" className="flex-grow cursor-pointer">
            <span className="font-semibold text-gray-900 dark:text-white">
              I would recommend this expert
            </span>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              This helps other farmers find reliable experts
            </p>
          </label>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading || feedback.length < 10}
            className="flex-grow flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg transition-all active:scale-95"
          >
            <Send size={18} />
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-bold transition-all"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Info */}
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Your review will be moderated before appearing publicly. This helps maintain quality and prevents spam.
        </p>
      </form>
    </div>
  );
};

export default ReviewForm;
