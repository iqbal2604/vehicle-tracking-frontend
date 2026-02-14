

const StatCard = ({ icon: Icon, label, value, color = 'primary', trend }) => {
    const colorClasses = {
        primary: 'from-primary-500 to-blue-500',
        success: 'from-emerald-500 to-green-500',
        warning: 'from-yellow-500 to-orange-500',
        danger: 'from-red-500 to-pink-500',
    };

    return (
        <div className="card p-6 animate-fade-in hover:scale-105">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-slate-400 text-sm font-medium mb-2">{label}</p>
                    <p className="text-3xl font-bold text-white mb-1">{value}</p>
                    {trend && (
                        <p className={`text-sm ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% from last week
                        </p>
                    )}
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );
};

export default StatCard;
