import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import CustomerDashboard from './pages/customer/Dashboard'
import CustomerProfile from './pages/customer/Profile'
import CustomerContracts from './pages/customer/Contracts'
import CustomerBills from './pages/customer/Bills'
import BillOptimal from './pages/customer/BillOptimal'
import BillHistory from './pages/customer/BillHistory'
import CustomerTickets from './pages/customer/Tickets'
import AdminDashboard from './pages/admin/Dashboard'
import AdminLegalCustomers from './pages/admin/LegalCustomers'
import AdminRealCustomers from './pages/admin/RealCustomers'
import AdminContracts from './pages/admin/AdminContracts'
import AdminMarketRates from './pages/admin/AdminMarketRates'
import AdminTariffs from './pages/admin/AdminTariffs'
import AdminTouSchedule from './pages/admin/AdminTouSchedule'
import AdminBillReports from './pages/admin/AdminBillReports'
import AdminPendingUsers from './pages/admin/AdminPendingUsers'
import AdminTickets from './pages/admin/AdminTickets'
import AdminAnnouncements from './pages/admin/AdminAnnouncements'
import AdminPowerEntities from './pages/admin/AdminPowerEntities'
import AdminTariffCodes from './pages/admin/AdminTariffCodes'
import AdminTariffPenalties from './pages/admin/AdminTariffPenalties'
import AdminUsers from './pages/admin/AdminUsers'
import AdminRoles from './pages/admin/AdminRoles'
import AdminOrders from './pages/admin/AdminOrders'
import AdminBillAnalysis from './pages/admin/AdminBillAnalysis'
import AdminTooltips from './pages/admin/AdminTooltips'
import AdminReportContracts from './pages/admin/reports/AdminReportContracts'
import AdminReportOrders from './pages/admin/reports/AdminReportOrders'
import AdminReportPayments from './pages/admin/reports/AdminReportPayments'
import AdminReportSavings from './pages/admin/reports/AdminReportSavings'
import CustomerOrders from './pages/customer/Orders'
import CustomerSavings from './pages/customer/CustomerSavings'
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
        <Route path="bills/optimal" element={<BillOptimal />} />
        <Route path="bills/history" element={<BillHistory />} />
        <Route path="tickets"  element={<CustomerTickets />} />
        <Route path="orders"   element={<CustomerOrders />} />
        <Route path="savings"  element={<CustomerSavings />} />
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
        <Route path="tou-schedule"  element={<AdminTouSchedule />} />
        <Route path="bill-reports"    element={<AdminBillReports />} />
        <Route path="tickets"         element={<AdminTickets />} />
        <Route path="announcements"   element={<AdminAnnouncements />} />
        <Route path="pending-users"   element={<AdminPendingUsers />} />
        <Route path="power-entities"  element={<AdminPowerEntities />} />
        <Route path="tariff-codes"       element={<AdminTariffCodes />} />
        <Route path="tariff-penalties"   element={<AdminTariffPenalties />} />
        <Route path="users"           element={<AdminUsers />} />
        <Route path="roles"           element={<AdminRoles />} />
        <Route path="orders"             element={<AdminOrders />} />
        <Route path="bill-analysis"      element={<AdminBillAnalysis />} />
        <Route path="tooltips"           element={<AdminTooltips />} />
        <Route path="reports/contracts" element={<AdminReportContracts />} />
        <Route path="reports/orders"    element={<AdminReportOrders />} />
        <Route path="reports/payments"  element={<AdminReportPayments />} />
        <Route path="reports/savings"   element={<AdminReportSavings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
