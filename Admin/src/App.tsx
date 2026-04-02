import { Navigate, Route, Routes } from "react-router-dom";
import AdminLogin from "./pages/admin/login";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import GamesManagement from "./pages/admin/GamesManagement";
import OrganizerVerifications from "./pages/admin/OrganizerVerifications";
import AdminProfile from "./pages/admin/AdminProfile";

const App = () => {
  return (
    <Routes>
      {/* Public admin login */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Authenticated admin area */}
      <Route path="/admin" element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="games" element={<GamesManagement />} />
          <Route path="verifications" element={<OrganizerVerifications />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
};

export default App;
