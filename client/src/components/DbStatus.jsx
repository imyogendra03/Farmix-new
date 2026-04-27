import React from 'react';
import useHealthStatus from '../hooks/useHealthStatus';

const DbStatus = () => {
  const status = useHealthStatus();
  const isConnected = status.database === 'connected' || status.database === 'ok';
  const isChecking = status.database === 'checking';

  return (
    <div
      title={`Database: ${status.database}${status.latency ? ` | ${status.latency}` : ''}`}
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 glass-panel px-3 py-1.5 rounded-full cursor-default group hover:scale-105 transition-all duration-300"
    >
      <div className="relative flex h-2.5 w-2.5">
        {isChecking ? (
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-400 animate-pulse" />
        ) : isConnected ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
        )}
      </div>
      <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 tracking-wide">
        {isChecking ? 'Database Connecting' : isConnected ? 'Database Connected' : 'Database Offline'}
      </span>
    </div>
  );
};

export default DbStatus;
