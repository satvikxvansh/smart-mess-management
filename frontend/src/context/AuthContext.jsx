// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// AuthContext — holds user session state and exposes auth actions
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // { role: "student"|"admin", ...profile }
  const [loading, setLoading] = useState(true);   // true while re-hydrating from storage

  // ── Re-hydrate session on first mount ──────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mess_user");
      if (stored) setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem("mess_user");
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Persist user to localStorage whenever it changes ──────────────────────
  useEffect(() => {
    if (user) localStorage.setItem("mess_user", JSON.stringify(user));
    else      localStorage.removeItem("mess_user");
  }, [user]);

  // ── Student Login ──────────────────────────────────────────────────────────
  // TODO: replace the mock block with your real API call
  const loginStudent = async ({ username, password }) => {
    /*
     * ┌──────────────────────────────────────────────────────────────────────┐
     * │  STUDENT LOGIN — API CALL PLACEHOLDER                               │
     * │                                                                      │
     * │  Replace the mock below with something like:                         │
     * │                                                                      │
     * │  const res  = await fetch("/api/auth/student/login", {              │
     * │    method  : "POST",                                                 │
     * │    headers : { "Content-Type": "application/json" },                │
     * │    body    : JSON.stringify({ username, password }),                 │
     * │  });                                                                 │
     * │  if (!res.ok) throw new Error("Invalid credentials");               │
     * │  const data = await res.json();                                      │
     * │  // data should look like:                                           │
     * │  // { token, role: "student", name, rollNo, dept, year, ... }       │
     * │  if (data.token) localStorage.setItem("mess_token", data.token);    │
     * │  return data;                                                        │
     * └──────────────────────────────────────────────────────────────────────┘
     */

    // ── MOCK (remove once API is ready) ──
    if (!username || !password) throw new Error("Please fill all fields");
    await new Promise(r => setTimeout(r, 800)); // simulate network delay
    return {
      role      : "student",
      name      : "Arjun Kumar Singh",
      rollNo    : username,
      dept      : "CSE",
      year      : "3rd",
      email     : `${username}@bitmesra.ac.in`,
      messBlock : "Mess Block – A",
      feeStatus : "Paid",
      avatar    : "AK",
    };
    // ── END MOCK ──
  };

  // ── Admin Login ────────────────────────────────────────────────────────────
  // TODO: replace the mock block with your real API call
  const loginAdmin = async ({ username, password }) => {
    /*
     * ┌──────────────────────────────────────────────────────────────────────┐
     * │  ADMIN LOGIN — API CALL PLACEHOLDER                                 │
     * │                                                                      │
     * │  const res  = await fetch("/api/auth/admin/login", {                │
     * │    method  : "POST",                                                 │
     * │    headers : { "Content-Type": "application/json" },                │
     * │    body    : JSON.stringify({ username, password }),                 │
     * │  });                                                                 │
     * │  if (!res.ok) throw new Error("Invalid credentials");               │
     * │  const data = await res.json();                                      │
     * │  // data should look like:                                           │
     * │  // { token, role: "admin", name, adminId, block, ... }             │
     * │  if (data.token) localStorage.setItem("mess_token", data.token);    │
     * │  return data;                                                        │
     * └──────────────────────────────────────────────────────────────────────┘
     */

    // ── MOCK (remove once API is ready) ──
    if (!username || !password) throw new Error("Please fill all fields");
    await new Promise(r => setTimeout(r, 800));
    return {
      role    : "admin",
      name    : "Dr. R. K. Sharma",
      adminId : username,
      block   : "Mess Block – A",
      designation: "Mess Manager",
      avatar  : "RS",
    };
    // ── END MOCK ──
  };

  // ── Student Register ───────────────────────────────────────────────────────
  // TODO: replace the mock block with your real API call
  const registerStudent = async (formData) => {
    /*
     * ┌──────────────────────────────────────────────────────────────────────┐
     * │  STUDENT REGISTER — API CALL PLACEHOLDER                            │
     * │                                                                      │
     * │  const res  = await fetch("/api/auth/student/register", {           │
     * │    method  : "POST",                                                 │
     * │    headers : { "Content-Type": "application/json" },                │
     * │    body    : JSON.stringify(formData),                               │
     * │  });                                                                 │
     * │  if (!res.ok) throw new Error("Registration failed");               │
     * │  const data = await res.json();                                      │
     * │  // After registration the student's request will be PENDING        │
     * │  // until an admin approves it — so we do NOT log them in yet.      │
     * │  return data; // e.g. { message: "Request submitted for approval" } │
     * └──────────────────────────────────────────────────────────────────────┘
     */

    // ── MOCK (remove once API is ready) ──
    if (!formData.name || !formData.rollNo) throw new Error("Please fill all required fields");
    await new Promise(r => setTimeout(r, 800));
    return { message: "Registration request submitted. You will be notified once approved." };
    // ── END MOCK ──
  };

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = () => {
    /*
     * TODO: optionally call POST /api/auth/logout to invalidate server session
     *
     * await fetch("/api/auth/logout", {
     *   method  : "POST",
     *   headers : { Authorization: `Bearer ${localStorage.getItem("mess_token")}` },
     * });
     */
    localStorage.removeItem("mess_token");
    setUser(null);
  };

  // ── Central login dispatcher called by the login page ─────────────────────
  const login = async ({ tab, username, password, formData }) => {
    let profile;
    if (tab === "admin") {
      profile = await loginAdmin({ username, password });
    } else if (formData) {
      // registration path — no auto-login
      return await registerStudent(formData);
    } else {
      profile = await loginStudent({ username, password });
    }
    setUser(profile);
    return profile;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Convenience hook ──────────────────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}