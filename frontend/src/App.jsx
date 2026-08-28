import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import AlertsPage from './pages/AlertsPage';
import DashboardPage from './pages/DashboardPage';
import InspectionHistoryPage from './pages/InspectionHistoryPage';
import InspectionPage from './pages/InspectionPage';
import LoginPage from './pages/LoginPage';
import NCRPage from './pages/NcrPage';
import ProductsPage from './pages/ProductsPage';

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function RoleRoute({ children, allowedRoles = ['ADMIN', 'QC', 'PRODUCTION'] }) {
  const { token, hasRole } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  const { token } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<RoleRoute><DashboardPage /></RoleRoute>} />
          <Route path="/products" element={<RoleRoute allowedRoles={['ADMIN', 'QC', 'PRODUCTION']}><ProductsPage /></RoleRoute>} />
          <Route path="/inspection-history" element={<RoleRoute allowedRoles={['ADMIN', 'QC', 'PRODUCTION']}><InspectionHistoryPage /></RoleRoute>} />
          <Route path="/incoming-qc" element={<RoleRoute allowedRoles={['ADMIN', 'QC']}><InspectionPage type="Incoming" /></RoleRoute>} />
          <Route path="/in-process-qc" element={<RoleRoute allowedRoles={['ADMIN', 'QC']}><InspectionPage type="In-process" /></RoleRoute>} />
          <Route path="/final-qc" element={<RoleRoute allowedRoles={['ADMIN', 'QC']}><InspectionPage type="Final" /></RoleRoute>} />
          <Route path="/alerts" element={<RoleRoute allowedRoles={['ADMIN', 'QC', 'PRODUCTION']}><AlertsPage /></RoleRoute>} />
          <Route path="/ncrs" element={<RoleRoute allowedRoles={['ADMIN', 'QC', 'PRODUCTION']}><NCRPage /></RoleRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
