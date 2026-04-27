import React, { useContext, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Moon, Sun, Bell, LayoutDashboard, Shield, Check, Trash2, ChevronDown } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { NotificationContext } from '../context/NotificationContext';
import { useTranslation } from '../context/TranslationContext';
import { Languages } from 'lucide-react';
import { BrandLogo, BrandWordmark } from './BrandAssets';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useContext(ThemeContext);
  const { lang, toggleLang } = useTranslation();
  const { notifications, markAllRead, markOneRead, deleteNotification, clearNotifications } = useContext(NotificationContext);
  const location = useLocation();
  const notifRef = useRef(null);

  // Close menus on route change
  useEffect(() => {
    setIsOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const communitySecondary = user?.role === 'farmer'
    ? { name: 'Expert Advice', path: '/farmer-bookings' }
    : user?.role === 'expert'
      ? { name: 'Connected Farmers', path: '/expert-dashboard' }
      : { name: 'Expert Advice', path: '/experts' };

  const connectedFarmersPath = user?.role === 'farmer'
    ? '/farmer-bookings'
    : user?.role === 'expert'
      ? '/expert-dashboard'
      : user?.role === 'admin'
        ? '/admin-dashboard'
        : '/experts';

  // ── Nav links ────────────────────────────────────────────────────
  const navGroups = {
    ai: {
      name: 'AI Analysis',
      links: [
        { name: 'Crop Recommendation', path: '/crop-recommendation' },
        { name: 'Disease Prediction', path: '/disease-prediction' },
        { name: 'Yield Prediction', path: '/yield-prediction' },
      ]
    },
    tools: {
      name: 'Farm Tools',
      links: [
        { name: 'Farm Map', path: '/farm-map' },
        { name: 'Weather Monitor', path: '/weather-monitor' },
        { name: 'Market Intelligence', path: '/market-prediction' },
        { name: 'Farm Calendar', path: '/farm-calendar' },
      ]
    },
    social: {
      name: 'Community',
      links: [
        { name: 'Forum', path: '/community' },
        { name: communitySecondary.name, path: communitySecondary.path || connectedFarmersPath },
        { name: 'Success Stories', path: '/reviews' },
      ]
    }
  };

  const [activeDropdown, setActiveDropdown] = useState(null);

  const isActive = (path) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  // Role-based dashboard path
  const dashboardPath = user?.role === 'admin'
    ? '/admin-dashboard'
    : user?.role === 'expert'
      ? '/expert-dashboard'
      : '/user-dashboard';

  return (
    <nav className="glass-nav sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <BrandLogo className="h-10 w-10 sm:h-11 sm:w-11" />
              <BrandWordmark
                className="h-7 sm:h-8"
                alt="Farmix brand name"
              />
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex md:items-center md:space-x-1 lg:space-x-4">
            <Link
              to="/"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive('/') ? 'text-nature-600 bg-nature-50 dark:bg-nature-900/20' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              Home
            </Link>

            {Object.keys(navGroups).map((key) => (
              <div 
                key={key}
                className="relative group p-1"
                onMouseEnter={() => setActiveDropdown(key)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeDropdown === key ? 'text-nature-600 bg-nature-50 dark:bg-nature-900/20' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {navGroups[key].name}
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${activeDropdown === key ? 'rotate-180' : ''}`} />
                </button>
                
                {activeDropdown === key && (
                  <div className="absolute left-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-fade-in-up">
                    {navGroups[key].links.map((link) => (
                      <Link
                        key={link.name}
                        to={link.path}
                        onClick={() => setActiveDropdown(null)}
                        className={`block px-4 py-2.5 text-sm transition-colors ${
                          isActive(link.path) 
                            ? 'text-nature-600 bg-nature-50 dark:bg-nature-900/20 font-bold' 
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {link.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <Link
              to="/about-us"
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive('/about-us') ? 'text-nature-600 bg-nature-50 dark:bg-nature-900/20' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              About Us
            </Link>

            {user && (
              <Link
                to="/history"
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive('/history')
                    ? 'text-nature-600 bg-nature-50 dark:bg-nature-900/20'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                History
              </Link>
            )}
          </div>

            {/* Right controls */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">

              {/* 🌙 Dark mode toggle */}
              <button
                onClick={toggleTheme}
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-nature-600 dark:hover:text-nature-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 transform hover:scale-110 active:scale-95"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5 transition-transform duration-500 rotate-0" />
                ) : (
                  <Moon className="w-5 h-5 transition-transform duration-500 -rotate-12" />
                )}
              </button>

              {/* 🌐 Language toggle */}
              <button
                onClick={toggleLang}
                title="Switch Language"
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-nature-600 dark:hover:text-nature-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 flex items-center gap-1.5"
              >
                <Languages className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-tighter border border-current px-1 rounded">{lang}</span>
              </button>

              {user ? (
                <>
                  {/* 🔔 Notification Bell */}
                  <div className="relative" ref={notifRef}>
                    <button
                      onClick={() => setNotifOpen(!notifOpen)}
                      className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-nature-600 dark:hover:text-nature-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 relative"
                      title="Notifications"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm notification-pulse">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </button>

                    {/* Notification Dropdown */}
                    {notifOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-fade-in-up">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                          <h3 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Bell className="w-4 h-4 text-nature-500" />
                            Notifications
                            {unreadCount > 0 && (
                              <span className="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs px-2 py-0.5 rounded-full font-semibold">
                                {unreadCount} new
                              </span>
                            )}
                          </h3>
                          {unreadCount > 0 && (
                            <button
                              onClick={markAllRead}
                              className="text-xs text-nature-600 dark:text-nature-400 hover:underline font-medium"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>

                        {/* List */}
                        <div className="max-h-72 overflow-y-auto">
                          {notifications.length === 0 ? (
                            <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
                              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                              No notifications
                            </div>
                          ) : (
                            notifications.map(n => (
                              <div
                                key={n.id}
                                className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-gray-700/50 transition-colors
                                  ${!n.isRead ? 'bg-nature-50/60 dark:bg-nature-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
                              >
                                {/* Unread dot */}
                                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${!n.isRead ? 'bg-nature-500' : 'bg-transparent'}`} />
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm leading-snug ${!n.isRead ? 'text-gray-800 dark:text-gray-100 font-medium' : 'text-gray-600 dark:text-gray-400'}`}>
                                    {n.message}
                                  </p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                <div className="flex gap-1 flex-shrink-0">
                                  {!n.isRead && (
                                    <button
                                      onClick={() => markOneRead(n.id)}
                                      title="Mark read"
                                      className="p-1 rounded hover:bg-nature-100 dark:hover:bg-nature-900/30 text-nature-500 transition-colors"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => deleteNotification(n.id)}
                                    title="Delete"
                                    className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
                            <button
                              onClick={clearNotifications}
                              className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors w-full text-center"
                            >
                              Clear all notifications
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Dashboard icon */}
                  <Link
                    to={dashboardPath}
                    title={user.role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
                    className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-nature-600 dark:hover:text-nature-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                  >
                    {user.role === 'admin' ? <Shield className="w-5 h-5 text-indigo-500" /> : <LayoutDashboard className="w-5 h-5" />}
                  </Link>

                  {/* Username */}
                  <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-200">
                    <div className="w-7 h-7 rounded-full bg-nature-100 dark:bg-nature-900/40 flex items-center justify-center text-xs font-bold text-nature-700 dark:text-nature-400">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="font-medium hidden lg:block">{user.name}</span>
                  </div>

                  {/* Logout */}
                  <button
                    onClick={logout}
                    className="text-sm font-medium text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-600 dark:text-gray-300 hover:text-nature-600 dark:hover:text-nature-400 font-medium text-sm transition-colors">
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary py-1.5 px-4 text-sm">
                    Register
                  </Link>
                </>
              )}
            </div>

          {/* Mobile hamburger */}
          <div className="flex items-center md:hidden gap-2">
            {/* Dark mode toggle on mobile */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {/* Mobile Bell */}
            {user && (
              <button className="relative p-2 text-gray-500 dark:text-gray-400" onClick={() => { setNotifOpen(!notifOpen); setIsOpen(false); }}>
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 notification-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none transition-all"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu — dark mode aware */}
      {isOpen && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-lg absolute w-full pb-4 transition-colors">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/') ? 'text-nature-600 bg-nature-50' : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => setIsOpen(false)}
            >
              Home
            </Link>

            {Object.keys(navGroups).map((key) => (
              <div key={key} className="space-y-1">
                <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest mt-4">
                  {navGroups[key].name}
                </div>
                {navGroups[key].links.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`block px-3 py-2 rounded-md text-base font-medium transition-colors
                      ${isActive(link.path)
                        ? 'text-nature-600 dark:text-nature-400 bg-nature-50 dark:bg-nature-900/20'
                        : 'text-gray-700 dark:text-gray-200 hover:text-nature-600 dark:hover:text-nature-400 hover:bg-nature-50 dark:hover:bg-gray-800'
                      }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            ))}
            
            <Link
              to="/about-us"
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                isActive('/about-us')
                  ? 'text-nature-600 dark:text-nature-400 bg-nature-50 dark:bg-nature-900/20'
                  : 'text-gray-700 dark:text-gray-200 hover:text-nature-600 dark:hover:text-nature-400 hover:bg-nature-50 dark:hover:bg-gray-800'
              }`}
              onClick={() => setIsOpen(false)}
            >
              About Us
            </Link>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 pb-1 space-y-2">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-3 text-gray-800 dark:text-gray-200 mb-2">
                    <div className="w-7 h-7 rounded-full bg-nature-100 dark:bg-nature-900/40 flex items-center justify-center text-xs font-bold text-nature-700 dark:text-nature-400">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="font-medium">{user.name}</span>
                    {user.role === 'admin' && <Shield className="w-4 h-4 text-indigo-500" />}
                  </div>
                  <Link
                    to={dashboardPath}
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-nature-600 hover:bg-nature-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {user.role === 'admin' ? 'Admin Dashboard' : 'My Dashboard'}
                  </Link>
                  <Link
                    to="/history"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-nature-600 hover:bg-nature-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    History
                  </Link>
                  <button
                    onClick={() => { logout(); setIsOpen(false); }}
                    className="w-full text-left block text-base font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-2 rounded-md transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 px-3">
                  <Link
                    to="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center px-4 py-2 border border-nature-600 dark:border-nature-500 text-nature-600 dark:text-nature-400 rounded-md font-medium hover:bg-nature-50 dark:hover:bg-nature-900/20 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center px-4 py-2 rounded-md font-medium btn-primary"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
