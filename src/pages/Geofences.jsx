import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, Popup } from 'react-leaflet';
import { geofenceAPI, vehicleAPI, locationAPI } from '../services/api';
import { MapPin, Trash2, ShieldAlert, Plus, Save, X, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Geofences = () => {
    const [geofences, setGeofences] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [newGf, setNewGf] = useState({ name: '', latitude: -6.2, longitude: 106.8, radius: 500, type: 'safe_zone' });

    useEffect(() => {
        fetchGeofences();
        fetchVehicles();
        const interval = setInterval(fetchVehicles, 5000); // Poll driver locations every 5s
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
            const res = await vehicleAPI.getAll();
            const rawData = Array.isArray(res.data) ? res.data : (res.data.data || []);

            // Get last location for each vehicle
            const vehiclesWithLoc = await Promise.all(rawData.map(async (v) => {
                try {
                    const locRes = await locationAPI.getLast(v.id);
                    if (locRes.data && locRes.data.latitude) {
                        return { ...v, last_location: locRes.data };
                    }
                    return null;
                } catch (e) { return null; }
            }));

            setVehicles(vehiclesWithLoc.filter(v => v !== null));
            setLoading(false);
        } catch (err) {
            console.error('Error fetching vehicles:', err);
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            await geofenceAPI.create(newGf);
            setShowForm(false);
            setNewGf({ name: '', latitude: -6.2, longitude: 106.8, radius: 500, type: 'safe_zone' });
            fetchGeofences();
        } catch (err) {
            alert("Gagal simpan geofence: " + (err.response?.data?.error || err.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus area geofence ini?')) return;
        try {
            await geofenceAPI.delete(id);
            fetchGeofences();
        } catch (err) {
            alert("Gagal menghapus geofence");
        }
    };

    const MapEvents = () => {
        useMapEvents({
            click(e) {
                if (showForm) {
                    setNewGf(prev => ({ ...prev, latitude: e.latlng.lat, longitude: e.latlng.lng }));
                }
            },
        });
        return null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-8 flex flex-col h-[calc(100vh-100px)] animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Geofence Management</h1>
                    <p className="text-slate-400 text-sm">Create virtual boundaries for your vehicles</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className={`btn flex items-center gap-2 px-6 ${showForm ? 'bg-rose-500 hover:bg-rose-600' : 'bg-primary-500 hover:bg-primary-600'} text-white shadow-lg transition-all duration-300`}
                >
                    {showForm ? <><X className="w-5 h-5" /> Cancel</> : <><Plus className="w-5 h-5" /> New Area</>}
                </button>
            </div>

            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Map Section */}
                <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative bg-slate-800">
                    <MapContainer center={[-6.2088, 106.8456]} zoom={12} className="h-full w-full z-0">
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <MapEvents />

                        {geofences.filter(gf => gf.latitude && gf.longitude).map(gf => (
                            <Circle
                                key={gf.id}
                                center={[gf.latitude, gf.longitude]}
                                radius={gf.radius || 100}
                                pathOptions={{
                                    color: gf.type === 'safe_zone' ? '#10b981' : '#ef4444',
                                    fillColor: gf.type === 'safe_zone' ? '#10b981' : '#ef4444',
                                    fillOpacity: 0.2,
                                    weight: 2
                                }}
                            >
                                <Marker position={[gf.latitude, gf.longitude]} opacity={0.6}>
                                    <Circle center={[gf.latitude, gf.longitude]} radius={5} color="#fff" />
                                </Marker>
                            </Circle>
                        ))}

                        {/* Render Active Drivers */}
                        {vehicles.filter(v => v.last_location?.latitude && v.last_location?.longitude).map(v => (
                            <Marker
                                key={`v-${v.id}`}
                                position={[v.last_location.latitude, v.last_location.longitude]}
                                icon={L.divIcon({
                                    className: 'custom-driver-marker',
                                    html: `<div style="background: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);"></div>`,
                                    iconSize: [12, 12],
                                    iconAnchor: [6, 6]
                                })}
                            >
                                <Popup>
                                    <div className="p-2">
                                        <div className="font-bold text-slate-900">{v.name || v.plate}</div>
                                        <div className="text-xs text-slate-500">Driver ID: {v.user_id}</div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}

                        {showForm && (
                            <>
                                <Circle
                                    center={[newGf.latitude, newGf.longitude]}
                                    radius={newGf.radius}
                                    pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.3 }}
                                />
                                <Marker position={[newGf.latitude, newGf.longitude]} />
                            </>
                        )}
                    </MapContainer>

                    {showForm && (
                        <div className="absolute top-4 right-4 z-[1000] bg-slate-900/95 backdrop-blur-md p-6 rounded-2xl w-80 border border-white/20 shadow-2xl animate-slide-in-right">
                            <form onSubmit={handleSave} className="space-y-4">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <ShieldAlert className="w-5 h-5 text-primary-400" />
                                    Configure Area
                                </h3>
                                <div>
                                    <label className="text-xs font-semibold text-slate-400 block mb-1 uppercase tracking-wider">Area Name</label>
                                    <input required className="input w-full bg-slate-800/50 border-white/10 focus:border-primary-500" value={newGf.name} onChange={e => setNewGf({ ...newGf, name: e.target.value })} placeholder="e.g. Main Office" text="text" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-semibold text-slate-400 block mb-1 uppercase tracking-wider">Radius (m)</label>
                                        <input type="number" min="10" className="input w-full bg-slate-800/50 border-white/10" value={newGf.radius} onChange={e => setNewGf({ ...newGf, radius: parseFloat(e.target.value) })} />
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold text-slate-400 block mb-1 uppercase tracking-wider">Type</label>
                                        <select className="input w-full bg-slate-800/50 border-white/10" value={newGf.type} onChange={e => setNewGf({ ...newGf, type: e.target.value })}>
                                            <option value="safe_zone">Safe Zone</option>
                                            <option value="restricted_area">Restricted</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                                    <p className="text-[10px] text-blue-400 leading-relaxed font-medium">
                                        💡 Click anywhere on the map to set coordinates.
                                    </p>
                                </div>
                                <button type="submit" className="btn bg-primary-500 hover:bg-primary-600 text-white w-full py-3 flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary-500/20">
                                    <Save className="w-5 h-5" /> Save Area
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* List Section */}
                <div className="w-80 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">Active Areas ({geofences.length})</h2>
                    {geofences.length === 0 ? (
                        <div className="text-center py-12 bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-4 opacity-20" />
                            <p className="text-slate-500 text-sm">No geofences created yet</p>
                        </div>
                    ) : (
                        geofences.map(gf => (
                            <div key={gf.id} className="group card p-4 border border-white/5 hover:border-primary-500/30 transition-all duration-300 flex justify-between items-center bg-slate-800/40 backdrop-blur-sm">
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-white text-sm truncate">{gf.name}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter ${gf.type === 'safe_zone' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                            {gf.type === 'safe_zone' ? 'SAFE' : 'RESTRICTED'}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-mono">{gf.radius}m</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(gf.id)}
                                    className="text-slate-500 hover:text-rose-500 p-2 hover:bg-rose-500/10 rounded-xl transition-colors duration-200"
                                    title="Delete Geofence"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Geofences;
