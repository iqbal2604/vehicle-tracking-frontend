import { MapPin, Clock, Activity } from 'lucide-react';

const VehicleCard = ({ vehicle, onClick }) => {
    const getStatusColor = (status) => {
        const statusMap = {
            active: 'badge-online',
            idle: 'badge-idle',
            inactive: 'badge-offline',
        };
        return statusMap[status] || 'badge-offline';
    };

    return (
        <div
            className="card p-5 cursor-pointer animate-slide-up"
            onClick={() => onClick && onClick(vehicle)}
        >
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-white mb-1">{vehicle.name || vehicle.license_plate}</h3>
                    <p className="text-sm text-slate-400">{vehicle.license_plate}</p>
                </div>
                <span className={`badge ${getStatusColor(vehicle.status)}`}>
                    {vehicle.status || 'offline'}
                </span>
            </div>

            <div className="space-y-2">
                <div className="flex items-center text-sm text-slate-300">
                    <MapPin className="w-4 h-4 mr-2 text-primary-400" />
                    <span className="truncate">
                        {vehicle.last_location
                            ? `${vehicle.last_location.latitude.toFixed(4)}, ${vehicle.last_location.longitude.toFixed(4)}`
                            : 'No location data'
                        }
                    </span>
                </div>

                <div className="flex items-center text-sm text-slate-300">
                    <Clock className="w-4 h-4 mr-2 text-primary-400" />
                    <span>
                        {vehicle.last_updated
                            ? new Date(vehicle.last_updated).toLocaleString()
                            : 'Never updated'
                        }
                    </span>
                </div>

                {vehicle.driver_name && (
                    <div className="flex items-center text-sm text-slate-300">
                        <Activity className="w-4 h-4 mr-2 text-primary-400" />
                        <span>Driver: {vehicle.driver_name}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VehicleCard;
