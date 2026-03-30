// ─────────────────────────────────────────────────────────────────────────────
// Mongoose Schemas & Models for Smart Mess Attendance System
// ─────────────────────────────────────────────────────────────────────────────

const mongoose = require("mongoose");

// ─────────────────────────────────────────────────────────────────────────────
// CONNECTION
// ─────────────────────────────────────────────────────────────────────────────

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // useNewUrlParser and useUnifiedTopology are defaults in mongoose 7+
      // Add them explicitly if you're on mongoose 6:
      // useNewUrlParser   : true,
      // useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // crash fast on DB failure
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

const studentSchema = new mongoose.Schema(
  {
    // ── Personal info ────────────────────────────────────────────────────────
    name: {
      type    : String,
      required: [true, "Name is required"],
      trim    : true,
    },
    rollNo: {
      type     : String,
      required : [true, "Roll number is required"],
      unique   : true,
      trim     : true,
      uppercase: true,  // store uniformly as uppercase e.g. BT22CSE047
    },
    email: {
      type    : String,
      required: [true, "Email is required"],
      unique  : true,
      trim    : true,
      lowercase: true,
      match   : [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    phone: {
      type   : String,
      trim   : true,
      match  : [/^[6-9]\d{9}$/, "Please provide a valid 10-digit Indian phone number"],
    },

    // ── Academic info ────────────────────────────────────────────────────────
    department: {
      type    : String,
      required: [true, "Department is required"],
      enum    : ["CSE", "ECE", "ME", "CE", "EE", "IT", "MCA", "MBA", "PHD"],
      trim    : true,
    },
    year: {
      type    : String,
      required: [true, "Year is required"],
      enum    : ["1st", "2nd", "3rd", "4th", "5th"],
    },
    hostel: {
      type   : String,
      trim   : true,
      default: "",
    },

    // ── Mess info ────────────────────────────────────────────────────────────
    messType: {
      type   : String,
      enum   : ["Veg", "Non-Veg"],
      default: "Veg",
    },
    messBlock: {
      type   : String,
      default: "Mess Block – A",
      trim   : true,
    },

    // ── Auth ─────────────────────────────────────────────────────────────────
    password: {
      type    : String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select  : false, // never returned in queries unless explicitly asked
    },

    // ── Account status ───────────────────────────────────────────────────────
    // "pending"   → registered but not yet approved by admin
    // "active"    → approved and can access the mess
    // "suspended" → access revoked by admin
    // "inactive"  → left / alumni
    status: {
      type   : String,
      enum   : ["pending", "active", "suspended", "inactive"],
      default: "pending",
    },

    // ── Fee tracking ─────────────────────────────────────────────────────────
    feeStatus: {
      type   : String,
      enum   : ["Paid", "Unpaid", "Partial"],
      default: "Unpaid",
    },
    feePaidTill: {
      type   : Date,
      default: null,
    },

    // ── Attendance summary (cached counters — updated by attendance service) ─
    totalMealsConsumed: { type: Number, default: 0 },
    currentStreak     : { type: Number, default: 0 },

    // ── Metadata ─────────────────────────────────────────────────────────────
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref : "Admin",
      default: null,
    },
    approvedAt: { type: Date, default: null },
    lastLogin : { type: Date, default: null },
  },
  {
    timestamps: true, // adds createdAt + updatedAt automatically
    toJSON    : { virtuals: true },
    toObject  : { virtuals: true },
  }
);

// ── Virtual: full profile label ───────────────────────────────────────────────
studentSchema.virtual("initials").get(function () {
  return this.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
});

// ── Indexes ───────────────────────────────────────────────────────────────────
studentSchema.index({ rollNo: 1 });
studentSchema.index({ email: 1 });
studentSchema.index({ status: 1 });
studentSchema.index({ department: 1, year: 1 });

const Student = mongoose.model("Student", studentSchema);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

const adminSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    name: {
      type    : String,
      required: [true, "Name is required"],
      trim    : true,
    },
    adminId: {
      type     : String,
      required : [true, "Admin ID is required"],
      unique   : true,
      trim     : true,
      uppercase: true,
    },
    email: {
      type     : String,
      required : [true, "Email is required"],
      unique   : true,
      trim     : true,
      lowercase: true,
      match    : [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    phone: {
      type : String,
      trim : true,
    },

    // ── Role & permissions ────────────────────────────────────────────────────
    // "super_admin"  → can create other admins, full access
    // "mess_manager" → daily operations (menu, expense, attendance)
    // "warden"       → can approve students, view reports
    // "accounts"     → fee management only
    designation: {
      type   : String,
      enum   : ["super_admin", "mess_manager", "warden", "accounts"],
      default: "mess_manager",
    },
    messBlock: {
      type   : String,
      default: "Mess Block – A",
      trim   : true,
    },

    // ── Auth ──────────────────────────────────────────────────────────────────
    password: {
      type     : String,
      required : [true, "Password is required"],
      minlength: [8, "Admin password must be at least 8 characters"],
      select   : false,
    },

    // ── Status ────────────────────────────────────────────────────────────────
    isActive : { type: Boolean, default: true },
    lastLogin: { type: Date,    default: null  },
  },
  {
    timestamps: true,
    toJSON    : { virtuals: true },
    toObject  : { virtuals: true },
  }
);

adminSchema.index({ adminId: 1 });
adminSchema.index({ email  : 1 });

const Admin = mongoose.model("Admin", adminSchema);

// ─────────────────────────────────────────────────────────────────────────────
// FEE PAYMENT SCHEMA  (transaction log)
// ─────────────────────────────────────────────────────────────────────────────

const feePaymentSchema = new mongoose.Schema(
  {
    student : { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    month   : { type: String,  required: true }, // e.g. "April 2025"
    amount  : { type: Number,  required: true },
    method  : { type: String,  enum: ["UPI", "Card", "Net Banking", "Cash", "Other"], default: "UPI" },
    txnId   : { type: String,  trim: true },      // payment gateway transaction ID
    status  : { type: String,  enum: ["Paid", "Pending", "Failed"], default: "Pending" },
    paidAt  : { type: Date,    default: null },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true }
);

feePaymentSchema.index({ student: 1, month: 1 }, { unique: true });

const FeePayment = mongoose.model("FeePayment", feePaymentSchema);

// ─────────────────────────────────────────────────────────────────────────────
// ATTENDANCE SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

const attendanceSchema = new mongoose.Schema(
  {
    student  : { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    date     : { type: Date,    required: true },
    breakfast: { type: Boolean, default: false },
    lunch    : { type: Boolean, default: false },
    dinner   : { type: Boolean, default: false },
    markedBy : { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true }
);

attendanceSchema.index({ student: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });

const Attendance = mongoose.model("Attendance", attendanceSchema);

// ─────────────────────────────────────────────────────────────────────────────
// EXPENSE SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

const expenseItemSchema = new mongoose.Schema(
  {
    category: { type: String, required: true, trim: true },
    amount  : { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    date      : { type: Date,   required: true },
    items     : [expenseItemSchema],
    total     : { type: Number, required: true, min: 0 },
    notes     : { type: String, trim: true, default: "" },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
  },
  { timestamps: true }
);

expenseSchema.index({ date: 1 });

const Expense = mongoose.model("Expense", expenseSchema);

// ─────────────────────────────────────────────────────────────────────────────
// MENU SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

const menuSchema = new mongoose.Schema(
  {
    weekStartDate: { type: Date,   required: true, unique: true },
    menu: {
      Monday   : { breakfast: String, lunch: String, dinner: String },
      Tuesday  : { breakfast: String, lunch: String, dinner: String },
      Wednesday: { breakfast: String, lunch: String, dinner: String },
      Thursday : { breakfast: String, lunch: String, dinner: String },
      Friday   : { breakfast: String, lunch: String, dinner: String },
      Saturday : { breakfast: String, lunch: String, dinner: String },
      Sunday   : { breakfast: String, lunch: String, dinner: String },
    },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    isActive  : { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Menu = mongoose.model("Menu", menuSchema);

// ─────────────────────────────────────────────────────────────────────────────
// ANNOUNCEMENT SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

const announcementSchema = new mongoose.Schema(
  {
    title    : { type: String, required: true, trim: true },
    body     : { type: String, required: true, trim: true },
    type     : { type: String, enum: ["info", "warning", "success"], default: "info" },
    audience : { type: String, enum: ["all", "unpaid", "1st", "2nd", "3rd", "4th"], default: "all" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    isActive : { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Announcement = mongoose.model("Announcement", announcementSchema);

// ─────────────────────────────────────────────────────────────────────────────
// REVIEW SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

const reviewSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    date   : { type: Date,   required: true, default: Date.now },
    meal   : { type: String, enum: ["breakfast", "lunch", "dinner"], required: true },
    rating : { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true, maxlength: 500 },
    reply  : { type: String, trim: true, default: "" },  // admin reply
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true }
);

reviewSchema.index({ date: 1, meal: 1 });
reviewSchema.index({ student: 1 });

const Review = mongoose.model("Review", reviewSchema);

// ─────────────────────────────────────────────────────────────────────────────
// MESS ACCESS REQUEST SCHEMA  (student requests access for tomorrow)
// ─────────────────────────────────────────────────────────────────────────────

const messAccessSchema = new mongoose.Schema(
  {
    student  : { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
    date     : { type: Date, required: true },         // the date they want access for
    breakfast: { type: Boolean, default: true },
    lunch    : { type: Boolean, default: true },
    dinner   : { type: Boolean, default: true },
    status   : { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

messAccessSchema.index({ student: 1, date: 1 }, { unique: true });

const MessAccess = mongoose.model("MessAccess", messAccessSchema);

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  connectDB,
  Student,
  Admin,
  FeePayment,
  Attendance,
  Expense,
  Menu,
  Announcement,
  Review,
  MessAccess,
};