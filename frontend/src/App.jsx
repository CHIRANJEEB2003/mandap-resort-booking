import { Routes, Route, Navigate } from 'react-router-dom';
import { Component, Suspense, lazy } from 'react';
import { useAuthStore } from './context/authStore';
import LoadingSpinner from './components/ui/LoadingSpinner';

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', textAlign: 'center' }}>
          <h2 style={{ color: '#1E3B0E', marginBottom: '0.5rem' }}>Something went wrong</h2>
          <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {this.state.error.message}
          </p>
          <button onClick={() => { this.setState({ error: null }); window.location.href = '/'; }}
            style={{ background: '#1E3B0E', color: '#fff', border: 'none', padding: '0.5rem 1.5rem', borderRadius: '0.5rem', cursor: 'pointer' }}>
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Public pages
const HomePage = lazy(() => import('./pages/public/HomePage'));
const SearchResultsPage = lazy(() => import('./pages/public/SearchResultsPage'));
const PropertyDetailPage = lazy(() => import('./pages/public/PropertyDetailPage'));
const LoginPage = lazy(() => import('./pages/public/LoginPage'));
const RegisterPage = lazy(() => import('./pages/public/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/public/ForgotPasswordPage'));
const RoomBrowsePage = lazy(() => import('./pages/public/RoomBrowsePage'));
const ResortRoomsPage = lazy(() => import('./pages/public/ResortRoomsPage'));
const WeddingInvitationsPage = lazy(() => import('./pages/public/WeddingInvitationsPage'));
const WeddingServicesPage = lazy(() => import('./pages/public/WeddingServicesPage'));

// Customer pages
const CustomerLayout = lazy(() => import('./components/layout/CustomerLayout'));
const CustomerDashboard = lazy(() => import('./pages/customer/CustomerDashboard'));
const MyBookings = lazy(() => import('./pages/customer/MyBookings'));
const BookingDetail = lazy(() => import('./pages/customer/BookingDetail'));
const BookingFlow = lazy(() => import('./pages/customer/BookingFlow'));
const RoomBookings = lazy(() => import('./pages/customer/RoomBookings'));
const RoomBookingDetail = lazy(() => import('./pages/customer/RoomBookingDetail'));
const CustomerProfile = lazy(() => import('./pages/customer/CustomerProfile'));
const PaymentPage = lazy(() => import('./pages/customer/PaymentPage'));
const CustomerNotifications = lazy(() => import('./pages/customer/CustomerNotifications'));

// Owner pages
const OwnerLayout = lazy(() => import('./components/layout/OwnerLayout'));
const OwnerDashboard = lazy(() => import('./pages/owner/OwnerDashboard'));
const OwnerProperties = lazy(() => import('./pages/owner/OwnerProperties'));
const AddEditProperty = lazy(() => import('./pages/owner/AddEditProperty'));
const OwnerBookings = lazy(() => import('./pages/owner/OwnerBookings'));
const OwnerBookingDetail = lazy(() => import('./pages/owner/OwnerBookingDetail'));
const OwnerProfile = lazy(() => import('./pages/owner/OwnerProfile'));
const OwnerRevenue = lazy(() => import('./pages/owner/OwnerRevenue'));
const OwnerCalendar = lazy(() => import('./pages/owner/OwnerCalendar'));
const StaffManager = lazy(() => import('./pages/owner/StaffManager'));
const ResourceManager = lazy(() => import('./pages/owner/ResourceManager'));
const PackageManager = lazy(() => import('./pages/owner/PackageManager'));
const OwnerRooms = lazy(() => import('./pages/owner/OwnerRooms'));

// Admin pages
const AdminLayout = lazy(() => import('./components/layout/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const OwnerVerification = lazy(() => import('./pages/admin/OwnerVerification'));
const OwnerVerificationDetail = lazy(() => import('./pages/admin/OwnerVerificationDetail'));
const PropertyVerification = lazy(() => import('./pages/admin/PropertyVerification'));
const PropertyVerificationDetail = lazy(() => import('./pages/admin/PropertyVerificationDetail'));
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings'));
const AdminFinance = lazy(() => import('./pages/admin/AdminFinance'));
const AdminReports = lazy(() => import('./pages/admin/AdminReports'));
const AuditLogs = lazy(() => import('./pages/admin/AuditLogs'));
const LocationManager = lazy(() => import('./pages/admin/LocationManager'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const RegisterOwner = lazy(() => import('./pages/admin/RegisterOwner'));
const ManageResortOwners = lazy(() => import('./pages/admin/ManageResortOwners'));
const ManageMandapOwners = lazy(() => import('./pages/admin/ManageMandapOwners'));
const ManageResorts = lazy(() => import('./pages/admin/ManageResorts'));
const ManageMandaps = lazy(() => import('./pages/admin/ManageMandaps'));
const AdminRooms = lazy(() => import('./pages/admin/AdminRooms'));
const AdminMenuManagement = lazy(() => import('./pages/admin/AdminMenuManagement'));
const AdminAllAssets = lazy(() => import('./pages/admin/AdminAllAssets'));
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminAddVenue = lazy(() => import('./pages/admin/AddEditVenue'));
const MenuCustomizationPage = lazy(() => import('./pages/customer/MenuCustomizationPage'));
const WeddingPackagesPage = lazy(() => import('./pages/owner/WeddingPackagesPage'));
const ExploreWeddingPackages = lazy(() => import('./pages/customer/ExploreWeddingPackages'));
const AdminWeddingPackages = lazy(() => import('./pages/admin/AdminWeddingPackages'));

const ProtectedRoute = ({ children, role }) => {
  const { user, token } = useAuthStore();
  if (!token) {
    // No session — send admin candidates to admin login, others to client login
    return <Navigate to={role === 'ADMIN' ? '/admin/login' : '/login'} replace />;
  }
  if (role && user?.role !== role) {
    // Wrong role — redirect to that role's home instead of falling to /
    if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (user?.role === 'OWNER') return <Navigate to="/owner" replace />;
    return <Navigate to="/customer" replace />;
  }
  return children;
};

const PageFallback = () => <LoadingSpinner text="Loading…" />;

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/venue/:slug" element={<PropertyDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/room-booking" element={<RoomBrowsePage />} />
          <Route path="/room-booking/:propertyId" element={<ResortRoomsPage />} />
          <Route path="/wedding-invitations" element={<WeddingInvitationsPage />} />
          <Route path="/wedding-services" element={<WeddingServicesPage />} />

          {/* Customer */}
          <Route path="/customer" element={
            <ProtectedRoute role="CUSTOMER"><CustomerLayout /></ProtectedRoute>
          }>
            <Route index element={<CustomerDashboard />} />
            <Route path="bookings" element={<MyBookings />} />
            <Route path="bookings/:id" element={<BookingDetail />} />
            <Route path="room-bookings" element={<RoomBookings />} />
            <Route path="room-bookings/:id" element={<RoomBookingDetail />} />
            <Route path="menu" element={<MenuCustomizationPage />} />
            <Route path="profile" element={<CustomerProfile />} />
            <Route path="notifications" element={<CustomerNotifications />} />
          </Route>
          <Route path="/book/:slug" element={
            <ProtectedRoute role="CUSTOMER"><BookingFlow /></ProtectedRoute>
          } />
          <Route path="/payment/:bookingId" element={
            <ProtectedRoute role="CUSTOMER"><PaymentPage /></ProtectedRoute>
          } />

          {/* Owner */}
          <Route path="/owner" element={
            <ProtectedRoute role="OWNER"><OwnerLayout /></ProtectedRoute>
          }>
            <Route index element={<OwnerDashboard />} />
            <Route path="properties" element={<OwnerProperties />} />
            <Route path="properties/new" element={<AddEditProperty />} />
            <Route path="properties/:id/edit" element={<AddEditProperty />} />
            <Route path="bookings" element={<OwnerBookings />} />
            <Route path="bookings/:id" element={<OwnerBookingDetail />} />
            <Route path="revenue" element={<OwnerRevenue />} />
            <Route path="calendar" element={<OwnerCalendar />} />
            <Route path="staff" element={<StaffManager />} />
            <Route path="resources" element={<ResourceManager />} />
            <Route path="packages" element={<PackageManager />} />
            <Route path="rooms" element={<OwnerRooms />} />
            <Route path="wedding" element={<WeddingPackagesPage />} />
            <Route path="profile" element={<OwnerProfile />} />
          </Route>

          {/* Admin */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={
            <ProtectedRoute role="ADMIN"><AdminLayout /></ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="owners/verify" element={<OwnerVerification />} />
            <Route path="owners/verify/:id" element={<OwnerVerificationDetail />} />
            <Route path="properties/verify" element={<PropertyVerification />} />
            <Route path="properties/verify/:id" element={<PropertyVerificationDetail />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="room-bookings" element={<AdminRooms />} />
            <Route path="finance" element={<AdminFinance />} />
            <Route path="reports" element={<AdminReports />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="locations" element={<LocationManager />} />
            <Route path="register-owner" element={<RegisterOwner />} />
            <Route path="resort-owners" element={<ManageResortOwners />} />
            <Route path="mandap-owners" element={<ManageMandapOwners />} />
            <Route path="resorts" element={<ManageResorts />} />
            <Route path="mandaps" element={<ManageMandaps />} />
            <Route path="rooms" element={<AdminRooms />} />
            <Route path="assets" element={<AdminAllAssets />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="menus" element={<AdminMenuManagement />} />
            <Route path="add-venue" element={<AdminAddVenue />} />
            <Route path="add-venue/:id" element={<AdminAddVenue />} />
            <Route path="wedding-packages" element={<AdminWeddingPackages />} />
          </Route>

          {/* Public wedding packages */}
          <Route path="/wedding-packages" element={<ExploreWeddingPackages />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
