import React from 'react';

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'text':
        return (
          <div className="animate-pulse space-y-3 w-full">
             <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
             <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
             <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        );
      case 'profile':
        return (
          <div className="animate-pulse flex items-center space-x-4">
            <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-12 w-12"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        );
      case 'card':
      default:
        return (
          <div className="card p-6 w-full mx-auto">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-200 dark:bg-gray-700 h-10 w-10"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="w-full space-y-4">
      {Array(count).fill(0).map((_, i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </div>
  );
};

export default SkeletonLoader;
