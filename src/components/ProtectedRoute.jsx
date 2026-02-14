import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ adminOnly = false }) => {
    const { user, token, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    // If user is NOT admin, redirect to landing.html (Legacy View)
    if (user.role !== 'admin') {
        // Force redirect to outside React app
        window.location.href = '/landing.html';
        return null;
    }

    return <Outlet />;
};

export default ProtectedRoute;
