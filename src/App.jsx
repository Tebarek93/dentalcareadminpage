import {
  BrowserRouter,
  Routes,
  Route,
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

          <Route
            index
            element={<Dashboard />}
          />
          <Route
            path="/admin/appointments"
            element={<Appointments />}
          />
          <Route
            path="/admin/patients"
            element={<Patients />}
          />
        <Route
          path="/admin/doctors"
          element={<Doctors />}
        />
        <Route
         path="/admin/services" 
         element={<Services />} />

         <Route
          path="/admin/schedule"
          element={<Schedule />}
        />

        <Route
          path="/admin/payments"
          element={<Payments />}
        />
        <Route
          path="/admin/settings"
          element={<Settings />}
        />

        </Route>

      </Routes>

    </BrowserRouter>
  );
}