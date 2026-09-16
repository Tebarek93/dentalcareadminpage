import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import AdminLogin from "./admin/pages/AdminLogin";
import Dashboard from "./admin/pages/Dashboard";

import AdminLayout from "./admin/components/AdminLayout";
import AdminProtectedRoute from "./admin/AdminProtectedRoute";

import Appointments from "./admin/pages/Appointments";
import Patients from "./admin/pages/Patients";
import Doctors from "./admin/pages/Doctors";
import Services from "./admin/pages/Services";
import Schedule from "./admin/pages/Schedule";
import Payments from "./admin/pages/Payments";
import Settings from "./admin/pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =================================
            DEFAULT PAGE
        ================================= */}
        <Route
          path="/"
          element={<Navigate to="/admin/login" replace />}
        />

        {/* =================================
            ADMIN LOGIN
        ================================= */}
        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        {/* =================================
            ADMIN PANEL
        ================================= */}
        <Route
          path="/admin"
          element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }
        >

          {/* /admin */}
          <Route
            index
            element={<Dashboard />}
          />

          {/* /admin/appointments */}
          <Route
            path="appointments"
            element={<Appointments />}
          />

          {/* /admin/patients */}
          <Route
            path="patients"
            element={<Patients />}
          />

          {/* /admin/doctors */}
          <Route
            path="doctors"
            element={<Doctors />}
          />

          {/* /admin/services */}
          <Route
            path="services"
            element={<Services />}
          />

          {/* /admin/schedule */}
          <Route
            path="schedule"
            element={<Schedule />}
          />

          {/* /admin/payments */}
          <Route
            path="payments"
            element={<Payments />}
          />

          {/* /admin/settings */}
          <Route
            path="settings"
            element={<Settings />}
          />

        </Route>

        {/* =================================
            UNKNOWN PAGE
        ================================= */}
        <Route
          path="*"
          element={<Navigate to="/admin/login" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}