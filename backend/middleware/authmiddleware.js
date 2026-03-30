// ─────────────────────────────────────────────────────────────────────────────
// JWT Authentication & Role-based Authorization Middleware
// ─────────────────────────────────────────────────────────────────────────────

const jwt    = require("jsonwebtoken");
const { Student, Admin } = require("../database");

// ─────────────────────────────────────────────────────────────────────────────
// protect
// ─────────────────────────────────────────────────────────────────────────────
// Verifies the JWT in the Authorization header and attaches the decoded user
// to req.user. Works for both students and admins.
//
// Usage:  router.get("/me", protect, handler)
// ─────────────────────────────────────────────────────────────────────────────

const protect = async (req, res, next) => {
  try {
    // ── 1. Extract token from header ─────────────────────────────────────────
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    // ── 2. Verify token ───────────────────────────────────────────────────────
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ success: false, message: "Token expired. Please login again." });
      }
      return res.status(401).json({ success: false, message: "Invalid token." });
    }

    // ── 3. Fetch fresh user from DB (confirms account still exists/active) ────
    if (decoded.role === "student") {
      const student = await Student.findById(decoded.id).select("-password");
      if (!student) {
        return res.status(401).json({ success: false, message: "Student account not found." });
      }
      if (student.status !== "active") {
        return res.status(403).json({
          success: false,
          message: `Account is ${student.status}. Contact mess admin.`,
        });
      }
      req.user = { ...student.toObject(), role: "student" };

    } else if (decoded.role === "admin") {
      const admin = await Admin.findById(decoded.id).select("-password");
      if (!admin) {
        return res.status(401).json({ success: false, message: "Admin account not found." });
      }
      if (!admin.isActive) {
        return res.status(403).json({ success: false, message: "Admin account is deactivated." });
      }
      req.user = { ...admin.toObject(), role: "admin" };

    } else {
      return res.status(401).json({ success: false, message: "Invalid token payload." });
    }

    next();
  } catch (err) {
    console.error("protect middleware error:", err);
    return res.status(500).json({ success: false, message: "Server error during authentication." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// authorizeRoles(...roles)
// ─────────────────────────────────────────────────────────────────────────────
// Must be used AFTER protect. Restricts the route to specified roles.
//
// Usage:
//   router.post("/approve-student", protect, authorizeRoles("admin"), handler)
//   router.get("/my-attendance",    protect, authorizeRoles("student"), handler)
//   router.get("/shared-data",      protect, authorizeRoles("student", "admin"), handler)
// ─────────────────────────────────────────────────────────────────────────────

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user?.role}' is not authorized for this resource.`,
      });
    }
    next();
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// authorizeAdminDesignation(...designations)
// ─────────────────────────────────────────────────────────────────────────────
// Further restricts admin routes by designation (e.g. only super_admin can
// create other admins). Must be used AFTER protect + authorizeRoles("admin").
//
// Usage:
//   router.post(
//     "/create-admin",
//     protect,
//     authorizeRoles("admin"),
//     authorizeAdminDesignation("super_admin"),
//     handler
//   )
// ─────────────────────────────────────────────────────────────────────────────

const authorizeAdminDesignation = (...designations) => {
  return (req, res, next) => {
    if (!designations.includes(req.user?.designation)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Designation '${req.user?.designation}' cannot perform this action.`,
      });
    }
    next();
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// requireActiveStudent
// ─────────────────────────────────────────────────────────────────────────────
// Convenience shorthand: protect + student role in one chain.
// Usage:  router.get("/dashboard", requireActiveStudent, handler)
// ─────────────────────────────────────────────────────────────────────────────

const requireActiveStudent = [protect, authorizeRoles("student")];

// ─────────────────────────────────────────────────────────────────────────────
// requireAdmin
// ─────────────────────────────────────────────────────────────────────────────
// Convenience shorthand: protect + admin role in one chain.
// Usage:  router.post("/approve", requireAdmin, handler)
// ─────────────────────────────────────────────────────────────────────────────

const requireAdmin = [protect, authorizeRoles("admin")];

module.exports = {
  protect,
  authorizeRoles,
  authorizeAdminDesignation,
  requireActiveStudent,
  requireAdmin,
};