import { Routes, Route, Outlet, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ── Static imports ─────────────────────────────────────────────────────────────
// Layout shells, providers, and gate components are kept static because they
// render on every single route — lazy-loading them would only add a waterfall
// with no benefit.
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PageTransition from "./components/PageTransition";
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import { NotificationProvider } from "./lib/notification-context";

// ── Lazy page imports ──────────────────────────────────────────────────────────
// Each lazy() call tells Vite to create a separate JS chunk for that page.
// The chunk is only downloaded when the user first navigates to that route.
//
// Before lazy loading: one 1.46 MB bundle downloaded on every first visit.
// After lazy loading:  a small shell loads first; each page fetches its own
//                      chunk (~10-80 KB) only when needed.
//
// This directly improves LCP (Largest Contentful Paint) — a Core Web Vital
// that Google uses as a ranking signal.

// Public pages
const Landing           = lazy(() => import("./pages/public/landing"));
const NotFound          = lazy(() => import("./pages/public/not-found"));
const Register          = lazy(() => import("./pages/public/register"));
const Login             = lazy(() => import("./pages/public/login"));
const ForgotPassword    = lazy(() => import("./pages/public/forgot"));
const VerifyOtp         = lazy(() => import("./pages/public/verify-otp"));
const Support           = lazy(() => import("./pages/public/support"));
const HelpCenter        = lazy(() => import("./pages/public/help-center"));
const Rules             = lazy(() => import("./pages/public/rules"));
const DisputeResolution = lazy(() => import("./pages/public/dispute-resolution"));
const ContactUs         = lazy(() => import("./pages/public/contact-us"));
const About             = lazy(() => import("./pages/public/about"));
const Careers           = lazy(() => import("./pages/public/careers"));
const PrivacyPolicy     = lazy(() => import("./pages/public/privacy-policy"));
const TermsOfService    = lazy(() => import("./pages/public/terms-of-service"));
const PublicTournaments    = lazy(() => import("./pages/public/tournaments"));
const PublicPlayerProfile  = lazy(() => import("./pages/public/player-profile"));

// Auth / dashboard pages
const Dashboard             = lazy(() => import("./pages/auth/Dashboard"));
// Single import for LeaderboardPage — reused on both /leaderboard and /auth/leaderboard
const LeaderboardPage       = lazy(() => import("./pages/auth/LeaderboardPage"));
const NotificationsPage     = lazy(() => import("./pages/auth/NotificationsPage"));
const SettingsPage          = lazy(() => import("./pages/auth/SettingsPage"));
const CommunityPage         = lazy(() => import("./pages/auth/CommunityPage"));
const TeamsPage             = lazy(() => import("./pages/auth/FriendsPage"));
const PrizesPage            = lazy(() => import("./pages/auth/PrizesPage"));
const TransactionsPage      = lazy(() => import("./pages/auth/transactions"));
const PlayerProfile         = lazy(() => import("./pages/auth/player/profile"));
const JoinTournament        = lazy(() => import("./pages/auth/player/join-tournament"));
const BecomeOrganizer       = lazy(() => import("./pages/auth/player/become-organizer"));
const TournamentDetail      = lazy(() => import("./pages/auth/player/tournament-detail"));
const OrganizerProfile      = lazy(() => import("./pages/auth/organizer/profile"));
const CreateTournament      = lazy(() => import("./pages/auth/organizer/create-tournament"));
const MyTournaments         = lazy(() => import("./pages/auth/organizer/my-tournaments"));
const TournamentManage      = lazy(() => import("./pages/auth/organizer/tournament-manage"));
const AnalyticsPage         = lazy(() => import("./pages/auth/organizer/AnalyticsPage"));
const OrganizerFinancePage  = lazy(() => import("./pages/auth/organizer/OrganizerFinancePage"));
const OrganizerDisputesPage = lazy(() => import("./pages/auth/organizer/OrganizerDisputesPage"));

// ── Suspense fallback ─────────────────────────────────────────────────────────
// Shown while a lazy page chunk is downloading (only on first visit to each route).
// Dark background matches the app so there's no flash of white.
const PageFallback = () => (
  <div className="min-h-screen bg-slate-950" aria-hidden="true" />
);

// ── Public layout ─────────────────────────────────────────────────────────────
const PublicLayout = () => {
  const location = useLocation();
  return (
    <div className="min-h-dvh flex flex-col bg-transparent text-slate-100">
      <Navbar />
      <main className="flex-1">
        {/*
          Suspense is placed HERE (inside the layout, wrapping only <main>)
          so that the Navbar and Footer stay visible during page transitions.
          If the Suspense were outside the entire layout, the nav would
          disappear every time a new lazy chunk loads.
        */}
        <Suspense fallback={<PageFallback />}>
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

// ── Scroll restoration ────────────────────────────────────────────────────────
const ScrollToTop = () => {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);
  return null;
};

// ── App ───────────────────────────────────────────────────────────────────────
const App = () => {
  return (
    <>
      <ScrollToTop />
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
        {/* ── Public pages (Navbar + Footer) ──────────────────────────────── */}
        <Route element={<PublicLayout />}>
          <Route index element={<Landing />} />
          <Route path="support" element={<Support />} />
          <Route path="support/help-center" element={<HelpCenter />} />
          <Route path="support/rules" element={<Rules />} />
          <Route path="support/dispute-resolution" element={<DisputeResolution />} />
          <Route path="support/contact-us" element={<ContactUs />} />
          <Route path="about" element={<About />} />
          <Route path="careers" element={<Careers />} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="terms-of-service" element={<TermsOfService />} />
          <Route path="signup" element={<Register />} />
          <Route path="login" element={<Login />} />
          <Route path="forgot" element={<ForgotPassword />} />
          <Route path="verify-otp" element={<VerifyOtp />} />
          <Route path="tournaments" element={<PublicTournaments />} />
          <Route path="players/:username" element={<PublicPlayerProfile />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* ── Authenticated pages (Sidebar layout) ────────────────────────── */}
        {/* Suspense for dashboard pages lives inside DashboardLayout so the  */}
        {/* sidebar and header remain visible while page chunks load.          */}
        <Route path="auth" element={<ProtectedRoute />}>
          <Route element={<NotificationProvider><DashboardLayout /></NotificationProvider>}>
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="wallet" element={<TransactionsPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="community" element={<CommunityPage />} />
            <Route path="teams" element={<TeamsPage />} />
            <Route path="prizes" element={<PrizesPage />} />
            <Route path="contact-us" element={<ContactUs />} />

            {/* Player-only */}
            <Route element={<RoleRoute role="player" />}>
              <Route path="player/profile" element={<PlayerProfile />} />
              <Route path="become-organizer" element={<BecomeOrganizer />} />
            </Route>

            {/* Player + Organizer */}
            <Route element={<RoleRoute role={["player", "organizer"]} />}>
              <Route path="player/join-tournament" element={<JoinTournament />} />
              <Route path="tournaments" element={<JoinTournament />} />
              <Route path="tournaments/:tournamentId" element={<TournamentDetail />} />
            </Route>

            {/* Organizer-only */}
            <Route element={<RoleRoute role="organizer" />}>
              <Route path="organizer/profile" element={<OrganizerProfile />} />
              <Route path="organizer/create-tournament" element={<CreateTournament />} />
              <Route path="organizer/tournaments/:tournamentId/edit" element={<CreateTournament />} />
              <Route path="organizer/tournaments" element={<MyTournaments />} />
              <Route path="organizer/tournaments/:tournamentId" element={<TournamentManage />} />
              <Route path="organizer/analytics" element={<AnalyticsPage />} />
              <Route path="organizer/finance" element={<OrganizerFinancePage />} />
              <Route path="organizer/disputes" element={<OrganizerDisputesPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </>
  );
};

export default App;
