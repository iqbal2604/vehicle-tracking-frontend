import { useEffect, useState } from 'react';
import { authAPI } from '../services/api';
import UserCard from '../components/UserCard';
import { Search, Users as UsersIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [searchTerm, users]);

    const fetchUsers = async () => {
        try {
            const response = await authAPI.getUsers();
            const data = response.data.data || [];
            setUsers(data);
            setFilteredUsers(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
            setLoading(false);
        }
    };

    const filterUsers = () => {
        if (!searchTerm) {
            setFilteredUsers(users);
            return;
        }

        const filtered = users.filter(u =>
            u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredUsers(filtered);
    };

    const handleUserClick = (user) => {
        navigate(`/vehicles/user/${user.id}`, { state: { userName: user.name } });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-8 animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-bold gradient-text mb-2">Users</h1>
                <p className="text-slate-400">Manage and monitor all drivers</p>
            </div>

            {/* Filters and Search */}
            <div className="card p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Bar */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="input w-full pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Results Count */}
                <div className="mt-4 text-sm text-slate-400">
                    Showing {filteredUsers.length} of {users.length} users
                </div>
            </div>

            {/* Users Grid */}
            {filteredUsers.length === 0 ? (
                <div className="card p-12 text-center">
                    <UsersIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">No users found</p>
                    <p className="text-slate-500 text-sm mt-2">Try adjusting your search</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((user) => (
                        <UserCard
                            key={user.id}
                            user={user}
                            onClick={handleUserClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default Users;
