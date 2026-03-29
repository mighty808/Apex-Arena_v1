import { Routes, Route, Outlet, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PageTransition from "./components/PageTransition";
import DashboardLayout from "./components/DashboardLayout";
import CreateTournament from "./pages/auth/organizer/create-tournament";
import JoinTournament from "./pages/auth/player/join-tournament";
import Landing from "./pages/public/landing";
import Profile from "./pages/public/profile";
import NotFound from "./pages/public/not-found";
import ForgotPassword from "./pages/public/forgot";
import Register from "./pages/public/register";
import Login from "./pages/public/login";
import Dashboard from "./pages/auth/Dashboard";
import VerifyOtp from "./pages/public/verify-otp";
import ProtectedRoute from "./components/ProtectedRoute";

// Admin
import AdminLogin from "./pages/admin/login";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";

/** Public layout — Navbar + Footer */
const PublicLayout = () => {
  const location = useLocation();

  return (
    <div className="min-h-dvh flex flex-col bg-transparent text-slate-100">
      <Navbar />
      <main className="flex-1">
        <PageTransition key={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <Routes>
      {/* Public pages with Navbar + Footer */}
      <Route element={<PublicLayout />}>
        <Route index element={<Landing />} />
        <Route path="signup" element={<Register />} />
        <Route path="login" element={<Login />} />
        <Route path="forgot" element={<ForgotPassword />} />
        <Route path="verify-otp" element={<VerifyOtp />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Authenticated pages with Sidebar layout */}
      <Route path="auth" element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="organizer">
            <Route path="profile" element={<Profile />} />
            <Route path="create-tournament" element={<CreateTournament />} />
          </Route>
          <Route path="player">
            <Route path="profile" element={<Profile />} />
            <Route path="join-tournament" element={<JoinTournament />} />
          </Route>
        </Route>
      </Route>

      {/* Admin — standalone login (no layout wrapper) */}
      <Route path="admin/login" element={<AdminLogin />} />

      {/* Admin — authenticated pages with admin layout */}
      <Route path="admin" element={<AdminProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;
