import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:error', {
        detail: {
          source: 'render',
          message: error?.message || 'Unexpected UI error',
          stack: error?.stack || '',
          componentStack: errorInfo?.componentStack || ''
        }
      }));
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Something went wrong</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              The page hit an unexpected error. Reload to continue using the app.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Reload app
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
