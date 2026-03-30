require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt= require("bcryptjs");
const jwt = require("jsonwebtoken");

const { connectDB, Student, Admin } = require("./database");
const {
  protect,
  requireActiveStudent,
  requireAdmin,
  authorizeRoles,
  authorizeAdminDesignation,
} = require("./middleware/authMiddleware");

const app  = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a signed JWT containing { id, role } (and optional extra claims).
 * @param {Object} payload  - { id, role, ...extra }
 * @param {string} expiresIn - e.g. "7d", "1h"
 */
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN || "7d") =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });

/**
 * Hash a plain-text password.
 */
const hashPassword = async (plain) => bcrypt.hash(plain, 12);

/**
 * Compare plain-text password with stored hash.
 */
const comparePassword = async (plain, hashed) => bcrypt.compare(plain, hashed);

/**
 * Strip sensitive fields from a mongoose document before sending to client.
 */
const sanitizeStudent = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  const { password, __v, ...safe } = obj;
  return safe;
};

const sanitizeAdmin = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  const { password, __v, ...safe } = obj;
  return safe;
};

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────

// Security headers
app.use(helmet());

// CORS — allow your React frontend origin
app.use(
  cors({
    origin     : process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// Body parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// ── Rate limiter for auth endpoints (anti-brute-force) ───────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max     : 20,              // 20 attempts per window per IP
  message : { success: false, message: "Too many requests. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders  : false,
});

// ── General API rate limiter ─────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max     : 200,
  message : { success: false, message: "Too many requests from this IP." },
});

app.use("/api", apiLimiter);

// ─────────────────────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.json({ success: true, message: "Smart Mess API is running 🍽️", timestamp: new Date() });
});

// ═════════════════════════════════════════════════════════════════════════════
//  STUDENT AUTH ROUTES   /api/auth/student
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/student/register
// ─────────────────────────────────────────────────────────────────────────────
// Public. Creates a new student account with status = "pending".
// The student cannot login until an admin approves their request.
//
// Body: { name, rollNo, department, year, email, phone, password }
// ─────────────────────────────────────────────────────────────────────────────

app.post("/api/auth/student/register", authLimiter, async (req, res) => {
  try {
    const { name, rollNo, department, year, email, phone, password } = req.body;

    // ── 1. Validate required fields ──────────────────────────────────────────
    const missing = [];
    if (!name)        missing.push("name");
    if (!rollNo)      missing.push("rollNo");
    if (!department)  missing.push("department");
    if (!year)        missing.push("year");
    if (!email)       missing.push("email");
    if (!password)    missing.push("password");

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`,
      });
    }

    // ── 2. Password strength (min 6 chars) ───────────────────────────────────
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    // ── 3. Check for duplicates ──────────────────────────────────────────────
    const existingRoll = await Student.findOne({ rollNo: rollNo.toUpperCase() });
    if (existingRoll) {
      return res.status(409).json({
        success: false,
        message: "A student with this roll number already exists.",
      });
    }

    const existingEmail = await Student.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "A student with this email already exists.",
      });
    }

    // ── 4. Hash password ─────────────────────────────────────────────────────
    const hashedPassword = await hashPassword(password);

    // ── 5. Create student document (status = "pending" by default) ───────────
    const student = await Student.create({
      name        : name.trim(),
      rollNo      : rollNo.trim().toUpperCase(),
      department  : department.trim().toUpperCase(),
      year,
      email       : email.trim().toLowerCase(),
      phone       : phone?.trim() || "",
      password    : hashedPassword,
      // status defaults to "pending" — see schema
    });

    // ── 6. Respond (no token yet — student must wait for admin approval) ──────
    return res.status(201).json({
      success : true,
      message : "Registration successful! Your request is pending admin approval. You will be notified once approved.",
      data    : {
        id    : student._id,
        rollNo: student.rollNo,
        name  : student.name,
        email : student.email,
        status: student.status,
      },
    });

  } catch (err) {
    // Mongoose validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(". ") });
    }
    // Duplicate key (race condition fallback)
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({ success: false, message: `${field} already exists.` });
    }
    console.error("Student register error:", err);
    return res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/student/login
// ─────────────────────────────────────────────────────────────────────────────
// Public. Authenticates a student by roll number + password.
// Only "active" students can login (pending / suspended / inactive are rejected).
//
// Body: { rollNo, password }
// ─────────────────────────────────────────────────────────────────────────────

app.post("/api/auth/student/login", authLimiter, async (req, res) => {
  try {
    const { rollNo, password } = req.body;

    // ── 1. Validate input ────────────────────────────────────────────────────
    if (!rollNo || !password) {
      return res.status(400).json({
        success: false,
        message: "Roll number and password are required.",
      });
    }

    // ── 2. Find student (include password field explicitly) ──────────────────
    const student = await Student.findOne({ rollNo: rollNo.trim().toUpperCase() }).select("+password");

    // Use a vague message to avoid user enumeration
    if (!student) {
      return res.status(401).json({
        success: false,
        message: "Invalid roll number or password.",
      });
    }

    // ── 3. Check account status before comparing password ────────────────────
    if (student.status === "pending") {
      return res.status(403).json({
        success : false,
        message : "Your registration is pending admin approval. Please check back later.",
        status  : "pending",
      });
    }
    if (student.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended. Please contact the mess admin.",
        status : "suspended",
      });
    }
    if (student.status === "inactive") {
      return res.status(403).json({
        success: false,
        message: "This account is no longer active.",
        status : "inactive",
      });
    }

    // ── 4. Compare password ──────────────────────────────────────────────────
    const isMatch = await comparePassword(password, student.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid roll number or password.",
      });
    }

    // ── 5. Update last login timestamp ───────────────────────────────────────
    student.lastLogin = new Date();
    await student.save({ validateBeforeSave: false });

    // ── 6. Generate JWT ──────────────────────────────────────────────────────
    const token = generateToken({
      id    : student._id,
      role  : "student",
      rollNo: student.rollNo,
    });

    // ── 7. Respond ───────────────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      data   : sanitizeStudent(student),
    });

  } catch (err) {
    console.error("Student login error:", err);
    return res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/student/me
// ─────────────────────────────────────────────────────────────────────────────
// Protected (student). Returns the currently logged-in student's profile.
// Used by the frontend on app load to re-hydrate session.
// ─────────────────────────────────────────────────────────────────────────────

app.get("/api/auth/student/me", ...requireActiveStudent, async (req, res) => {
  try {
    // req.user is already set by the protect middleware
    return res.status(200).json({
      success: true,
      data   : req.user,
    });
  } catch (err) {
    console.error("Student /me error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  ADMIN AUTH ROUTES   /api/auth/admin
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/admin/login
// ─────────────────────────────────────────────────────────────────────────────
// Public. Authenticates an admin by adminId + password.
//
// Body: { adminId, password }
// ─────────────────────────────────────────────────────────────────────────────

app.post("/api/auth/admin/login", authLimiter, async (req, res) => {
  try {
    const { adminId, password } = req.body;

    // ── 1. Validate input ────────────────────────────────────────────────────
    if (!adminId || !password) {
      return res.status(400).json({
        success: false,
        message: "Admin ID and password are required.",
      });
    }

    // ── 2. Find admin (include password field) ───────────────────────────────
    const admin = await Admin.findOne({ adminId: adminId.trim().toUpperCase() }).select("+password");

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin ID or password.",
      });
    }

    // ── 3. Check if admin account is active ──────────────────────────────────
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: "This admin account has been deactivated. Contact the system administrator.",
      });
    }

    // ── 4. Compare password ──────────────────────────────────────────────────
    const isMatch = await comparePassword(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin ID or password.",
      });
    }

    // ── 5. Update last login ──────────────────────────────────────────────────
    admin.lastLogin = new Date();
    await admin.save({ validateBeforeSave: false });

    // ── 6. Generate JWT (shorter expiry for admin sessions) ───────────────────
    const token = generateToken(
      {
        id         : admin._id,
        role       : "admin",
        adminId    : admin.adminId,
        designation: admin.designation,
      },
      process.env.ADMIN_JWT_EXPIRES_IN || "1d"
    );

    // ── 7. Respond ────────────────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      message: "Admin login successful.",
      token,
      data   : sanitizeAdmin(admin),
    });

  } catch (err) {
    console.error("Admin login error:", err);
    return res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/admin/me
// ─────────────────────────────────────────────────────────────────────────────
// Protected (admin). Returns the currently logged-in admin's profile.
// ─────────────────────────────────────────────────────────────────────────────

app.get("/api/auth/admin/me", ...requireAdmin, async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data   : req.user,
    });
  } catch (err) {
    console.error("Admin /me error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ─────────────────────────────────────────────────────────────────────────────
// Protected. Stateless logout — instructs the client to drop the token.
// If you implement a token blacklist (Redis), add the token here.
// ─────────────────────────────────────────────────────────────────────────────

app.post("/api/auth/logout", protect, (req, res) => {
  /*
   * TODO (optional): if you add a Redis token blacklist, add the token here:
   *
   * const token = req.headers.authorization.split(" ")[1];
   * await redisClient.set(`bl_${token}`, "1", { EX: 7 * 24 * 3600 });
   */
  return res.status(200).json({ success: true, message: "Logged out successfully." });
});

// ═════════════════════════════════════════════════════════════════════════════
//  ADMIN — STUDENT MANAGEMENT ROUTES  /api/admin/students
// ═════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/students/pending
// ─────────────────────────────────────────────────────────────────────────────
// Protected (admin). Returns all students with status = "pending".
// ─────────────────────────────────────────────────────────────────────────────

app.get("/api/admin/students/pending", ...requireAdmin, async (req, res) => {
  try {
    const pendingStudents = await Student.find({ status: "pending" })
      .select("-password")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count  : pendingStudents.length,
      data   : pendingStudents,
    });
  } catch (err) {
    console.error("Fetch pending students error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/students/:id/approve
// ─────────────────────────────────────────────────────────────────────────────
// Protected (admin). Approves a pending student registration.
// ─────────────────────────────────────────────────────────────────────────────

app.patch("/api/admin/students/:id/approve", ...requireAdmin, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }
    if (student.status !== "pending") {
      return res.status(400).json({ success: false, message: `Student is already ${student.status}.` });
    }

    student.status     = "active";
    student.approvedBy = req.user._id;
    student.approvedAt = new Date();
    await student.save();

    return res.status(200).json({
      success: true,
      message: `${student.name} (${student.rollNo}) has been approved.`,
      data   : sanitizeStudent(student),
    });
  } catch (err) {
    console.error("Approve student error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/students/:id/reject
// ─────────────────────────────────────────────────────────────────────────────
// Protected (admin). Rejects and deletes a pending student registration.
// ─────────────────────────────────────────────────────────────────────────────

app.patch("/api/admin/students/:id/reject", ...requireAdmin, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }
    if (student.status !== "pending") {
      return res.status(400).json({ success: false, message: "Only pending registrations can be rejected." });
    }

    const name   = student.name;
    const rollNo = student.rollNo;

    // Permanently remove the rejected registration
    await Student.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: `Registration for ${name} (${rollNo}) has been rejected and removed.`,
    });
  } catch (err) {
    console.error("Reject student error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/students/:id/suspend
// ─────────────────────────────────────────────────────────────────────────────
// Protected (admin). Toggles a student between "active" and "suspended".
// ─────────────────────────────────────────────────────────────────────────────

app.patch("/api/admin/students/:id/suspend", ...requireAdmin, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ success: false, message: "Student not found." });

    student.status = student.status === "active" ? "suspended" : "active";
    await student.save();

    return res.status(200).json({
      success: true,
      message: `${student.name}'s account is now ${student.status}.`,
      data   : sanitizeStudent(student),
    });
  } catch (err) {
    console.error("Suspend student error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/students
// ─────────────────────────────────────────────────────────────────────────────
// Protected (admin). Returns all active/suspended students.
// Supports ?search=, ?dept=, ?year=, ?status=, ?page=, ?limit=
// ─────────────────────────────────────────────────────────────────────────────

app.get("/api/admin/students", ...requireAdmin, async (req, res) => {
  try {
    const { search, dept, year, status, page = 1, limit = 20 } = req.query;

    const filter = {};

    if (status) {
      filter.status = status;
    } else {
      filter.status = { $in: ["active", "suspended"] }; // exclude pending by default
    }

    if (dept)   filter.department = dept.toUpperCase();
    if (year)   filter.year       = year;

    if (search) {
      filter.$or = [
        { name  : { $regex: search, $options: "i" } },
        { rollNo: { $regex: search, $options: "i" } },
        { email : { $regex: search, $options: "i" } },
      ];
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Student.countDocuments(filter);

    const students = await Student.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      success   : true,
      total,
      page      : parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data      : students,
    });
  } catch (err) {
    console.error("Fetch all students error:", err);
    return res.status(500).json({ success: false, message: "Server error." });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
//  GLOBAL ERROR HANDLER  (must be last middleware)
// ═════════════════════════════════════════════════════════════════════════════

// 404 for unmatched routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found.` });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error.",
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────────────────────

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
    console.log(`   JWT Expiry  : ${process.env.JWT_EXPIRES_IN || "7d"} (student) | ${process.env.ADMIN_JWT_EXPIRES_IN || "1d"} (admin)`);
  });
};

startServer();