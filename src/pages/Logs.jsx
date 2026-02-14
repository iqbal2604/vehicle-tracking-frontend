import { useEffect, useState } from 'react';
import { logsAPI } from '../services/api';
import { FileText, Search, Calendar, Filter } from 'lucide-react';

const Logs = () => {
    const [logs, setLogs] = useState([]);
    const [filteredLogs, setFilteredLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    useEffect(() => {
        fetchLogs();
        // Auto refresh every 15 seconds
        const interval = setInterval(fetchLogs, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        filterLogsData();
    }, [searchTerm, filterType, logs]);

    const fetchLogs = async () => {
        try {
            const response = await logsAPI.getAll();
            // Backend returns { logs: [...] }
            const rawLogs = response.data.logs || response.data.data || [];

            // Map backend fields to frontend expectations
            const data = rawLogs.map(log => ({
                ...log,
                message: log.action,
                details: log.meta,
                timestamp: log['created-at'],
                vehicle_id: log.target_id,
                user_name: log.user_name,
            }));

            setLogs(data);
            setFilteredLogs(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching logs:', error);
            setLoading(false);
        }
    };

    const filterLogsData = () => {
        let filtered = logs;

        // Filter by type
        if (filterType !== 'all') {
            filtered = filtered.filter(log => log.type === filterType);
        }

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(log =>
                log.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.vehicle_id?.toString().includes(searchTerm) ||
                log.type?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredLogs(filtered);
    };

    const getLogTypeColor = (type) => {
        const colors = {
            system: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
            admin: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
            auth: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
            error: 'text-red-400 bg-red-500/10 border-red-500/30',
        };
        return colors[type] || colors.system;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading logs...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-8 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold gradient-text mb-2">System Logs</h1>
                <p className="text-slate-400">Real-time activity and event monitoring</p>
            </div>

            {/* Filters */}
            <div className="card p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            className="input w-full pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Type Filter */}
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-slate-400" />
                        <select
                            className="input"
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            <option value="system">System</option>
                            <option value="admin">Admin</option>
                            <option value="auth">Auth</option>
                        </select>
                    </div>
                </div>

                {/* Results Count */}
                <div className="mt-4 text-sm text-slate-400">
                    Showing {filteredLogs.length} of {logs.length} logs
                </div>
            </div>

            {/* Logs List */}
            {filteredLogs.length === 0 ? (
                <div className="card p-12 text-center">
                    <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">No logs found</p>
                    <p className="text-slate-500 text-sm mt-2">Try adjusting your filters</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredLogs.map((log, index) => (
                        <div key={log.id || index} className="card p-4 animate-slide-up hover:scale-[1.01]">
                            <div className="flex items-start gap-4">
                                {/* Icon & Type */}
                                <div className="flex-shrink-0">
                                    <div className={`px-3 py-1 rounded-lg border font-semibold text-xs ${getLogTypeColor(log.type)}`}>
                                        {log.type?.toUpperCase() || 'INFO'}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-medium mb-1">{log.message || 'No message'}</p>

                                    {log.details && (
                                        <p className="text-sm text-slate-400 mb-2">{log.details}</p>
                                    )}

                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                        {log.user_name && (
                                            <span className="flex items-center gap-1">
                                                <span className="font-medium">User:</span> {log.user_name}
                                            </span>
                                        )}
                                        {log.vehicle_id && (
                                            <span className="flex items-center gap-1">
                                                <span className="font-medium">Vehicle ID:</span> {log.vehicle_id}
                                            </span>
                                        )}
                                        {log.timestamp && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(log.timestamp).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Logs;
