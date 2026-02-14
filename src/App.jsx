import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserVehicles from './pages/UserVehicles';
import MapView from './pages/MapView';
import Logs from './pages/Logs';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route path="/" element={
                <>
                  <Navbar />
                  <Dashboard />
                </>
              } />
              <Route path="/vehicles" element={
                <>
                  <Navbar />
                  <Users />
                </>
              } />
              <Route path="/vehicles/user/:userId" element={
                <>
                  <Navbar />
                  <UserVehicles />
                </>
              } />
              <Route path="/map" element={
                <>
                  <Navbar />
                  <MapView />
                </>
              } />
              <Route path="/logs" element={
                <>
                  <Navbar />
                  <Logs />
                </>
              } />
            </Route>

            {/* Catch all - Redirect to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
