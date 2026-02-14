import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
                    <div className="bg-slate-800 p-8 rounded-xl max-w-2xl w-full border border-red-500/30">
                        <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h1>
                        <div className="bg-slate-950 p-4 rounded-lg overflow-auto max-h-96 text-sm font-mono text-slate-300 mb-4">
                            <p className="text-red-400 mb-2">{this.state.error && this.state.error.toString()}</p>
                            <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                        </div>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition text-white"
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
