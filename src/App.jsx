import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppDataProvider } from './context/AppDataContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { AuthGate } from './components/AuthGate.jsx'
import { ToastProvider } from './components/Toast.jsx'
import { MainLayout } from './layout/MainLayout.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { CustomersPage } from './pages/CustomersPage.jsx'
import { CustomerNewPage } from './pages/CustomerNewPage.jsx'
import { CustomerDetailPage } from './pages/CustomerDetailPage.jsx'
import { PersonalColorFormPage } from './pages/PersonalColorFormPage.jsx'
import { MakeupConsultFormPage } from './pages/MakeupConsultFormPage.jsx'
import { AppointmentsPage } from './pages/AppointmentsPage.jsx'
import { AppointmentFormPage } from './pages/AppointmentFormPage.jsx'
import { MakeupHubPage } from './pages/MakeupHubPage.jsx'
import { AdminPage } from './pages/AdminPage.jsx'
import { CustomerPortalPage } from './pages/CustomerPortalPage.jsx'

/** Staff area. Mounted only once the server has confirmed a session. */
function StudioRoutes() {
  return (
    <AuthGate>
      <AppDataProvider>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/new" element={<CustomerNewPage />} />
            <Route path="/customers/:customerId" element={<CustomerDetailPage />} />
            <Route
              path="/customers/:customerId/personal/new"
              element={<PersonalColorFormPage mode="new" />}
            />
            <Route
              path="/customers/:customerId/personal/:sessionId"
              element={<PersonalColorFormPage mode="edit" />}
            />
            <Route
              path="/customers/:customerId/consult/new"
              element={<MakeupConsultFormPage mode="new" />}
            />
            <Route
              path="/customers/:customerId/consult/:sessionId"
              element={<MakeupConsultFormPage mode="edit" />}
            />
            <Route path="/appointments" element={<AppointmentsPage />} />
            <Route path="/appointments/new" element={<AppointmentFormPage mode="new" />} />
            <Route
              path="/appointments/:appointmentId/edit"
              element={<AppointmentFormPage mode="edit" />}
            />
            <Route path="/makeup" element={<MakeupHubPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppDataProvider>
    </AuthGate>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public: customers open this with a link, no studio login. */}
            <Route path="/result/:customerId" element={<CustomerPortalPage />} />
            <Route path="/*" element={<StudioRoutes />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
