// src/components/shared/ErrorBoundary.jsx
import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Button from '../ui/Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoDashboard = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/admin';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-950 p-6">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Đã xảy ra lỗi hiển thị
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Giao diện gặp sự cố ngoài dự kiến. Dữ liệu của bạn vẫn an toàn.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl text-left">
                <p className="font-mono text-xs text-rose-600 dark:text-rose-400 break-words">
                  {String(this.state.error?.message || this.state.error)}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 flex items-center justify-center gap-1.5"
                onClick={this.handleGoDashboard}
              >
                <Home className="w-4 h-4" />
                Về Dashboard
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5"
                onClick={this.handleReload}
              >
                <RefreshCw className="w-4 h-4" />
                Tải lại trang
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
