// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// ── Page imports ──────────────────────────────────────────────────────────────
import SmartMessLogin    from "./pages/SmartMessLogin";      // login + register page
import StudentDashboard  from "./pages/StudentDashboard";    // student portal
import AdminDashboard    from "./pages/AdminDashboard";      // admin portal

// ─────────────────────────────────────────────────────────────────────────────
// RootRedirect
// When someone hits "/" we check their role and redirect accordingly.
// If not logged in, we send them to /login.
// ─────────────────────────────────────────────────────────────────────────────
function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) return null; // ProtectedRoute already shows a spinner; avoid flash

  if (!user)               return <Navigate to="/login"     replace />;
  if (user.role === "admin") return <Navigate to="/admin"     replace />;
  return                          <Navigate to="/dashboard"  replace />;
}

// ─────────────────────────────────────────────────────────────────────────────
// LoginRedirect
// If an already-logged-in user tries to visit /login, bounce them away.
// ─────────────────────────────────────────────────────────────────────────────
function LoginRedirect() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user?.role === "admin") return <Navigate to="/admin"    replace />;
  if (user?.role === "student") return <Navigate to="/dashboard" replace />;

  // Not logged in — render the actual login page
  return <SmartMessLogin />;
}

// ─────────────────────────────────────────────────────────────────────────────
// AppRoutes — all route definitions live here
// ─────────────────────────────────────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>

      {/* ── Root: smart redirect based on auth state ── */}
      <Route path="/" element={<RootRedirect />} />

      {/* ── Public: Login / Register ── */}
      <Route path="/login" element={<LoginRedirect />} />

      {/* ────────────────────────────────────────────────────────────────────
          STUDENT PORTAL  (role = "student" required)
          All student sub-routes are nested under /dashboard

          To add more student pages later, add them as nested <Route> children
          inside this block, e.g.:
            <Route path="attendance"  element={<AttendancePage />} />
            <Route path="leave"       element={<MessLeavePage />} />
            <Route path="menu"        element={<MenuPage />} />
            <Route path="complaints"  element={<ComplaintsPage />} />
            <Route path="settings"    element={<StudentSettings />} />
      ──────────────────────────────────────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
        <Route path="/dashboard" element={<StudentDashboard />} />

        {/*
         * TODO — Student sub-pages (uncomment & create components as needed):
         *
         * <Route path="/dashboard/attendance"  element={<StudentAttendancePage />} />
         * <Route path="/dashboard/leave"        element={<MessLeavePage />} />
         * <Route path="/dashboard/menu"         element={<WeeklyMenuPage />} />
         * <Route path="/dashboard/fees"         element={<FeeHistoryPage />} />
         * <Route path="/dashboard/complaints"   element={<ComplaintsPage />} />
         * <Route path="/dashboard/settings"     element={<StudentSettingsPage />} />
         */}
      </Route>

      {/* ────────────────────────────────────────────────────────────────────
          ADMIN PORTAL  (role = "admin" required)
          All admin sub-routes are nested under /admin

          To add more admin pages later, add them as nested <Route> children:
            <Route path="attendance"  element={<AttendanceMarkingPage />} />
            <Route path="reports"     element={<ReportsPage />} />
            <Route path="settings"    element={<AdminSettings />} />
      ──────────────────────────────────────────────────────────────────── */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin" element={<AdminDashboard />} />

        {/*
         * TODO — Admin sub-pages (uncomment & create components as needed):
         *
         * <Route path="/admin/attendance"  element={<AttendanceMarkingPage />} />
         * <Route path="/admin/reports"     element={<ReportsPage />} />
         * <Route path="/admin/settings"    element={<AdminSettingsPage />} />
         * <Route path="/admin/students/:id" element={<StudentProfilePage />} />
         */}
      </Route>

      {/* ── 404: catch-all → back to root smart-redirect ── */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// App — root component: wraps everything in AuthProvider + BrowserRouter
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}