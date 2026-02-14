import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, User, Lock, ArrowRight } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(formData.email, formData.password);
            // Redirect will be handled by ProtectedRoute or AuthContext optional callback
            // For now, let's force a reload or check current user state
            window.location.href = '/';
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="card max-w-md w-full p-8 animate-fade-in">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-primary-500 to-blue-500 rounded-xl mb-4 shadow-lg shadow-primary-500/20">
                        <MapPin className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold gradient-text mb-2">Welcome Back</h1>
                    <p className="text-slate-400">Sign in to access vehicle tracking dashboard</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="email"
                                required
                                className="input w-full pl-10"
                                placeholder="name@company.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                            <input
                                type="password"
                                required
                                className="input w-full pl-10"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full flex items-center justify-center"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                Sign In <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                        )}
                    </button>

                    <p className="text-center text-sm text-slate-400">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
                            Register
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
