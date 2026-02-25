import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet';
import { vehicleAPI, locationAPI, geofenceAPI } from '../services/api';
import { Navigation, MapPin as MapPinIcon, Calendar, Clock, Play, Pause, Square, ChevronRight, ChevronLeft, History } from 'lucide-react';
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
const ChangeView = ({ center, zoom, animate = true }) => {
    const map = useMap();
    useEffect(() => {
        if (center && typeof center[0] === 'number' && typeof center[1] === 'number') {
            // Only fly/pan if the values are actually different from current map state
            const currentCenter = map.getCenter();
            const currentZoom = map.getZoom();

            const isCenterDifferent = Math.abs(currentCenter.lat - center[0]) > 0.0001 ||
                Math.abs(currentCenter.lng - center[1]) > 0.0001;
            const isZoomDifferent = currentZoom !== zoom;

            if (isCenterDifferent || (animate && isZoomDifferent)) {
                if (animate) {
                    map.flyTo(center, zoom, {
                        duration: 1,
                        easeLinearity: 0.25
                    });
                } else {
                    map.panTo(center, { animate: true, duration: 0.5 });
                }
            }
        }
    }, [center[0], center[1], zoom, map, animate]); // Use specific coords to avoid ref issues
    return null;
};

// Component to Sync Map Zoom with State
const MapEvents = ({ setZoom, setFollowing }) => {
    const map = useMap();
    useEffect(() => {
        const handleZoom = () => {
            setZoom(map.getZoom());
        };
        const handleDrag = () => {
            setFollowing(false); // Stop following when user drags map
        };
        map.on('zoomend', handleZoom);
        map.on('dragstart', handleDrag);
        return () => {
            map.off('zoomend', handleZoom);
            map.off('dragstart', handleDrag);
        };
    }, [map, setZoom, setFollowing]);
    return null;
};

const MapView = () => {
    const location = useLocation();
    const passedVehicleId = location.state?.selectedVehicleId;
    const passedUserId = location.state?.userId;
    const passedUserName = location.state?.userName;

    const [vehicles, setVehicles] = useState([]);
    const [geofences, setGeofences] = useState([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [fetchingHistory, setFetchingHistory] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [mapCenter, setMapCenter] = useState([-6.2088, 106.8456]); // Jakarta default
    const [zoom, setZoom] = useState(13);
    const [following, setFollowing] = useState(true); // New state to track if we should follow the vehicle

    // History Replay States
    const [historyMode, setHistoryMode] = useState(false);
    const [historyData, setHistoryData] = useState([]);
    const [replaying, setReplaying] = useState(false);
    const [replayIndex, setReplayIndex] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(500); // ms per point
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setHours(0, 0, 0, 0)).toISOString().slice(0, 16),
        end: new Date().toISOString().slice(0, 16)
    });

    useEffect(() => {
        fetchVehicles();
        fetchGeofences();
        const interval = setInterval(fetchVehicles, 5000); // Update every 5 seconds
        return () => clearInterval(interval);
    }, []);

    const fetchGeofences = async () => {
        try {
            const res = await geofenceAPI.getAll();
            setGeofences(Array.isArray(res.data) ? res.data : []);
        } catch (err) {
            console.error('Error fetching geofences:', err);
        }
    };

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

                if (centerVehicle && !historyMode) {
                    // Only set center if following is true OR it's the very first load
                    if (following || initialLoading) {
                        setMapCenter([
                            centerVehicle.last_location.latitude,
                            centerVehicle.last_location.longitude
                        ]);
                        if (initialLoading) setZoom(15);
                    }

                    if (passedVehicleId && !selectedVehicle) {
                        setSelectedVehicle(centerVehicle);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleVehicleSelect = (vehicle) => {
        if (historyMode) {
            // If in history mode, just select but don't reset history until explicitly requested
            setSelectedVehicle(vehicle);
            return;
        }
        setSelectedVehicle(vehicle);
        if (vehicle.last_location) {
            setFollowing(true); // Re-enable following when manually selected
            setMapCenter([
                vehicle.last_location.latitude,
                vehicle.last_location.longitude
            ]);
            setZoom(16); // Closer zoom when manually selected
        }
    };

    const fetchHistory = async () => {
        if (!selectedVehicle) {
            alert("Pilih kendaraan terlebih dahulu");
            return;
        }

        setFetchingHistory(true);
        try {
            // Format start and end for backend (YYYY-MM-DD HH:mm:ss)
            const start = dateRange.start.replace('T', ' ') + ':00';
            const end = dateRange.end.replace('T', ' ') + ':00';

            const res = await locationAPI.getHistory(selectedVehicle.id, start, end);
            const data = res.data?.locations || [];

            if (data.length === 0) {
                alert("Tidak ada data history untuk rentang waktu ini");
                setHistoryData([]);
            } else {
                setHistoryData(data);
                // Center map to first point of history
                setMapCenter([data[0].latitude, data[0].longitude]);
                setZoom(15);
            }
        } catch (err) {
            console.error("Error fetching history:", err);
            alert("Gagal mengambil data history");
        } finally {
            setFetchingHistory(false);
        }
    };

    // Replay logic
    useEffect(() => {
        let interval;
        if (replaying && historyData.length > 0 && replayIndex < historyData.length - 1) {
            interval = setInterval(() => {
                setReplayIndex(prev => prev + 1);
            }, playbackSpeed);
        } else if (replayIndex >= historyData.length - 1) {
            setReplaying(false);
        }
        return () => clearInterval(interval);
    }, [replaying, replayIndex, historyData, playbackSpeed]);

    // Update map center when replaying
    useEffect(() => {
        if (replaying && historyData[replayIndex]) {
            setMapCenter([historyData[replayIndex].latitude, historyData[replayIndex].longitude]);
        }
    }, [replayIndex, replaying]);

    if (initialLoading) {
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

                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setHistoryMode(!historyMode);
                            if (historyMode) {
                                setHistoryData([]);
                                setReplaying(false);
                            }
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${historyMode ? 'bg-primary-500 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                        <History className="w-4 h-4" />
                        {historyMode ? 'Live Mode' : 'History Replay'}
                    </button>
                </div>
            </div>

            <div className="flex-1 flex">
                {/* Sidebar */}
                <div className="w-80 bg-slate-900/95 backdrop-blur-sm border-r border-slate-700 overflow-y-auto">
                    <div className="p-4">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Navigation className="w-5 h-5 text-primary-400" />
                            {historyMode ? 'Select Vehicle' : `Active Vehicles (${vehicles.length})`}
                        </h2>

                        {historyMode && (
                            <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-white/5 space-y-4">
                                <h3 className="text-sm font-bold text-primary-400 uppercase tracking-wider flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Time Filter
                                </h3>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Start Time</label>
                                    <input
                                        type="datetime-local"
                                        className="input w-full text-xs text-white bg-slate-900 border-white/10"
                                        value={dateRange.start}
                                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">End Time</label>
                                    <input
                                        type="datetime-local"
                                        className="input w-full text-xs text-white bg-slate-900 border-white/10"
                                        value={dateRange.end}
                                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    />
                                </div>
                                <button
                                    onClick={fetchHistory}
                                    className="btn btn-primary w-full py-2 text-sm flex items-center justify-center gap-2"
                                    disabled={!selectedVehicle}
                                >
                                    <History className="w-4 h-4" /> Get History
                                </button>
                            </div>
                        )}

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

                {/* Map Area */}
                <div className="flex-1 relative">
                    {/* Fetching History Loading Overlay */}
                    {fetchingHistory && (
                        <div className="absolute inset-0 z-[2000] bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
                            <div className="bg-slate-900/90 p-4 rounded-xl border border-white/10 flex items-center gap-3 shadow-2xl">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500"></div>
                                <span className="text-white font-medium">Fetching history data...</span>
                            </div>
                        </div>
                    )}

                    {vehicles.length > 0 ? (
                        <MapContainer
                            center={mapCenter}
                            zoom={zoom}
                            style={{ height: '100%', width: '100%' }}
                            className="z-0"
                        >
                            <ChangeView
                                center={mapCenter}
                                zoom={zoom}
                                animate={!replaying}
                                following={following}
                                replaying={replaying}
                            />
                            <MapEvents setZoom={setZoom} setFollowing={setFollowing} />
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            {/* Render Route Polyline in History Mode */}
                            {historyMode && historyData.length > 1 && (
                                <>
                                    <Polyline
                                        positions={historyData.map(d => [d.latitude, d.longitude])}
                                        pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.7, dashArray: '10, 10' }}
                                    />
                                    {/* Replay Marker */}
                                    {historyData[replayIndex] && (
                                        <Marker
                                            position={[historyData[replayIndex].latitude, historyData[replayIndex].longitude]}
                                            icon={createCustomIcon('active')}
                                            zIndexOffset={1000}
                                        >
                                            <Popup>
                                                <div className="text-xs">
                                                    <b>Time:</b> {new Date(historyData[replayIndex].created_at).toLocaleString()}<br />
                                                    <b>Lat:</b> {historyData[replayIndex].latitude.toFixed(5)}<br />
                                                    <b>Lng:</b> {historyData[replayIndex].longitude.toFixed(5)}
                                                </div>
                                            </Popup>
                                        </Marker>
                                    )}
                                </>
                            )}

                            {/* Render Geofences with safety check */}
                            {geofences.filter(gf => gf.latitude && gf.longitude).map(gf => (
                                <Circle
                                    key={`gf-${gf.id}`}
                                    center={[gf.latitude, gf.longitude]}
                                    radius={gf.radius || 100}
                                    pathOptions={{
                                        color: gf.type === 'safe_zone' ? '#10b981' : '#ef4444',
                                        fillColor: gf.type === 'safe_zone' ? '#10b981' : '#ef4444',
                                        fillOpacity: 0.1,
                                        weight: 1,
                                        dashArray: '5, 10'
                                    }}
                                />
                            ))}

                            {!historyMode && vehicles.map((vehicle) => (
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
                            {/* No vehicles display */}
                        </div>
                    )}

                    {/* Replay Controls Overlay */}
                    {historyMode && historyData.length > 0 && (
                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-[1000] bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-6 w-[500px]">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setReplaying(!replaying)}
                                    className="p-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl shadow-lg transition-all"
                                >
                                    {replaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                                </button>
                                <button
                                    onClick={() => { setReplaying(false); setReplayIndex(0); }}
                                    className="p-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all"
                                >
                                    <Square className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    <span>Progress</span>
                                    <span>{replayIndex + 1} / {historyData.length} Points</span>
                                </div>
                                <input
                                    type="range"
                                    className="w-full accent-primary-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                    min="0"
                                    max={historyData.length - 1}
                                    value={replayIndex}
                                    onChange={(e) => { setReplaying(false); setReplayIndex(parseInt(e.target.value)); }}
                                />
                                <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {new Date(historyData[replayIndex].created_at).toLocaleString()}
                                </div>
                            </div>

                            <div className="border-l border-white/10 pl-4 space-y-1">
                                <label className="text-[10px] text-slate-500 uppercase font-bold block">Speed</label>
                                <select
                                    className="bg-slate-800 text-white text-xs rounded border-none px-2 py-1 focus:ring-1 focus:ring-primary-500"
                                    value={playbackSpeed}
                                    onChange={(e) => setPlaybackSpeed(parseInt(e.target.value))}
                                >
                                    <option value="1000">1x</option>
                                    <option value="500">2x</option>
                                    <option value="200">5x</option>
                                    <option value="100">10x</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MapView;
