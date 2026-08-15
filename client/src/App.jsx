import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Sidebar from './components/Sidebar';
import GenerateOffer from './pages/GenerateOffer';
import Dashboard from './pages/Dashboard';
import OfferDetail from './pages/OfferDetail';
import EditOffer from './pages/EditOffer';
import Candidates from './pages/Candidates';
import Templates from './pages/Templates';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import NotFound from './pages/NotFound';
import Respond from './pages/Respond';
import AdminDashboard from './pages/AdminDashboard';
import AuditLog from './pages/AuditLog';
import UserManagementPage from './pages/UserManagementPage';
import SystemHealthPage from './pages/SystemHealthPage';
import AllOffersPage from './pages/AllOffersPage';
import ProtectedRoute from './components/ProtectedRoute';
import { getAuthUser } from './utils/auth';

function AppLayout() {
  const location = useLocation();
  const authRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
  const isAuthPage = authRoutes.includes(location.pathname);
  const user = getAuthUser();
  const effectiveRole = user?.role;
  const defaultDashboard = effectiveRole === 'admin' ? '/admin/dashboard' : '/manager/dashboard';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F0F2F8', fontFamily: 'var(--font-sans)', position: 'relative', overflow: 'hidden' }}>
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'var(--color-heading)',
            color: '#fff',
            fontFamily: 'var(--font-sans)',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(27,20,69,0.3)',
          },
          success: { iconTheme: { primary: '#10B981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#fff' } },
        }} 
      />
      
      {/* Ambient background glows for non-auth pages */}
      {!isAuthPage && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
          <div className="glow glow-purple" style={{ width: 800, height: 800, top: -200, right: -100, opacity: 0.15 }} />
          <div className="glow glow-orange" style={{ width: 600, height: 600, bottom: -100, left: 100, opacity: 0.1 }} />
        </div>
      )}

      {/* Fixed left sidebar (hide on auth pages) */}
      {!isAuthPage && <Sidebar />}

      {/* Main scrollable content */}
      <div style={{ flex: 1, marginLeft: isAuthPage ? 0 : 260, display: 'flex', flexDirection: 'column', minHeight: '100vh', transition: 'margin-left 0.2s', position: 'relative', zIndex: 1 }}>
        <main style={{ flex: 1, padding: isAuthPage ? 0 : '1.5rem 1.5rem', maxWidth: isAuthPage ? 'none' : 1440, margin: '0 auto', width: '100%' }}>
          <Routes>
            <Route path="/login"             element={<Login onLogin={() => window.location.href = '/'} />} />
            <Route path="/signup"            element={<SignUp />} />
            <Route path="/forgot-password"   element={<ForgotPassword />} />
            <Route path="/reset-password"    element={<ResetPassword />} />
            
            {/* Candidate Public Route */}
            <Route path="/respond/:token"    element={<Respond />} />
            
            {/* Protected Routes */}
            <Route path="/"                  element={<Navigate to={user ? defaultDashboard : '/login'} replace />} />
            <Route path="/manager/dashboard" element={<ProtectedRoute allowedRoles={['manager', 'admin']}><Dashboard /></ProtectedRoute>} />
            <Route path="/admin/dashboard"   element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/audit"       element={<ProtectedRoute allowedRoles={['admin']}><AuditLog /></ProtectedRoute>} />
            <Route path="/admin/users"       element={<ProtectedRoute allowedRoles={['admin']}><UserManagementPage /></ProtectedRoute>} />
            <Route path="/admin/health"      element={<ProtectedRoute allowedRoles={['admin']}><SystemHealthPage /></ProtectedRoute>} />
            <Route path="/admin/offers"      element={<ProtectedRoute allowedRoles={['admin']}><AllOffersPage /></ProtectedRoute>} />
            <Route path="/generate"          element={<ProtectedRoute allowedRoles={['manager', 'admin']}><GenerateOffer /></ProtectedRoute>} />
            <Route path="/offers/:id"        element={<ProtectedRoute><OfferDetail /></ProtectedRoute>} />
            <Route path="/offers/:id/edit"   element={<ProtectedRoute><EditOffer /></ProtectedRoute>} />
            <Route path="/candidates"        element={<ProtectedRoute><Candidates /></ProtectedRoute>} />
            <Route path="/templates"         element={<ProtectedRoute><Templates /></ProtectedRoute>} />
            
            <Route path="*"                  element={<NotFound />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppLayout />
    </Router>
  );
}

export default App;
