import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import CustomerDashboard from './pages/customer/Dashboard'
import CustomerProfile from './pages/customer/Profile'
import CustomerContracts from './pages/customer/Contracts'
import CustomerBills from './pages/customer/Bills'
import CustomerTickets from './pages/customer/Tickets'
import AdminDashboard from './pages/admin/Dashboard'
import AdminLegalCustomers from './pages/admin/LegalCustomers'
import AdminRealCustomers from './pages/admin/RealCustomers'
import AdminContracts from './pages/admin/AdminContracts'
import AdminMarketRates from './pages/admin/AdminMarketRates'
import AdminTariffs from './pages/admin/AdminTariffs'
import AdminTariffSlabs from './pages/admin/AdminTariffSlabs'
import AdminTouSchedule from './pages/admin/AdminTouSchedule'
import AdminBillReports from './pages/admin/AdminBillReports'
import Register from './pages/Register'

function ProtectedRoute({ children, role }: { children: JSX.Element; role?: 'admin' | 'customer' }) {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role && user?.role !== role) return <Navigate to="/" replace />
  return children
}

function RootRedirect() {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/customer/dashboard'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<RootRedirect />} />

      {/* Customer */}
      <Route
        path="/customer"
        element={
          <ProtectedRoute role="customer">
            <Layout role="customer" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CustomerDashboard />} />
        <Route path="profile" element={<CustomerProfile />} />
        <Route path="contracts" element={<CustomerContracts />} />
        <Route path="bills" element={<CustomerBills />} />
        <Route path="tickets" element={<CustomerTickets />} />
      </Route>

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <Layout role="admin" />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="legal-customers" element={<AdminLegalCustomers />} />
        <Route path="real-customers" element={<AdminRealCustomers />} />
        <Route path="contracts"     element={<AdminContracts />} />
        <Route path="market-rates"  element={<AdminMarketRates />} />
        <Route path="tariffs"       element={<AdminTariffs />} />
        <Route path="tariff-slabs"  element={<AdminTariffSlabs />} />
        <Route path="tou-schedule"  element={<AdminTouSchedule />} />
        <Route path="bill-reports"  element={<AdminBillReports />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
