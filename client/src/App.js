import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TranslationProvider } from './context/TranslationContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Always-loaded Components (needed immediately)
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import SkeletonLoader from './components/SkeletonLoader';
import ScrollToTop from './components/ScrollToTop';
import SEO from './components/SEO';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalErrorHandler from './components/GlobalErrorHandler';

// Lazy-loaded Pages (code-split for performance)
const Home = React.lazy(() => import('./pages/Home'));
const AboutUs = React.lazy(() => import('./pages/AboutUs'));
const Community = React.lazy(() => import('./pages/Community'));
const Contact = React.lazy(() => import('./pages/Contact'));
const CropRecommendation = React.lazy(() => import('./pages/CropRecommendation'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const DiseasePrediction = React.lazy(() => import('./pages/DiseasePrediction'));
const ExpertDashboard = React.lazy(() => import('./pages/ExpertDashboard'));
const Experts = React.lazy(() => import('./pages/Experts'));
const FarmerBookings = React.lazy(() => import('./pages/FarmerBookings'));
const FarmCalendar = React.lazy(() => import('./pages/FarmCalendar'));
const FarmMap = React.lazy(() => import('./pages/FarmMap'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const History = React.lazy(() => import('./pages/History'));
const Login = React.lazy(() => import('./pages/Login'));
const MarketPrediction = React.lazy(() => import('./pages/MarketPrediction'));
const MyAppointments = React.lazy(() => import('./pages/MyAppointments'));
const PrivacyPolicy = React.lazy(() => import('./pages/PrivacyPolicy'));
const Register = React.lazy(() => import('./pages/Register'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const Reviews = React.lazy(() => import('./pages/Reviews'));
const TermsOfService = React.lazy(() => import('./pages/TermsOfService'));
const UserDashboard = React.lazy(() => import('./pages/UserDashboard'));
const VerifyEmail = React.lazy(() => import('./pages/VerifyEmail'));
const WeatherMonitor = React.lazy(() => import('./pages/WeatherMonitor'));
const YieldPrediction = React.lazy(() => import('./pages/YieldPrediction'));
const SatelliteMonitor = React.lazy(() => import('./pages/SatelliteMonitor'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminPanel = React.lazy(() => import('./pages/AdminPanel'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const ExpertDetail = React.lazy(() => import('./pages/ExpertDetail'));
const FarmCalendarPage = FarmCalendar;

// Page loading fallback
const PageLoader = () => (
  <div className="max-w-7xl mx-auto px-4 py-12">
    <SkeletonLoader type="card" count={3} />
  </div>
);

// Routes Component to force remounting when path changes
function AppRoutes() {
  const { pathname } = useLocation();
  
  return (
    <Suspense fallback={<PageLoader />} key={pathname}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/community" element={<Community />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/crop-recommendation" element={<CropRecommendation />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/disease-prediction" element={<DiseasePrediction />} />
        <Route path="/expert-dashboard" element={<ExpertDashboard />} />
        <Route path="/experts" element={<Experts />} />
        <Route path="/farmer-bookings" element={<FarmerBookings />} />
        <Route path="/farm-calendar" element={<FarmCalendarPage />} />
        <Route path="/farm-map" element={<FarmMap />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/history" element={<History />} />
        <Route path="/login" element={<Login />} />
        <Route path="/market-prediction" element={<MarketPrediction />} />
        <Route path="/my-appointments" element={<MyAppointments />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/weather-monitor" element={<WeatherMonitor />} />
        <Route path="/yield-prediction" element={<YieldPrediction />} />
        <Route path="/satellite-monitor" element={<SatelliteMonitor />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/expert-detail/:id" element={<ExpertDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <TranslationProvider>
          <NotificationProvider>
            <ErrorBoundary>
              <Router>
                <ScrollToTop />
                <SEO />
                <GlobalErrorHandler />
                <div className="flex flex-col min-h-screen transition-colors duration-300">
                <header>
                  <Navbar />
                </header>
                <main className="flex-grow">
                  <AppRoutes />
                </main>
                <Footer />
                <Suspense fallback={null}>
                  {/* <DbStatus /> */}
                  {/* <Chatbot /> */}
                </Suspense>
                <ToastContainer position="bottom-right" theme="colored" limit={4} newestOnTop />
              </div>
            </Router>
          </ErrorBoundary>
        </NotificationProvider>
        </TranslationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
