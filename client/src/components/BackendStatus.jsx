import React from 'react';
import useHealthStatus from '../hooks/useHealthStatus';

const BackendStatus = () => {
    const status = useHealthStatus();

    const getStatusColor = () => {
        if (status.state === 'checking') return 'bg-yellow-400';
        if (status.state === 'connected' && status.database === 'connected') return 'bg-green-500';
        return 'bg-red-500';
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg border border-gray-100 dark:border-gray-700">
            <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor()} animate-pulse`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {status.state === 'checking' ? 'Syncing...' : status.state === 'connected' ? 'System Live' : 'System Offline'}
            </span>
        </div>
    );
};

export default BackendStatus;
