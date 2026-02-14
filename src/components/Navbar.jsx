import { Link, useLocation } from 'react-router-dom';
import { MapPin, List, FileText, Activity, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const location = useLocation();
    const { logout } = useAuth();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const navItems = [
        { path: '/', label: 'Dashboard', icon: Activity },
        { path: '/vehicles', label: 'Drivers', icon: List },
        { path: '/logs', label: 'Logs', icon: FileText },
    ];

    return (
        <nav className="glass sticky top-0 z-50 border-b border-white/10">
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-3 group">
                        <div className="bg-gradient-to-br from-primary-500 to-blue-500 p-2 rounded-xl group-hover:scale-110 transition-transform duration-300">
                            <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold gradient-text">VehicleTracker</h1>
                            <p className="text-xs text-slate-400">Real-time Monitoring</p>
                        </div>
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center space-x-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const active = isActive(item.path);

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-300
                    ${active
                                            ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                            : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                                        }
                  `}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}

                        {/* Logout Button */}
                        <button
                            onClick={logout}
                            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-rose-400 hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-300"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="font-medium">Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
