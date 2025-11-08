'use client';

import { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // Log error to console in development
        if (process.env.NODE_ENV === 'development') {
            console.error('ErrorBoundary caught an error:', error, errorInfo);
        }
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0f0f23] flex items-center justify-center p-4">
                    <div className="bg-[#16213e] border border-red-500/50 rounded-xl p-8 max-w-md w-full text-center">
                        <h2 className="text-2xl font-bold text-red-400 mb-4 orbitron">Something went wrong</h2>
                        <p className="text-slate-300 mb-6">
                            An unexpected error occurred. Please refresh the page or contact support if the problem persists.
                        </p>
                        <button
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.reload();
                            }}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors orbitron"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

