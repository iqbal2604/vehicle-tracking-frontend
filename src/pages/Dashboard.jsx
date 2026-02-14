import { useEffect, useState } from 'react';
import { Activity, Car, MapPin, TrendingUp } from 'lucide-react';
import { vehicleAPI, locationAPI } from '../services/api';
import StatCard from '../components/StatCard';
import VehicleCard from '../components/VehicleCard';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        idle: 0,
        inactive: 0,
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchVehicles();
        // Polling every 10 seconds for real-time updates
        const interval = setInterval(fetchVehicles, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchVehicles = async () => {
        try {
            const response = await vehicleAPI.getAll();
            const rawData = Array.isArray(response.data) ? response.data : (response.data.data || []);

            // Fetch locations to determine status
            const vehiclesWithStatus = await Promise.all(rawData.map(async (v) => {
                try {
                    const locResponse = await locationAPI.getLast(v.id);
                    const locData = locResponse.data;

                    let status = 'inactive';
                    if (locData && locData.latitude) {
                        // Check if update is recent (e.g., within 5 minutes)
                        // Backend returns 'created_at', not 'timestamp'
                        const lastUpdate = new Date(locData.created_at || locData.timestamp || Date.now());
                        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

                        if (lastUpdate > fiveMinutesAgo) {
                            status = 'active';
                        } else {
                            status = 'idle';
                        }
                    }

                    return {
                        ...v,
                        license_plate: v.plate,
                        status: status,
                        driver_name: `User #${v.user_id}`
                    };
                } catch (e) {
                    return {
                        ...v,
                        license_plate: v.plate,
                        status: 'inactive',
                        driver_name: `User #${v.user_id}`
                    };
                }
            }));

            setVehicles(vehiclesWithStatus);

            // Calculate stats
            const active = vehiclesWithStatus.filter(v => v.status === 'active').length;
            const idle = vehiclesWithStatus.filter(v => v.status === 'idle').length;
            const inactive = vehiclesWithStatus.filter(v => v.status === 'inactive').length;

            setStats({
                total: vehiclesWithStatus.length,
                active,
                idle,
                inactive,
            });

            setLoading(false);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            setLoading(false);
        }
    };

    const handleVehicleClick = (vehicle) => {
        navigate(`/vehicles/${vehicle.id}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-8 animate-fade-in">
            {/* Page Title */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold gradient-text mb-2">Dashboard</h1>
                <p className="text-slate-400">Real-time vehicle tracking overview</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    icon={Car}
                    label="Total Vehicles"
                    value={stats.total}
                    color="primary"
                />
                <StatCard
                    icon={Activity}
                    label="Active"
                    value={stats.active}
                    color="success"
                />
                <StatCard
                    icon={TrendingUp}
                    label="Idle"
                    value={stats.idle}
                    color="warning"
                />
                <StatCard
                    icon={MapPin}
                    label="Inactive"
                    value={stats.inactive}
                    color="danger"
                />
            </div>

            {/* Recent Vehicles */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-4">Recent Vehicles</h2>
            </div>

            {vehicles.length === 0 ? (
                <div className="card p-12 text-center">
                    <Car className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">No vehicles found</p>
                    <p className="text-slate-500 text-sm mt-2">Add vehicles to start tracking</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vehicles.slice(0, 6).map((vehicle) => (
                        <VehicleCard
                            key={vehicle.id}
                            vehicle={vehicle}
                            onClick={handleVehicleClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Dashboard;
