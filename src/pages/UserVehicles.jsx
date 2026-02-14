import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { vehicleAPI } from '../services/api';
import VehicleCard from '../components/VehicleCard';
import { Search, Car, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UserVehicles = () => {
    const { userId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [vehicles, setVehicles] = useState([]);
    const [filteredVehicles, setFilteredVehicles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const userName = location.state?.userName || `User #${userId}`;

    useEffect(() => {
        fetchVehicles();
    }, [userId]);

    useEffect(() => {
        filterVehicles();
    }, [searchTerm, vehicles]);

    const fetchVehicles = async () => {
        try {
            const response = await vehicleAPI.getByUserId(userId);
            // Handle both array directly or wrapped in data
            const rawData = Array.isArray(response.data) ? response.data : (response.data.data || []);

            const data = rawData.map(v => ({
                ...v,
                license_plate: v.plate,
                status: 'inactive', // Default for now
                last_updated: null,
                last_location: null,
                driver_name: userName
            }));

            setVehicles(data);
            setFilteredVehicles(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching user vehicles:', error);
            setLoading(false);
        }
    };

    const filterVehicles = () => {
        if (!searchTerm) {
            setFilteredVehicles(vehicles);
            return;
        }

        const filtered = vehicles.filter(v =>
            v.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.license_plate?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredVehicles(filtered);
    };

    const handleVehicleClick = (vehicle) => {
        navigate(`/map`, {
            state: {
                selectedVehicleId: vehicle.id,
                userId: userId,
                userName: userName
            }
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading vehicles for {userName}...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-8 animate-fade-in">
            {/* Header */}
            <div className="mb-8 flex items-center space-x-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-slate-800 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-slate-400" />
                </button>
                <div>
                    <h1 className="text-4xl font-bold gradient-text mb-2">Vehicles: {userName}</h1>
                    <p className="text-slate-400">Manage and monitor vehicles for this driver</p>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="card p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name or license plate..."
                            className="input w-full pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="mt-4 text-sm text-slate-400">
                    Showing {filteredVehicles.length} of {vehicles.length} vehicles
                </div>
            </div>

            {/* Vehicles Grid */}
            {filteredVehicles.length === 0 ? (
                <div className="card p-12 text-center">
                    <Car className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">No vehicles found for this user</p>
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

export default UserVehicles;
