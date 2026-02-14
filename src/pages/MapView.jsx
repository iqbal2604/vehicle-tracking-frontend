import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { vehicleAPI, locationAPI } from '../services/api';
import { Navigation, MapPin as MapPinIcon } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different vehicle statuses
const createCustomIcon = (status) => {
    const colors = {
        active: '#10b981',
        idle: '#f59e0b',
        inactive: '#ef4444',
    };

    return L.divIcon({
        className: 'custom-marker',
        html: `
      <div style="
        background: ${colors[status] || colors.inactive};
        width: 30px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      ">
        <div style="
          transform: rotate(45deg);
          margin-top: 4px;
          margin-left: 4px;
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
        "></div>
      </div>
    `,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
    });
};

// Component to handle map center and zoom changes
const ChangeView = ({ center, zoom }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.flyTo(center, zoom, {
                duration: 1.5,
                easeLinearity: 0.25
            });
        }
    }, [center, zoom, map]);
    return null;
};

const MapView = () => {
    const location = useLocation();
    const passedVehicleId = location.state?.selectedVehicleId;
    const passedUserId = location.state?.userId;
    const passedUserName = location.state?.userName;

    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [mapCenter, setMapCenter] = useState([-6.2088, 106.8456]); // Jakarta default
    const [zoom, setZoom] = useState(13);

    useEffect(() => {
        fetchVehicles();
        const interval = setInterval(fetchVehicles, 5000); // Update every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchVehicles = async () => {
        try {
            // 1. Fetch vehicles (specific user or all)
            let response;
            if (passedUserId) {
                response = await vehicleAPI.getByUserId(passedUserId);
            } else {
                response = await vehicleAPI.getAll();
            }
            const rawData = Array.isArray(response.data) ? response.data : (response.data.data || []);

            // 2. Fetch last location for EACH vehicle
            const vehiclesWithLoc = await Promise.all(rawData.map(async (v) => {
                try {
                    const locResponse = await locationAPI.getLast(v.id);
                    const locData = locResponse.data;

                    // Check if we got valid location data
                    if (locData && locData.latitude && locData.longitude) {
                        return {
                            ...v,
                            license_plate: v.plate,
                            driver_name: `User #${v.user_id}`,
                            last_location: {
                                latitude: locData.latitude,
                                longitude: locData.longitude
                            },
                            status: 'active', // Assume active if we have location
                            last_updated: locData.created_at || locData.timestamp || new Date().toISOString()
                        };
                    }
                    return null;
                } catch (e) {
                    // console.warn(`No location for vehicle ${v.id}`);
                    return null;
                }
            }));

            // Filter out nulls
            const validVehicles = vehiclesWithLoc.filter(v => v !== null);
            setVehicles(validVehicles);

            // Set map center to passed vehicle OR first vehicle
            if (validVehicles.length > 0) {
                let centerVehicle = null;
                if (passedVehicleId) {
                    centerVehicle = validVehicles.find(v => v.id === passedVehicleId);
                }

                if (!centerVehicle && !selectedVehicle) {
                    centerVehicle = validVehicles[0];
                }

                if (centerVehicle) {
                    setMapCenter([
                        centerVehicle.last_location.latitude,
                        centerVehicle.last_location.longitude
                    ]);
                    setZoom(15); // Zoom in closer when a vehicle is selected
                    if (passedVehicleId && !selectedVehicle) {
                        setSelectedVehicle(centerVehicle);
                    }
                }
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            setLoading(false);
        }
    };

    const handleVehicleSelect = (vehicle) => {
        setSelectedVehicle(vehicle);
        if (vehicle.last_location) {
            setMapCenter([
                vehicle.last_location.latitude,
                vehicle.last_location.longitude
            ]);
            setZoom(16); // Closer zoom when manually selected
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading map...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700 px-6 py-4 z-10 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold gradient-text mb-1">
                        {passedUserName ? `Tracking: ${passedUserName}` : 'Live Vehicle Map'}
                    </h1>
                    <p className="text-slate-400 text-sm">Real-time tracking of vehicles</p>
                </div>
            </div>

            <div className="flex-1 flex">
                {/* Sidebar */}
                <div className="w-80 bg-slate-900/95 backdrop-blur-sm border-r border-slate-700 overflow-y-auto">
                    <div className="p-4">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Navigation className="w-5 h-5 text-primary-400" />
                            Active Vehicles ({vehicles.length})
                        </h2>

                        <div className="space-y-3">
                            {vehicles.length === 0 ? (
                                <div className="text-center py-8">
                                    <MapPinIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                                    <p className="text-slate-400">No vehicles with location data</p>
                                </div>
                            ) : (
                                vehicles.map((vehicle) => (
                                    <div
                                        key={vehicle.id}
                                        onClick={() => handleVehicleSelect(vehicle)}
                                        className={`
                      card p-4 cursor-pointer transition-all
                      ${selectedVehicle?.id === vehicle.id ? 'ring-2 ring-primary-500' : ''}
                    `}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-bold text-white">{vehicle.name || vehicle.license_plate}</h3>
                                                <p className="text-xs text-slate-400">{vehicle.license_plate}</p>
                                            </div>
                                            <span className={`badge ${vehicle.status === 'active' ? 'badge-online' :
                                                vehicle.status === 'idle' ? 'badge-idle' : 'badge-offline'
                                                }`}>
                                                {vehicle.status}
                                            </span>
                                        </div>

                                        {vehicle.driver_name && (
                                            <p className="text-sm text-slate-300 mb-2">
                                                Driver: {vehicle.driver_name}
                                            </p>
                                        )}

                                        <div className="text-xs text-slate-400">
                                            Last update: {new Date(vehicle.last_updated).toLocaleTimeString()}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Map */}
                <div className="flex-1 relative">
                    {vehicles.length > 0 ? (
                        <MapContainer
                            center={mapCenter}
                            zoom={zoom}
                            style={{ height: '100%', width: '100%' }}
                            className="z-0"
                        >
                            <ChangeView center={mapCenter} zoom={zoom} />
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {vehicles.map((vehicle) => (
                                <Marker
                                    key={vehicle.id}
                                    position={[
                                        vehicle.last_location.latitude,
                                        vehicle.last_location.longitude
                                    ]}
                                    icon={createCustomIcon(vehicle.status)}
                                    eventHandlers={{
                                        click: () => handleVehicleSelect(vehicle),
                                    }}
                                >
                                    <Popup>
                                        <div className="text-slate-900">
                                            <h3 className="font-bold text-lg mb-1">
                                                {vehicle.name || vehicle.license_plate}
                                            </h3>
                                            <p className="text-sm mb-2">{vehicle.license_plate}</p>
                                            {vehicle.driver_name && (
                                                <p className="text-sm mb-1">Driver: {vehicle.driver_name}</p>
                                            )}
                                            <p className="text-xs text-slate-600">
                                                Status: <span className="font-semibold">{vehicle.status}</span>
                                            </p>
                                            <p className="text-xs text-slate-600">
                                                Updated: {new Date(vehicle.last_updated).toLocaleString()}
                                            </p>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full bg-slate-800">
                            <div className="text-center">
                                <MapPinIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                <p className="text-slate-400 text-lg">No location data available</p>
                                <p className="text-slate-500 text-sm">Vehicles will appear here once they report their location</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MapView;
