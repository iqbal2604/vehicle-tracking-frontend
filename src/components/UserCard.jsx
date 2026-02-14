import { User, Mail, Shield } from 'lucide-react';

const UserCard = ({ user, onClick }) => {
    return (
        <div
            className="card p-5 cursor-pointer animate-slide-up hover:border-primary-500/50 transition-colors"
            onClick={() => onClick && onClick(user)}
        >
            <div className="flex items-center space-x-4">
                <div className="bg-slate-700/50 p-3 rounded-full">
                    <User className="w-6 h-6 text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-white truncate">{user.name}</h3>
                    <div className="flex items-center text-sm text-slate-400 mt-1">
                        <Mail className="w-4 h-4 mr-1 text-slate-500" />
                        <span className="truncate">{user.email}</span>
                    </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="flex items-center text-xs font-medium text-slate-400 bg-slate-800 px-2 py-1 rounded-md">
                        <Shield className="w-3 h-3 mr-1" />
                        {user.role}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default UserCard;
