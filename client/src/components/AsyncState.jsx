import React from 'react';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';
import SkeletonLoader from './SkeletonLoader';

export const LoadingState = ({
  title = 'Loading...',
  description = 'Please wait while we prepare this view.',
  count = 3
}) => (
  <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 p-6 shadow-sm">
    <div className="mb-6">
      <p className="text-lg font-bold text-gray-900 dark:text-white">{title}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
    </div>
    <SkeletonLoader type="card" count={count} />
  </div>
);

export const ErrorState = ({
  title = 'Something went wrong',
  description = 'We could not load this content right now.',
  actionLabel = 'Try again',
  onAction
}) => (
  <div className="rounded-3xl border border-red-200 dark:border-red-900/50 bg-red-50/80 dark:bg-red-950/20 p-8 text-center shadow-sm">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
      <AlertTriangle className="h-7 w-7 text-red-600 dark:text-red-400" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
    <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600 dark:text-gray-400">{description}</p>
    {onAction && (
      <button
        onClick={onAction}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
      >
        <RefreshCw className="h-4 w-4" />
        {actionLabel}
      </button>
    )}
  </div>
);

export const EmptyState = ({
  title = 'Nothing here yet',
  description = 'There is no data to show right now.',
  actionLabel,
  onAction
}) => (
  <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 p-8 text-center shadow-sm">
    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-700">
      <Inbox className="h-7 w-7 text-gray-500 dark:text-gray-300" />
    </div>
    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
    <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600 dark:text-gray-400">{description}</p>
    {onAction && actionLabel && (
      <button
        onClick={onAction}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-nature-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-nature-700"
      >
        {actionLabel}
      </button>
    )}
  </div>
);
