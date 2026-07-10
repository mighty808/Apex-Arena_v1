import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ── Static imports ─────────────────────────────────────────────────────────────
// Layout shells and gate components render on every route — keep them static.
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import AdminLayout from "./components/admin/AdminLayout";
import { AdminNotificationProvider } from "./lib/admin-notification-context";

// ── Lazy page imports ──────────────────────────────────────────────────────────
// Each page becomes its own JS chunk, downloaded only when first visited.
const AdminLogin            = lazy(() => import("./pages/admin/login"));
const AdminDashboard        = lazy(() => import("./pages/admin/Dashboard"));
const UserManagement        = lazy(() => import("./pages/admin/UserManagement"));
const GamesManagement       = lazy(() => import("./pages/admin/GamesManagement"));
const OrganizerVerifications = lazy(() => import("./pages/admin/OrganizerVerifications"));
const AdminProfile          = lazy(() => import("./pages/admin/AdminProfile"));
const PayoutsManagement     = lazy(() => import("./pages/admin/PayoutsManagement"));
const EscrowManagement      = lazy(() => import("./pages/admin/EscrowManagement"));
const SchedulerManagement   = lazy(() => import("./pages/admin/SchedulerManagement"));
const AuditLogs             = lazy(() => import("./pages/admin/AuditLogs"));
const AdminManagement       = lazy(() => import("./pages/admin/AdminManagement"));
const GameRequests          = lazy(() => import("./pages/admin/GameRequests"));
const DisputeManagement     = lazy(() => import("./pages/admin/DisputeManagement"));
const TournamentManagement  = lazy(() => import("./pages/admin/TournamentManagement"));
const TournamentDetail      = lazy(() => import("./pages/admin/TournamentDetail"));
const AdminNotifications    = lazy(() => import("./pages/admin/AdminNotifications"));
const CommunityModeration   = lazy(() => import("./pages/admin/CommunityModeration"));
const TeamsOversight        = lazy(() => import("./pages/admin/TeamsOversight"));

// ── Suspense fallback ─────────────────────────────────────────────────────────
const PageFallback = () => (
  <div className="min-h-screen bg-slate-950" aria-hidden="true" />
);

const App = () => {
  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        style={{
          "--toastify-color-dark": "#1e293b",
          "--toastify-color-light": "#94a3b8",
          "--toastify-color-info": "#0ea5e9",
          "--toastify-color-success": "#0ea5e9",
          "--toastify-color-warning": "#f59e0b",
          "--toastify-color-error": "#ef4444",
          "--toastify-text-color-light": "#f1f5f9",
          "--toastify-text-color-dark": "#f1f5f9",
          fontFamily: "'Space Grotesk', sans-serif",
        } as React.CSSProperties}
      />
      <Routes>
        {/* Public admin login */}
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<PageFallback />}>
              <AdminLogin />
            </Suspense>
          }
        />

        {/* Authenticated admin area */}
        <Route path="/admin" element={<AdminProtectedRoute />}>
          <Route element={<AdminNotificationProvider><AdminLayout /></AdminNotificationProvider>}>
            <Route
              index
              element={
                <Suspense fallback={<PageFallback />}>
                  <AdminDashboard />
                </Suspense>
              }
            />
            <Route path="users" element={<Suspense fallback={<PageFallback />}><UserManagement /></Suspense>} />
            <Route path="games" element={<Suspense fallback={<PageFallback />}><GamesManagement /></Suspense>} />
            <Route path="tournaments" element={<Suspense fallback={<PageFallback />}><TournamentManagement /></Suspense>} />
            <Route path="tournaments/:tournamentId" element={<Suspense fallback={<PageFallback />}><TournamentDetail /></Suspense>} />
            <Route path="verifications" element={<Suspense fallback={<PageFallback />}><OrganizerVerifications /></Suspense>} />
            <Route path="profile" element={<Suspense fallback={<PageFallback />}><AdminProfile /></Suspense>} />
            <Route path="payouts" element={<Suspense fallback={<PageFallback />}><PayoutsManagement /></Suspense>} />
            <Route path="escrow" element={<Suspense fallback={<PageFallback />}><EscrowManagement /></Suspense>} />
            <Route path="scheduler" element={<Suspense fallback={<PageFallback />}><SchedulerManagement /></Suspense>} />
            <Route path="audit-logs" element={<Suspense fallback={<PageFallback />}><AuditLogs /></Suspense>} />
            <Route path="admins" element={<Suspense fallback={<PageFallback />}><AdminManagement /></Suspense>} />
            <Route path="game-requests" element={<Suspense fallback={<PageFallback />}><GameRequests /></Suspense>} />
            <Route path="disputes" element={<Suspense fallback={<PageFallback />}><DisputeManagement /></Suspense>} />
            <Route path="notifications" element={<Suspense fallback={<PageFallback />}><AdminNotifications /></Suspense>} />
            <Route path="community" element={<Suspense fallback={<PageFallback />}><CommunityModeration /></Suspense>} />
            <Route path="teams" element={<Suspense fallback={<PageFallback />}><TeamsOversight /></Suspense>} />
          </Route>
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </>
  );
};

export default App;
