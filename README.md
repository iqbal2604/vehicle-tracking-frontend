# 🚗 Vehicle Tracking Frontend

Modern, real-time vehicle tracking dashboard built with React, Vite, and Tailwind CSS.

## ✨ Features

- 📊 **Real-time Dashboard** - Live statistics and vehicle overview (Admin Only)
- 🗺️ **Interactive Map** - Track all vehicles on OpenStreetMap with custom markers
- 🚙 **Vehicle Management** - Search, filter, and monitor all vehicles (Admin Only)
- 📝 **Logs Viewer** - Comprehensive activity logs with filtering (Admin Only)
- 🔐 **Authentication** - Secure login & register with role-based access
- 🎨 **Modern UI** - Glassmorphism design with dark mode
- 📱 **Fully Responsive** - Works on all device sizes
- ⚡ **Auto-refresh** - Real-time data updates

## 🚀 Quick Start

### Prerequisites
- Node.js 20.18.0 or higher
- Backend API running on `http://localhost:8080`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The application will be available at **http://localhost:5173/**

## 🛠️ Tech Stack

- **React 18** - UI Framework
- **Vite 7** - Build Tool
- **Tailwind CSS 3** - Styling
- **React Router** - Navigation
- **Leaflet** - Maps
- **Axios** - HTTP Client
- **Lucide React** - Icons

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components
├── context/        # Global state (Auth)
├── pages/          # Page components
├── services/       # API integration
├── App.jsx         # Main app component
├── main.jsx        # Entry point
└── index.css       # Global styles
public/
└── landing.html    # Legacy tracking view (for non-admin users)
```

## 🔌 API Configuration

Update the API base URL in `src/services/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:8080/api/v1';
```

## 📝 Available Pages

- `/login` - Sign in page
- `/register` - Create new account (User/Admin)
- `/` - Dashboard (Admin Only)
- `/vehicles` - Vehicle management (Admin Only)
- `/map` - Real-time map view (Admin Only)
- `/logs` - System logs (Admin Only)
- `/landing.html` - Legacy tracking view (Standard Users)

## 🎨 Design Features

- Dark gradient background
- Glass morphism effects
- Smooth animations and transitions
- Color-coded status badges
- Custom scrollbars
- Responsive grid layouts

## 📄 License

MIT

---

Built with ❤️ using React + Vite + Tailwind CSS
