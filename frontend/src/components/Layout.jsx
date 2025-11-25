import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  FlaskConical,
  ClipboardCheck,
  Settings,
  LogOut,
  ChevronDown,
  User,
  Menu,
  X
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [labsExpanded, setLabsExpanded] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/courses', icon: BookOpen, label: 'Courses' },
    { path: '/quiz', icon: ClipboardCheck, label: 'Assessment Quiz' },
  ];

  const labItems = [
    { path: '/labs', icon: FlaskConical, label: 'Labs' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-gray-800 border-r border-gray-700 flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Cyyberlabs Logo"
              className="w-10 h-10 object-contain"
            />
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold text-white">Cyyberlabs</h1>
                <p className="text-xs text-gray-400">Security Platform</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </Link>
          ))}

          {/* Labs Section */}
          <div className="pt-4">
            {sidebarOpen && (
              <button
                onClick={() => setLabsExpanded(!labsExpanded)}
                className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                <span>Labs</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${labsExpanded ? 'rotate-180' : ''}`} />
              </button>
            )}

            {(labsExpanded || !sidebarOpen) && (
              <div className="space-y-1 mt-2">
                {labItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && <span className="text-sm">{item.label}</span>}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Admin Section */}
          {user?.role === 'admin' && (
            <div className="pt-4">
              {sidebarOpen && (
                <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Admin
                </p>
              )}
              <Link
                to="/admin"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive('/admin')
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Settings className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="text-sm">Admin Panel</span>}
              </Link>
            </div>
          )}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-700">
          <Link
            to="/profile"
            className="flex items-center gap-3 mb-3 p-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-300" />
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.username}</p>
                <p className="text-xs text-gray-400 truncate">{user?.department}</p>
              </div>
            )}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <Link to="/profile" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <div className="text-right">
              <p className="text-sm text-white">{user?.username}</p>
              <p className="text-xs text-gray-400">Semester {user?.semester}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
          </Link>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
