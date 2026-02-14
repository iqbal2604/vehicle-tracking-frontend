import { useEffect, useState } from 'react';
import { vehicleAPI } from '../services/api';
import VehicleCard from '../components/VehicleCard';
import { Search, Car } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Vehicles = () => {
    const [vehicles, setVehicles] = useState([]);
    const [filteredVehicles, setFilteredVehicles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const navigate = useNavigate();

    useEffect(() => {
        fetchVehicles();
    }, []);

    useEffect(() => {
        filterVehicles();
    }, [searchTerm, filter, vehicles]);

    const fetchVehicles = async () => {
        try {
            const response = await vehicleAPI.getAll();
            // Backend returns array directly, not wrapped in data object
            const rawData = Array.isArray(response.data) ? response.data : (response.data.data || []);

            // Map backend fields to frontend expectations
            const data = rawData.map(v => ({
                ...v,
                license_plate: v.plate,
                // Default values for missing backend fields
                status: 'inactive',
                last_updated: null,
                last_location: null,
                driver_name: `User #${v.user_id}`
            }));

            setVehicles(data);
            setFilteredVehicles(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            setLoading(false);
        }
    };

    const filterVehicles = () => {
        let filtered = vehicles;

        // Filter by status
        if (filter !== 'all') {
            filtered = filtered.filter(v => v.status === filter);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(v =>
                v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                v.license_plate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                v.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredVehicles(filtered);
    };

    const handleVehicleClick = (vehicle) => {
        navigate(`/vehicles/${vehicle.id}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading vehicles...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-8 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold gradient-text mb-2">Vehicles</h1>
                <p className="text-slate-400">Manage and monitor all vehicles</p>
            </div>

            {/* Filters and Search */}
            <div className="card p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Bar */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name, license plate, or driver..."
                            className="input w-full pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex gap-2">
                        {['all', 'active', 'idle', 'inactive'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilter(status)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === status
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50'
                                    }`}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Results Count */}
                <div className="mt-4 text-sm text-slate-400">
                    Showing {filteredVehicles.length} of {vehicles.length} vehicles
                </div>
            </div>

            {/* Vehicles Grid */}
            {filteredVehicles.length === 0 ? (
                <div className="card p-12 text-center">
                    <Car className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">No vehicles found</p>
                    <p className="text-slate-500 text-sm mt-2">Try adjusting your filters</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVehicles.map((vehicle) => (
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

export default Vehicles;
