import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const ADMIN = { name: "Dr. R. K. Sharma", role: "Mess Manager", block: "Mess Block – A", avatar: "RS" };

const STATS = [
  { label: "Total Students", value: "486", delta: "+12 this month", icon: "🎓", color: "from-slate-700 to-slate-900" },
  { label: "Pending Requests", value: "14", delta: "Needs attention", icon: "⏳", color: "from-amber-500 to-orange-600" },
  { label: "Today's Attendance", value: "73%", delta: "354 / 486", icon: "✅", color: "from-emerald-500 to-teal-700" },
  { label: "Monthly Expense", value: "₹1.84L", delta: "↑ 3.2% vs last", icon: "📊", color: "from-blue-600 to-indigo-700" },
];

const PENDING_STUDENTS = [
  { id: 1, name: "Priya Sharma", roll: "BT23ECE012", dept: "ECE", year: "2nd", email: "priya.s@bitmesra.ac.in", date: "27 Mar 2025", hostel: "Saraswati Hall" },
  { id: 2, name: "Rahul Verma", roll: "BT23ME034", dept: "ME", year: "2nd", email: "rahul.v@bitmesra.ac.in", date: "26 Mar 2025", hostel: "Vivekananda Hall" },
  { id: 3, name: "Ankita Das", roll: "BT24CSE007", dept: "CSE", year: "1st", email: "ankita.d@bitmesra.ac.in", date: "25 Mar 2025", hostel: "Saraswati Hall" },
  { id: 4, name: "Mohit Yadav", roll: "BT24CE019", dept: "CE", year: "1st", email: "mohit.y@bitmesra.ac.in", date: "25 Mar 2025", hostel: "Gandhi Hall" },
  { id: 5, name: "Sneha Patel", roll: "BT23IT008", dept: "IT", year: "2nd", email: "sneha.p@bitmesra.ac.in", date: "24 Mar 2025", hostel: "Saraswati Hall" },
];

const ALL_STUDENTS = [
  { id: 10, name: "Arjun Kumar Singh", roll: "BT22CSE047", dept: "CSE", year: "3rd", status: "Active", fee: "Paid", attendance: 78 },
  { id: 11, name: "Pooja Mishra", roll: "BT22ECE031", dept: "ECE", year: "3rd", status: "Active", fee: "Paid", attendance: 91 },
  { id: 12, name: "Deepak Tiwari", roll: "BT23ME022", dept: "ME", year: "2nd", status: "Active", fee: "Unpaid", attendance: 55 },
  { id: 13, name: "Neha Gupta", roll: "BT22IT015", dept: "IT", year: "3rd", status: "On Leave", fee: "Paid", attendance: 63 },
  { id: 14, name: "Vikram Singh", roll: "BT23CE041", dept: "CE", year: "2nd", status: "Active", fee: "Unpaid", attendance: 40 },
];

const EXPENSE_LOG = [
  { date: "28 Mar", items: [{ name: "Vegetables & Fruits", amt: 4800 }, { name: "Grains & Pulses", amt: 6200 }, { name: "Dairy Products", amt: 3100 }, { name: "Cooking Gas", amt: 1800 }], total: 15900 },
  { date: "27 Mar", items: [{ name: "Vegetables & Fruits", amt: 4500 }, { name: "Grains & Pulses", amt: 5900 }, { name: "Dairy Products", amt: 2800 }, { name: "Miscellaneous", amt: 1200 }], total: 14400 },
];

const ANNOUNCEMENTS = [
  { id: 1, title: "April Mess Fee Due", body: "Last date to pay April mess fee is 5th April. Late fee ₹50/day after that.", type: "warning", date: "25 Mar 2025", reach: 486 },
  { id: 2, title: "New Menu from April", body: "Revised monthly menu will be effective from 1st April. Sunday specials added.", type: "info", date: "22 Mar 2025", reach: 486 },
  { id: 3, title: "Holiday Closure", body: "Mess will remain closed on 14th April (Ambedkar Jayanti). Packed meals provided.", type: "success", date: "20 Mar 2025", reach: 486 },
];

const WEEKLY_MENU_TEMPLATE = {
  Monday: { B: "Poha, Milk, Banana", L: "Rice, Dal, Aloo Gobi, Roti", D: "Chapati, Paneer Masala, Curd" },
  Tuesday: { B: "Idli Sambar, Tea", L: "Rice, Rajma, Jeera Aloo, Roti", D: "Roti, Dal Makhani, Rice" },
  Wednesday: { B: "Puri Bhaji, Milk", L: "Rice, Chhole, Bhindi, Roti", D: "Chapati, Mix Veg, Rice" },
  Thursday: { B: "Upma, Tea, Egg", L: "Rice, Arhar Dal, Dum Aloo, Roti", D: "Roti, Shahi Paneer, Rice" },
  Friday: { B: "Poha, Milk, Fruit", L: "Rice, Dal Fry, Matar Paneer, Roti", D: "Chapati, Kadhi Pakoda, Rice" },
  Saturday: { B: "Bread Butter, Egg, Tea", L: "Biryani, Raita, Salad", D: "Roti, Dal, Aloo Sabzi" },
  Sunday: { B: "Chole Bhature, Lassi", L: "SPECIAL: Pulao, Paneer, Gulab Jamun", D: "Roti, Dal, Kheer" },
};

const REVIEWS = [
  { id: 1, student: "Arjun K.", roll: "BT22CSE047", meal: "Lunch", rating: 4, text: "Dal tadka was great today! Rice was a bit overcooked.", date: "Today" },
  { id: 2, student: "Pooja M.", roll: "BT22ECE031", meal: "Dinner", rating: 2, text: "Paneer curry was cold. Needs improvement in serving temperature.", date: "Today" },
  { id: 3, student: "Rahul S.", roll: "BT23ME018", meal: "Breakfast", rating: 5, text: "Loved the idli sambar. Very fresh and hot!", date: "Yesterday" },
  { id: 4, student: "Neha G.", roll: "BT22IT015", meal: "Lunch", rating: 3, text: "Portion size is decreasing day by day. Please fix this.", date: "Yesterday" },
];

// ─── Helper Components ────────────────────────────────────────────────────────

const Badge = ({ children, color = "slate" }) => {
  const m = { slate: "bg-slate-100 text-slate-600", green: "bg-emerald-100 text-emerald-700", red: "bg-red-100 text-red-600", amber: "bg-amber-100 text-amber-700", blue: "bg-blue-100 text-blue-700", violet: "bg-violet-100 text-violet-700" };
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${m[color]}`}>{children}</span>;
};

const Card = ({ title, icon, children, action, className = "" }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden ${className}`}>
    <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50 bg-gray-50/50">
      <div className="flex items-center gap-2">
        <span className="text-base">{icon}</span>
        <h3 className="text-sm font-bold text-gray-700 tracking-wide">{title}</h3>
      </div>
      {action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const Stars = ({ n }) => (
  <span className="text-amber-400 text-xs">
    {"★".repeat(n)}{"☆".repeat(5 - n)}
  </span>
);

// ─── Modals ───────────────────────────────────────────────────────────────────

const MenuModal = ({ onClose }) => {
  const days = Object.keys(WEEKLY_MENU_TEMPLATE);
  const [activeDay, setActiveDay] = useState("Monday");
  const [menu, setMenu] = useState(WEEKLY_MENU_TEMPLATE);

  const update = (meal, val) => setMenu(m => ({ ...m, [activeDay]: { ...m[activeDay], [meal]: val } }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div><h3 className="font-extrabold text-gray-800 text-lg">Upload Weekly Menu</h3>
            <p className="text-xs text-gray-400">Edit and save the mess menu for each day</p></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {/* Day tabs */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {days.map(d => (
              <button key={d} onClick={() => setActiveDay(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeDay === d ? "bg-slate-800 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                {d.slice(0, 3)}
              </button>
            ))}
          </div>
          <div className="space-y-4">
            {[{ key: "B", label: "Breakfast 🌅", time: "7:30–9:00 AM" }, { key: "L", label: "Lunch ☀️", time: "12:30–2:30 PM" }, { key: "D", label: "Dinner 🌙", time: "7:30–9:30 PM" }].map(m => (
              <div key={m.key}>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{m.label} <span className="text-gray-400 font-normal">· {m.time}</span></label>
                <input value={menu[activeDay][m.key]} onChange={e => update(m.key, e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">Cancel</button>
          <button onClick={() => { alert("Weekly menu saved successfully!"); onClose(); }}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl shadow transition-all">
            Save Menu
          </button>
        </div>
      </div>
    </div>
  );
};

const ExpenseModal = ({ onClose }) => {
  const cats = ["Vegetables & Fruits", "Grains & Pulses", "Dairy Products", "Cooking Gas", "Condiments & Spices", "Miscellaneous"];
  const [entries, setEntries] = useState([{ cat: "", amt: "" }]);
  const [note, setNote] = useState("");
  const total = entries.reduce((s, e) => s + (parseFloat(e.amt) || 0), 0);

  const add = () => setEntries(e => [...e, { cat: "", amt: "" }]);
  const remove = i => setEntries(e => e.filter((_, idx) => idx !== i));
  const update = (i, k, v) => setEntries(e => e.map((en, idx) => idx === i ? { ...en, [k]: v } : en));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div><h3 className="font-extrabold text-gray-800 text-lg">Log Daily Expense</h3>
            <p className="text-xs text-gray-400">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {entries.map((e, i) => (
            <div key={i} className="flex gap-2 items-center">
              <select value={e.cat} onChange={ev => update(i, "cat", ev.target.value)}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300">
                <option value="">Select category</option>
                {cats.map(c => <option key={c}>{c}</option>)}
              </select>
              <div className="relative w-28">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                <input type="number" value={e.amt} onChange={ev => update(i, "amt", ev.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-6 pr-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="0" />
              </div>
              {entries.length > 1 && <button onClick={() => remove(i)} className="text-red-400 hover:text-red-600 text-lg w-8 flex-shrink-0">×</button>}
            </div>
          ))}
          <button onClick={add} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-all">+ Add Category</button>
          <div className="bg-slate-50 rounded-xl px-4 py-3 flex justify-between items-center border border-slate-200">
            <span className="text-sm font-semibold text-gray-600">Total for today</span>
            <span className="text-xl font-extrabold text-slate-800">₹{total.toLocaleString()}</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Additional Notes</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none resize-none"
              placeholder="Any special purchases or remarks..." />
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">Cancel</button>
          <button onClick={() => { alert("Expense logged successfully!"); onClose(); }}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow shadow-blue-200 transition-all">
            Save Expense
          </button>
        </div>
      </div>
    </div>
  );
};

const AnnouncementModal = ({ onClose }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("info");
  const [audience, setAudience] = useState("all");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div><h3 className="font-extrabold text-gray-800 text-lg">New Announcement</h3>
            <p className="text-xs text-gray-400">Broadcast to all mess students</p></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Announcement Type</label>
            <div className="flex gap-2">
              {[{ v: "info", label: "📣 Info", bg: "bg-blue-600" }, { v: "warning", label: "⚠️ Warning", bg: "bg-amber-500" }, { v: "success", label: "✅ Notice", bg: "bg-green-600" }].map(t => (
                <button key={t.v} onClick={() => setType(t.v)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${type === t.v ? `${t.bg} text-white shadow` : "bg-gray-100 text-gray-500"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="Announcement title..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Message</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
              placeholder="Write your announcement message here..." />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Target Audience</label>
            <select value={audience} onChange={e => setAudience(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-300">
              <option value="all">All Students (486)</option>
              <option value="unpaid">Unpaid Fee Students Only</option>
              <option value="1st">1st Year Students</option>
              <option value="2nd">2nd Year Students</option>
              <option value="3rd">3rd Year Students</option>
              <option value="4th">4th Year Students</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50">Cancel</button>
          <button onClick={() => { alert("Announcement published!"); onClose(); }}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl shadow transition-all">
            📣 Publish
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Admin Dashboard ─────────────────────────────────────────────────────
export default function AdminDashboard() {
  // const { user } = useAuth();
  const navigate    = useNavigate();
  const { logout, user } = useAuth();
  const [activeNav, setActiveNav] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showExpense, setShowExpense] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [pendingList, setPendingList] = useState(PENDING_STUDENTS);
  const [students, setStudents] = useState(ALL_STUDENTS);
  const [searchQ, setSearchQ] = useState("");
  const [toastMsg, setToastMsg] = useState(null);

  const toast = (msg, color = "green") => {
    setToastMsg({ msg, color });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const acceptStudent = (id) => {
    const s = pendingList.find(x => x.id === id);
    setPendingList(l => l.filter(x => x.id !== id));
    setStudents(l => [...l, { id, name: s.name, roll: s.roll, dept: s.dept, year: s.year, status: "Active", fee: "Unpaid", attendance: 0 }]);
    toast(`✓ ${s.name} approved and added to mess`);
  };

  const rejectStudent = (id) => {
    const s = pendingList.find(x => x.id === id);
    setPendingList(l => l.filter(x => x.id !== id));
    toast(`✗ ${s.name}'s request rejected`, "red");
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchQ.toLowerCase()) ||
    s.roll.toLowerCase().includes(searchQ.toLowerCase())
  );

  const navItems = [
    { id: "overview", label: "Overview", icon: "⊞" },
    { id: "requests", label: "Student Requests", icon: "👤", badge: pendingList.length },
    { id: "students", label: "All Students", icon: "🎓" },
    { id: "menu", label: "Mess Menu", icon: "🍽️" },
    { id: "expenses", label: "Expenses", icon: "📊" },
    { id: "announcements", label: "Announcements", icon: "📢" },
    { id: "reviews", label: "Reviews", icon: "⭐" },
    { id: "attendance", label: "Attendance Log", icon: "📅" }, // → redirect to detailed attendance page
    { id: "reports", label: "Reports", icon: "📄" },          // → redirect to reports/export page
    { id: "settings", label: "Settings", icon: "⚙️" },        // → redirect to admin settings page
  ];

  // ── Attendance heatmap mock data ──
  const heatDays = Array.from({ length: 28 }, (_, i) => ({
    day: i + 1,
    pct: Math.floor(55 + 0.5 * 40),
  }));

  return (
    <div className="min-h-screen bg-[#f4f6fb] flex" style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-62 bg-[#111827] flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`} style={{ minWidth: 240 }}>
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center text-white font-extrabold shadow-lg shadow-red-500/30">A</div>
            <div>
              <p className="text-white font-extrabold text-sm">Smart Mess</p>
              <p className="text-red-400 text-xs font-semibold">Admin Portal</p>
            </div>
          </div>
        </div>

        {/* Admin card */}
        <div className="mx-3 mt-4 mb-2 bg-white/5 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">{ADMIN.avatar}</div>
          <div className="overflow-hidden">
            <p className="text-white text-xs font-semibold truncate">{ADMIN.name}</p>
            <p className="text-white/40 text-xs truncate">{ADMIN.role}</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setActiveNav(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left group
                ${activeNav === item.id ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
              <span className="text-base">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge > 0 && (
                <span className="bg-amber-400 text-amber-900 text-xs font-extrabold w-5 h-5 rounded-full flex items-center justify-center">{item.badge}</span>
              )}
              {["attendance", "reports", "settings"].includes(item.id) && (
                <span className="text-white/20 text-xs">→</span>
              )}
            </button>
          ))}
        </nav>  

        <div className="p-3 border-t border-white/10">
          {/* NOTE: Logout → navigate to /login */}
          <button onClick={() => { logout(); navigate("/login", { replace: true }); }}>
            Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 text-xl p-1">☰</button>
            <div>
              <h1 className="text-base font-extrabold text-gray-800">Admin Dashboard</h1>
              <p className="text-xs text-gray-400 hidden sm:block">{new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Quick action buttons */}
            <button onClick={() => setShowMenu(true)}
              className="hidden sm:flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-xl font-semibold transition-all">
              🍽️ Upload Menu
            </button>
            <button onClick={() => setShowExpense(true)}
              className="hidden sm:flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl font-semibold transition-all">
              📊 Log Expense
            </button>
            <button onClick={() => setShowAnnouncement(true)}
              className="hidden sm:flex items-center gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-xl font-semibold transition-all">
              📢 Announce
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-400 to-rose-600 flex items-center justify-center text-white font-bold text-xs">{ADMIN.avatar}</div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">

          {/* ── OVERVIEW TAB ── */}
          {activeNav === "overview" && (
            <div className="space-y-5">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {STATS.map(s => (
                  <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white`}>
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{s.icon}</span>
                      <span className="text-white/40 text-xs">{s.delta}</span>
                    </div>
                    <p className="text-3xl font-extrabold">{s.value}</p>
                    <p className="text-white/60 text-xs mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Left: Today's meal-wise attendance bars */}
                <Card title="Today's Meal Attendance" icon="📅" className="lg:col-span-2">
                  <div className="space-y-4">
                    {[
                      { meal: "Breakfast", present: 298, total: 486, color: "bg-orange-400" },
                      { meal: "Lunch", present: 354, total: 486, color: "bg-blue-500" },
                      { meal: "Dinner", present: 0, total: 486, color: "bg-indigo-500", upcoming: true },
                    ].map(m => {
                      const pct = Math.round((m.present / m.total) * 100);
                      return (
                        <div key={m.meal}>
                          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                            <span className="font-semibold text-gray-700">{m.meal}</span>
                            {m.upcoming ? <Badge color="slate">Upcoming</Badge> : <span className="font-bold text-gray-700">{m.present} / {m.total} · {pct}%</span>}
                          </div>
                          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            {!m.upcoming && <div className={`h-full ${m.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Monthly heatmap */}
                  <div className="mt-5">
                    <p className="text-xs font-bold text-gray-600 mb-2">Monthly Attendance Heatmap – March 2025</p>
                    <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(14, 1fr)" }}>
                      {heatDays.map(d => {
                        const col = d.pct >= 85 ? "bg-emerald-500" : d.pct >= 70 ? "bg-emerald-300" : d.pct >= 55 ? "bg-amber-300" : "bg-red-300";
                        return (
                          <div key={d.day} title={`${d.day} Mar: ${d.pct}%`}
                            className={`${col} rounded aspect-square flex items-center justify-center text-white font-bold cursor-default`}
                            style={{ fontSize: "9px" }}>
                            {d.day}
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex gap-3 mt-2 flex-wrap">
                      {[["bg-emerald-500", "≥85%"], ["bg-emerald-300", "70–84%"], ["bg-amber-300", "55–69%"], ["bg-red-300", "<55%"]].map(([c, l]) => (
                        <div key={l} className="flex items-center gap-1"><div className={`w-3 h-3 rounded ${c}`} /><span className="text-xs text-gray-400">{l}</span></div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Right: Quick actions + fee summary */}
                <div className="space-y-4">
                  <Card title="Quick Actions" icon="⚡">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Upload Menu", icon: "🍽️", color: "bg-slate-100 hover:bg-slate-200 text-slate-700", fn: () => setShowMenu(true) },
                        { label: "Log Expense", icon: "📊", color: "bg-blue-50 hover:bg-blue-100 text-blue-700", fn: () => setShowExpense(true) },
                        { label: "Announce", icon: "📢", color: "bg-red-50 hover:bg-red-100 text-red-700", fn: () => setShowAnnouncement(true) },
                        { label: "Requests", icon: "⏳", color: "bg-amber-50 hover:bg-amber-100 text-amber-700", fn: () => setActiveNav("requests") },
                        // NOTE: "Mark Attendance" → navigate to attendance marking page
                        { label: "Mark Attendance", icon: "✅", color: "bg-emerald-50 hover:bg-emerald-100 text-emerald-700", fn: () => alert("Navigating to attendance marking page...") },
                        // NOTE: "Export Report" → navigate to reports page
                        { label: "Export Report", icon: "📄", color: "bg-violet-50 hover:bg-violet-100 text-violet-700", fn: () => alert("Navigating to reports export page...") },
                      ].map(a => (
                        <button key={a.label} onClick={a.fn}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-bold transition-all active:scale-95 ${a.color}`}>
                          <span className="text-xl">{a.icon}</span>
                          <span className="text-center leading-tight">{a.label}</span>
                        </button>
                      ))}
                    </div>
                  </Card>

                  <Card title="Fee Collection – March" icon="💰">
                    <div className="space-y-2">
                      {[
                        { label: "Collected", val: "₹12.4L", pct: 78, color: "bg-emerald-500" },
                        { label: "Pending", val: "₹3.5L", pct: 22, color: "bg-red-400" },
                      ].map(f => (
                        <div key={f.label}>
                          <div className="flex justify-between text-xs mb-1"><span className="text-gray-500 font-medium">{f.label}</span><span className="font-bold text-gray-800">{f.val}</span></div>
                          <div className="h-2 bg-gray-100 rounded-full"><div className={`h-full ${f.color} rounded-full`} style={{ width: `${f.pct}%` }} /></div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 bg-gray-50 rounded-xl px-3 py-2 flex justify-between border border-gray-100">
                      <span className="text-xs text-gray-500">Defaulters</span>
                      <span className="text-xs font-bold text-red-600">107 students</span>
                    </div>
                    {/* NOTE: "Send Fee Reminder" → triggers bulk SMS/email to defaulters */}
                    <button onClick={() => alert("Sending fee reminder to 107 defaulters...")}
                      className="mt-3 w-full py-2 text-xs text-red-600 font-semibold hover:bg-red-50 rounded-xl border border-red-100 transition-all">
                      Send Fee Reminder →
                    </button>
                  </Card>
                </div>
              </div>

              {/* Recent announcements + Today expense summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card title="Recent Announcements" icon="📢"
                  action={<button onClick={() => setShowAnnouncement(true)} className="text-xs bg-slate-800 text-white px-3 py-1.5 rounded-lg hover:bg-slate-900 font-semibold">+ New</button>}>
                  <div className="space-y-3">
                    {ANNOUNCEMENTS.map(a => {
                      const s = { info: "bg-blue-50 border-blue-200", warning: "bg-amber-50 border-amber-200", success: "bg-emerald-50 border-emerald-200" };
                      const tc = { info: "text-blue-700", warning: "text-amber-700", success: "text-emerald-700" };
                      return (
                        <div key={a.id} className={`rounded-xl border p-3 ${s[a.type]}`}>
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <p className={`text-xs font-bold ${tc[a.type]}`}>{a.title}</p>
                            <span className="text-xs text-gray-400 flex-shrink-0">{a.date}</span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{a.body}</p>
                          <p className="text-xs text-gray-400 mt-1">📬 Sent to {a.reach} students</p>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card title="Today's Expense Summary" icon="🧾"
                  action={<button onClick={() => setShowExpense(true)} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-semibold">+ Log</button>}>
                  {EXPENSE_LOG.slice(0, 1).map(day => (
                    <div key={day.date}>
                      <div className="space-y-2 mb-3">
                        {day.items.map(item => (
                          <div key={item.name} className="flex justify-between items-center">
                            <span className="text-xs text-gray-600">{item.name}</span>
                            <span className="text-xs font-semibold text-gray-800">₹{item.amt.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-700">Total</span>
                        <span className="text-lg font-extrabold text-slate-800">₹{day.total.toLocaleString()}</span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        {[{ l: "This Week", v: "₹98,400" }, { l: "This Month", v: "₹1.84L" }, { l: "Per Head", v: "₹379" }].map(e => (
                          <div key={e.l} className="bg-gray-50 rounded-xl p-2 border border-gray-100">
                            <p className="text-xs font-bold text-gray-800">{e.v}</p>
                            <p className="text-gray-400" style={{ fontSize: "10px" }}>{e.l}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          )}

          {/* ── STUDENT REQUESTS TAB ── */}
          {activeNav === "requests" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-800">Pending Registrations</h2>
                  <p className="text-xs text-gray-400">{pendingList.length} students awaiting approval</p>
                </div>
                {pendingList.length > 0 && (
                  <button onClick={() => { pendingList.forEach(s => acceptStudent(s.id)); toast("All requests approved!"); }}
                    className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold shadow shadow-emerald-200 transition-all">
                    ✓ Approve All
                  </button>
                )}
              </div>

              {pendingList.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                  <p className="text-4xl mb-3">🎉</p>
                  <p className="text-gray-600 font-bold">All caught up!</p>
                  <p className="text-gray-400 text-sm">No pending registration requests.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingList.map(s => (
                    <div key={s.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm hover:shadow-md transition-all">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {s.name.split(" ").map(x => x[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-bold text-gray-800 text-sm">{s.name}</span>
                          <Badge color="blue">{s.roll}</Badge>
                          <Badge color="slate">{s.dept} · {s.year}</Badge>
                        </div>
                        <p className="text-xs text-gray-400">{s.email} · {s.hostel} · Applied: {s.date}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => rejectStudent(s.id)}
                          className="px-4 py-2 rounded-xl text-xs font-bold border border-red-200 text-red-600 hover:bg-red-50 transition-all">
                          ✕ Reject
                        </button>
                        <button onClick={() => acceptStudent(s.id)}
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow shadow-emerald-100 transition-all">
                          ✓ Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ALL STUDENTS TAB ── */}
          {activeNav === "students" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-800">Student Management</h2>
                  <p className="text-xs text-gray-400">{students.length} total enrolled students</p>
                </div>
                <div className="relative">
                  <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                    className="border border-gray-200 rounded-xl pl-8 pr-4 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-200 w-64"
                    placeholder="Search by name or roll..." />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        {["Student", "Roll No.", "Dept", "Year", "Attendance", "Fee", "Status", "Actions"].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-gray-500 font-bold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredStudents.map(s => (
                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold text-xs">
                                {s.name.split(" ").map(x => x[0]).join("").slice(0, 2)}
                              </div>
                              <span className="font-semibold text-gray-700">{s.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-500">{s.roll}</td>
                          <td className="px-4 py-3"><Badge color="slate">{s.dept}</Badge></td>
                          <td className="px-4 py-3 text-gray-500">{s.year}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${s.attendance >= 75 ? "bg-emerald-400" : s.attendance >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                                  style={{ width: `${s.attendance}%` }} />
                              </div>
                              <span className="text-gray-600 font-semibold">{s.attendance}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-3"><Badge color={s.fee === "Paid" ? "green" : "red"}>{s.fee}</Badge></td>
                          <td className="px-4 py-3"><Badge color={s.status === "Active" ? "green" : s.status === "On Leave" ? "amber" : "red"}>{s.status}</Badge></td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              {/* NOTE: "View" → navigate to individual student profile page */}
                              <button onClick={() => alert(`Viewing profile of ${s.name}...`)}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold transition-all">View</button>
                              {/* NOTE: "Deactivate/Activate" → toggle student mess access */}
                              <button onClick={() => { setStudents(l => l.map(x => x.id === s.id ? { ...x, status: x.status === "Active" ? "Suspended" : "Active" } : x)); }}
                                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${s.status === "Active" ? "bg-red-50 text-red-500 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"}`}>
                                {s.status === "Active" ? "Suspend" : "Activate"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── MENU TAB ── */}
          {activeNav === "menu" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-800">Weekly Mess Menu</h2>
                  <p className="text-xs text-gray-400">Current menu – effective from 25 Mar 2025</p>
                </div>
                <button onClick={() => setShowMenu(true)}
                  className="text-xs bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl font-bold shadow transition-all">
                  ✏️ Edit Menu
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {Object.entries(WEEKLY_MENU_TEMPLATE).map(([day, meals]) => (
                  <div key={day} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                    <div className={`px-4 py-3 font-extrabold text-sm ${day === "Sunday" ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white" : "bg-gray-50 text-gray-700 border-b border-gray-100"}`}>
                      {day} {day === "Sunday" && "⭐ Special"}
                    </div>
                    <div className="p-3 space-y-2.5">
                      {[{ k: "B", label: "🌅 Breakfast" }, { k: "L", label: "☀️ Lunch" }, { k: "D", label: "🌙 Dinner" }].map(m => (
                        <div key={m.k}>
                          <p className="text-xs font-bold text-gray-500 mb-0.5">{m.label}</p>
                          <p className="text-xs text-gray-600 leading-relaxed">{meals[m.k]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── EXPENSES TAB ── */}
          {activeNav === "expenses" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-800">Expense Log</h2>
                  <p className="text-xs text-gray-400">Daily mess expenditure tracking</p>
                </div>
                <button onClick={() => setShowExpense(true)}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold shadow shadow-blue-200 transition-all">
                  + Log Today
                </button>
              </div>

              {/* Monthly summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "This Month", val: "₹1,84,200", sub: "Till 28 Mar", color: "from-slate-700 to-slate-900" },
                  { label: "Daily Average", val: "₹6,579", sub: "Per day", color: "from-blue-600 to-blue-800" },
                  { label: "Per Student", val: "₹379", sub: "Per day per head", color: "from-emerald-600 to-teal-700" },
                  { label: "Projected", val: "₹1,97,370", sub: "Full month", color: "from-violet-600 to-purple-800" },
                ].map(s => (
                  <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 text-white`}>
                    <p className="text-white/60 text-xs mb-1">{s.label}</p>
                    <p className="text-2xl font-extrabold">{s.val}</p>
                    <p className="text-white/50 text-xs mt-0.5">{s.sub}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {EXPENSE_LOG.map(day => (
                  <div key={day.date} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                      <span className="font-bold text-sm text-gray-700">{day.date}</span>
                      <span className="font-extrabold text-gray-800">Total: ₹{day.total.toLocaleString()}</span>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {day.items.map(item => (
                          <div key={item.name} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <p className="text-xs text-gray-500 mb-1">{item.name}</p>
                            <p className="text-base font-extrabold text-gray-800">₹{item.amt.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ANNOUNCEMENTS TAB ── */}
          {activeNav === "announcements" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-800">Announcements</h2>
                  <p className="text-xs text-gray-400">Manage notices sent to students</p>
                </div>
                <button onClick={() => setShowAnnouncement(true)}
                  className="text-xs bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl font-bold shadow transition-all">
                  + New Announcement
                </button>
              </div>
              <div className="space-y-3">
                {ANNOUNCEMENTS.map(a => {
                  const s = { info: "border-blue-200 bg-blue-50", warning: "border-amber-200 bg-amber-50", success: "border-emerald-200 bg-emerald-50" };
                  const ic = { info: "📣", warning: "⚠️", success: "✅" };
                  const tc = { info: "text-blue-800", warning: "text-amber-800", success: "text-emerald-800" };
                  return (
                    <div key={a.id} className={`rounded-2xl border p-4 ${s[a.type]} flex gap-4 items-start`}>
                      <span className="text-2xl flex-shrink-0">{ic[a.type]}</span>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`font-extrabold text-sm ${tc[a.type]}`}>{a.title}</span>
                          <Badge color={a.type === "info" ? "blue" : a.type === "warning" ? "amber" : "green"}>{a.type}</Badge>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed mb-2">{a.body}</p>
                        <div className="flex gap-4 text-xs text-gray-400">
                          <span>📅 {a.date}</span>
                          <span>📬 {a.reach} recipients</span>
                        </div>
                      </div>
                      {/* NOTE: Delete/Edit announcement → API call to update/delete */}
                      <div className="flex gap-1.5 flex-shrink-0">
                        <button onClick={() => alert("Edit announcement...")} className="px-2.5 py-1 text-xs rounded-lg bg-white border border-gray-200 text-gray-500 hover:bg-gray-50">Edit</button>
                        <button onClick={() => alert("Delete announcement...")} className="px-2.5 py-1 text-xs rounded-lg bg-white border border-red-200 text-red-500 hover:bg-red-50">Delete</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── REVIEWS TAB ── */}
          {activeNav === "reviews" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-gray-800">Student Reviews</h2>
                  <p className="text-xs text-gray-400">Meal feedback from students</p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2 border border-gray-200 shadow-sm">
                  <span className="text-amber-400">★</span>
                  <span className="font-extrabold text-gray-800">3.5</span>
                  <span className="text-xs text-gray-400">/ 5 avg</span>
                </div>
              </div>

              {/* Rating summary */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-xs font-bold text-gray-600 mb-3">Rating Distribution</p>
                <div className="space-y-2">
                  {[5, 4, 3, 2, 1].map(s => {
                    const cnt = REVIEWS.filter(r => r.rating === s).length;
                    const pct = Math.round((cnt / REVIEWS.length) * 100);
                    return (
                      <div key={s} className="flex items-center gap-3">
                        <span className="text-xs text-amber-400 w-6">{"★".repeat(s)}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-6 text-right">{cnt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                {REVIEWS.map(r => (
                  <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex gap-4">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {r.student.split(" ").map(x => x[0]).join("")}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800 text-sm">{r.student}</span>
                        <Badge color="slate">{r.roll}</Badge>
                        <Badge color={r.meal === "Lunch" ? "blue" : r.meal === "Dinner" ? "violet" : "amber"}>{r.meal}</Badge>
                        <span className="text-xs text-gray-400">{r.date}</span>
                      </div>
                      <Stars n={r.rating} />
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{r.text}</p>
                    </div>
                    {/* NOTE: "Reply" → opens reply thread for student feedback */}
                    <button onClick={() => alert("Opening reply thread...")} className="text-xs text-blue-500 hover:underline self-start flex-shrink-0 font-semibold">Reply</button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── Modals ── */}
      {showMenu && <MenuModal onClose={() => setShowMenu(false)} />}
      {showExpense && <ExpenseModal onClose={() => setShowExpense(false)} />}
      {showAnnouncement && <AnnouncementModal onClose={() => setShowAnnouncement(false)} />}

      {/* ── Toast ── */}
      {toastMsg && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold text-white transition-all ${toastMsg.color === "green" ? "bg-emerald-600" : "bg-red-600"}`}>
          {toastMsg.msg}
        </div>
      )}
    </div>
  );
}