require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const bcrypt= require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

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

//Hash a plain-text password.
const hashPassword = async (plain) => bcrypt.hash(plain, 12);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const formatDate = (dateValue) => {
  if (!dateValue) return "N/A";
  return new Date(dateValue).toLocaleDateString("en-IN", {
    day  : "2-digit",
    month: "short",
    year : "numeric",
  });
};

const toFrontendShape = (student) => ({
  id    : student._id.toString(),
  name  : student.name,
  roll  : student.rollNo,          // DB field: rollNo  → frontend field: roll
  dept  : student.department,      // DB field: department → frontend field: dept
  year  : student.year,
  email : student.email,
  date  : formatDate(student.createdAt), // registration date from timestamps
  hostel: student.hostel || "Not provided",
});

/**
 * Compare plain-text password with stored hash.
 */
const comparePassword = async (plain, hashed) => bcrypt.compare(plain, hashed);

// Strip sensitive fields from a mongoose document before sending to client.
const sanitizeStudent = (doc) => {
  const obj = doc.toObject ? doc.toObject() : doc;
  const { password, __v, ...safe } = obj;
  return safe;
};

// ── Approval email
const sendApprovalEmail = async (student) => {
  const mailOptions = {
    from   : `"CanteenIQ – BIT Mesra" <${process.env.EMAIL_USER}>`,
    to     : student.email,
    subject: "✅ Mess Access Approved – BIT Mesra",
    html   : `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
 
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:0.5px;">
                🍽️ Smart Mess Attendance
              </h1>
              <p style="margin:6px 0 0;color:#93c5fd;font-size:13px;">Birla Institute of Technology, Mesra</p>
            </div>
 
            <!-- Body -->
            <div style="padding:36px 40px;">
              <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;padding:16px 20px;margin-bottom:28px;text-align:center;">
                <p style="margin:0;font-size:28px;">✅</p>
                <p style="margin:6px 0 0;font-size:16px;font-weight:700;color:#16a34a;">Your mess access has been approved!</p>
              </div>
 
              <p style="color:#374151;font-size:15px;margin:0 0 8px;">Hello <strong>${student.name}</strong>,</p>
              <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 24px;">
                Your registration request for the BIT Mesra Smart Mess system has been reviewed
                and <strong style="color:#16a34a;">approved</strong> by the mess administration.
                You can now log in and access all mess services.
              </p>
 
              <!-- Student Details Card -->
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
                <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Your Details</p>
                ${[
                  ["Roll Number", student.rollNo],
                  ["Department",  student.department],
                  ["Year",        student.year],
                  ["Mess Block",  student.messBlock || "Mess Block – A"],
                  ["Mess Type",   student.messType  || "Veg"],
                ].map(([label, value]) => `
                  <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f1f5f9;">
                    <span style="color:#6b7280;font-size:13px;">${label}</span>
                    <span style="color:#1e293b;font-size:13px;font-weight:600;">${value}</span>
                  </div>
                `).join("")}
              </div>
 
              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:28px;">
                <a href="${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/login"
                   style="display:inline-block;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.3px;">
                  Login to Student Portal →
                </a>
              </div>
 
              <p style="color:#6b7280;font-size:13px;line-height:1.7;margin:0;">
                If you have any questions, contact the mess office at
                <a href="mailto:mess@bitmesra.ac.in" style="color:#2563eb;">mess@bitmesra.ac.in</a>.
              </p>
            </div>
 
            <!-- Footer -->
            <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                © ${new Date().getFullYear()} Smart Mess Attendance System · BIT Mesra<br/>
                This is an automated email. Please do not reply.
              </p>
            </div>
 
          </div>
        </body>
      </html>
    `,
  };
 
  await transporter.sendMail(mailOptions);
  console.log(`✅ Approval email sent to ${student.email}`);
};

// ── Rejection email ───────────────────────────────────────────────────────────
const sendRejectionEmail = async ({ name, rollNo, email, department, year }) => {
  const mailOptions = {
    from   : `"CanteenIQ – BIT Mesra" <${process.env.EMAIL_USER}>`,
    to     : email,
    subject: "❌ Mess Registration – Action Required",
    html   : `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
          <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
 
            <div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;">
                🍽️ Smart Mess Attendance
              </h1>
              <p style="margin:6px 0 0;color:#93c5fd;font-size:13px;">Birla Institute of Technology, Mesra</p>
            </div>
 
            <div style="padding:36px 40px;">
              <div style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:12px;padding:16px 20px;margin-bottom:28px;text-align:center;">
                <p style="margin:0;font-size:28px;">❌</p>
                <p style="margin:6px 0 0;font-size:16px;font-weight:700;color:#dc2626;">Registration not approved</p>
              </div>
 
              <p style="color:#374151;font-size:15px;margin:0 0 8px;">Hello <strong>${name}</strong>,</p>
              <p style="color:#6b7280;font-size:14px;line-height:1.7;margin:0 0 24px;">
                We regret to inform you that your mess registration request for
                <strong>${rollNo}</strong> (${department}, ${year} Year) could not be approved
                at this time.
              </p>
 
              <div style="background:#fef9ec;border:1px solid #fde68a;border-radius:12px;padding:18px 22px;margin-bottom:28px;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#92400e;">What to do next?</p>
                <ul style="margin:0;padding-left:18px;color:#78350f;font-size:13px;line-height:2;">
                  <li>Contact the mess office in person with your ID card</li>
                  <li>Email us at <a href="mailto:mess@bitmesra.ac.in" style="color:#d97706;">mess@bitmesra.ac.in</a></li>
                  <li>Re-register with correct details if there was an input error</li>
                </ul>
              </div>
 
              <div style="text-align:center;">
                <a href="${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/login"
                   style="display:inline-block;background:#1e293b;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:14px;font-weight:700;">
                  Register Again →
                </a>
              </div>
            </div>
 
            <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                © ${new Date().getFullYear()} Smart Mess Attendance System · BIT Mesra<br/>
                This is an automated email. Please do not reply.
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  };
 
  await transporter.sendMail(mailOptions);
  console.log(`Rejection email sent to ${email}`);
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
    origin     : [process.env.CLIENT_ORIGIN, "http://localhost:5173"],
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
      .select(
        "_id name rollNo department year email phone hostel createdAt"
        // selecting only what we need — no password, no sensitive fields
      )
      .sort({ createdAt: -1 }); // newest registrations first
 
    const formatted = pendingStudents.map(toFrontendShape);
 
    return res.status(200).json({
      success: true,
      count  : formatted.length,
      data   : formatted,
    });
 
  } catch (err) {
    console.error("GET /pending error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch pending students. Please try again.",
    });
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
      return res.status(400).json({
        success: false,
        message: `Student is already ${student.status}.`,
      });
    }
 
    // ── 1. Approve in DB ──────────────────────────────────────────────────────
    student.status     = "active";
    student.approvedBy = req.user._id;
    student.approvedAt = new Date();
    await student.save();
 
    // ── 2. Send approval email (non-blocking — don't fail the request if email fails) ──
    sendApprovalEmail(student).catch((err) =>
      console.error(`Approval email failed for ${student.email}:`, err.message)
    );
 
    return res.status(200).json({
      success: true,
      message: `${student.name} (${student.rollNo}) approved. Confirmation email sent to ${student.email}.`,
      data   : toFrontendShape(student),
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
      return res.status(400).json({
        success: false,
        message: "Only pending registrations can be rejected.",
      });
    }
 
    // Capture details before deletion
    const { name, rollNo, email, department, year } = student;
 
    await Student.findByIdAndDelete(req.params.id);
 
    // Send rejection email (non-blocking)
    sendRejectionEmail({ name, rollNo, email, department, year }).catch((err) =>
      console.error(`Rejection email failed for ${email}:`, err.message)
    );
 
    return res.status(200).json({
      success: true,
      message: `Registration for ${name} (${rollNo}) rejected and removed.`,
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

// QR generation 
app.post("/api/attendance/generate-qr-token", ...requireActiveStudent, async (req, res) => {
  try {
    const student = req.user; // set by protect middleware

    // Short-lived token — expires in 15 minutes
    // Do NOT use your main JWT_SECRET here, use a separate one
    // so QR tokens and auth tokens are cryptographically isolated
    const qrToken = jwt.sign(
      {
        studentId: student._id,
        rollNo   : student.rollNo,
        type     : "qr_checkin",   // prevents auth tokens being used as QR tokens
      },
      process.env.QR_SECRET,       // add QR_SECRET=some_other_random_string to .env
      { expiresIn: "15m" }
    );

    return res.status(200).json({
      success : true,
      qrToken,                     // frontend encodes this string into a QR image
      expiresIn: 15 * 60,          // seconds — frontend uses this for countdown timer
    });

  } catch (err) {
    console.error("QR token generation error:", err);
    return res.status(500).json({ success: false, message: "Could not generate QR token." });
  }
});

app.post("/api/attendance/scan", ...requireAdmin, async (req, res) => {
  try {
    const { qrToken, meal } = req.body;

    // ── 1. Validate inputs ────────────────────────────────────────────────────
    if (!qrToken || !meal) {
      return res.status(400).json({ success: false, message: "qrToken and meal are required." });
    }
    if (!["breakfast", "lunch", "dinner"].includes(meal)) {
      return res.status(400).json({ success: false, message: "meal must be breakfast, lunch, or dinner." });
    }

    // ── 2. Verify the QR token ────────────────────────────────────────────────
    let decoded;
    try {
      decoded = jwt.verify(qrToken, process.env.QR_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "QR code has expired. Student must refresh their QR.",
          code   : "QR_EXPIRED",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Invalid QR code.",
        code   : "QR_INVALID",
      });
    }

    // ── 3. Confirm it's actually a QR token, not an auth token ───────────────
    if (decoded.type !== "qr_checkin") {
      return res.status(401).json({ success: false, message: "Invalid token type." });
    }

    // ── 4. Fetch student and confirm still active ─────────────────────────────
    const student = await Student.findById(decoded.studentId).select("-password");
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found." });
    }
    if (student.status !== "active") {
      return res.status(403).json({
        success: false,
        message: `Student account is ${student.status}. Access denied.`,
      });
    }

    // ── 5. Check if already marked for this meal today ────────────────────────
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    let record = await Attendance.findOne({
      student: student._id,
      date   : { $gte: todayStart, $lte: todayEnd },
    });

    if (record && record[meal] === true) {
      return res.status(409).json({
        success: false,
        message: `${student.name} already checked in for ${meal} today.`,
        code   : "ALREADY_MARKED",
        student: {
          name  : student.name,
          rollNo: student.rollNo,
          dept  : student.department,
        },
      });
    }

    // ── 6. Mark attendance ────────────────────────────────────────────────────
    if (record) {
      // Record exists for today (other meals marked) — just update this meal
      record[meal]    = true;
      record.markedBy = req.user._id;
      await record.save();
    } else {
      // First meal of the day for this student — create new record
      record = await Attendance.create({
        student  : student._id,
        date     : new Date(),
        [meal]   : true,
        markedBy : req.user._id,
      });
    }

    // ── 7. Update student's total meal counter ────────────────────────────────
    await Student.findByIdAndUpdate(student._id, {
      $inc: { totalMealsConsumed: 1 },
    });

    // ── 8. Respond with student details (admin screen shows this as confirmation) ──
    return res.status(200).json({
      success: true,
      message: `✅ ${meal.charAt(0).toUpperCase() + meal.slice(1)} marked for ${student.name}`,
      data: {
        name      : student.name,
        rollNo    : student.rollNo,
        department: student.department,
        year      : student.year,
        messType  : student.messType,
        meal,
        markedAt  : new Date(),
      },
    });

  } catch (err) {
    console.error("QR scan error:", err);
    return res.status(500).json({ success: false, message: "Server error during scan." });
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