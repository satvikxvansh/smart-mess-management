// src/components/ProtectedRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute
//
// Usage:
//   <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
//     <Route path="/dashboard" element={<StudentDashboard />} />
//   </Route>
//
//   <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
//     <Route path="/admin" element={<AdminDashboard />} />
//   </Route>
//
//   Leave allowedRoles empty/undefined to allow ANY authenticated user.
// ─────────────────────────────────────────────────────────────────────────────

import { Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // ── Still re-hydrating from localStorage — show a minimal spinner ─────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading session…</p>
        </div>
      </div>
    );
  }

  // ── Not logged in at all → send to login ──────────────────────────────────
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ── Logged in but wrong role (e.g. student trying to hit /admin) ──────────
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the correct portal instead of a generic 403
    const fallback = user.role === "admin" ? "/admin" : "/dashboard";
    return <Navigate to={fallback} replace />;
  }

  // ── All checks passed — render the nested routes ──────────────────────────
  return <Outlet />;
}