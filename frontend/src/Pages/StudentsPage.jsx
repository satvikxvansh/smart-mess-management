import { useState } from "react";

// ─── Mock Student Data ────────────────────────────────────────────────────────
const STUDENT = {
  name: "Arjun Kumar Singh",
  rollNo: "BT22CSE047",
  department: "Computer Science & Engineering",
  year: "3rd Year",
  hostel: "RK Hall – Room 214",
  email: "arjun.kumar@bitmesra.ac.in",
  phone: "+91 98765 43210",
  messType: "Veg",
  messBlock: "Mess Block – A",
  feeStatus: "Paid",
  avatar: "AK",
  validTill: "May 2025",
};

const ATTENDANCE = {
  thisMonth: { present: 22, total: 28, meals: { B: 20, L: 22, D: 19 } },
  lastMonth: { present: 26, total: 30 },
  streak: 5,
  totalMeals: 186,
};

const FEE_HISTORY = [
  { id: "TXN-2025-031", month: "March 2025", amount: 3200, status: "Paid", date: "01 Mar 2025", method: "UPI" },
  { id: "TXN-2025-021", month: "February 2025", amount: 3200, status: "Paid", date: "01 Feb 2025", method: "Net Banking" },
  { id: "TXN-2025-011", month: "January 2025", amount: 3200, status: "Paid", date: "02 Jan 2025", method: "UPI" },
  { id: "TXN-2024-121", month: "December 2024", amount: 3200, status: "Paid", date: "01 Dec 2024", method: "Card" },
];

const TODAY_MENU = {
  breakfast: ["Poha", "Boiled Eggs", "Milk", "Banana"],
  lunch: ["Rice", "Dal Tadka", "Aloo Gobi", "Roti", "Salad"],
  dinner: ["Chapati", "Paneer Butter Masala", "Rice", "Curd"],
};

const NOTICES = [
  { id: 1, type: "info", text: "Mess will remain closed on 14th April (Ambedkar Jayanti). Special arrangements made.", date: "2 days ago" },
  { id: 2, type: "warn", text: "Last date to pay April mess fee is 5th April. Late fee of ₹50/day applicable.", date: "3 days ago" },
  { id: 3, type: "success", text: "New menu for April semester approved. Includes Sunday special meals.", date: "1 week ago" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

const Badge = ({ children, color = "blue" }) => {
  const map = { blue: "bg-blue-100 text-blue-700", green: "bg-green-100 text-green-700", red: "bg-red-100 text-red-700", amber: "bg-amber-100 text-amber-700", violet: "bg-violet-100 text-violet-700" };
  return <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[color]}`}>{children}</span>;
};

const SectionCard = ({ title, icon, children, className = "", action }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
      <div className="flex items-center gap-2.5">
        <span className="text-lg">{icon}</span>
        <h3 className="font-bold text-gray-800 text-sm tracking-wide">{title}</h3>
      </div>
      {action && action}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const StatPill = ({ label, value, sub, color }) => {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    green: "from-emerald-500 to-green-600",
    amber: "from-amber-400 to-orange-500",
    violet: "from-violet-500 to-purple-600",
    red: "from-red-500 to-rose-600",
  };
  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl p-4 text-white flex flex-col justify-between min-h-[100px]`}>
      <p className="text-white/70 text-xs font-medium">{label}</p>
      <div>
        <p className="text-3xl font-extrabold">{value}</p>
        {sub && <p className="text-white/70 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

// ─── Modals ───────────────────────────────────────────────────────────────────

const ReviewModal = ({ onClose }) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [meal, setMeal] = useState("lunch");
  const [text, setText] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-extrabold text-gray-800 text-lg">Rate Today's Meal</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="flex gap-2 mb-4">
          {["breakfast", "lunch", "dinner"].map(m => (
            <button key={m} onClick={() => setMeal(m)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold capitalize transition-all ${meal === m ? "bg-amber-500 text-white shadow" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
              {m}
            </button>
          ))}
        </div>
        <div className="flex justify-center gap-2 my-5">
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)} onClick={() => setRating(s)}
              className={`text-4xl transition-transform hover:scale-125 ${s <= (hovered || rating) ? "text-amber-400" : "text-gray-200"}`}>★</button>
          ))}
        </div>
        <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-amber-300 resize-none"
          placeholder="Share your feedback about today's meal..." />
        <div className="flex gap-2 mt-4">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">Cancel</button>
          <button onClick={() => { alert("Review submitted! Thank you."); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold shadow shadow-amber-200 transition-all">Submit Review</button>
        </div>
      </div>
    </div>
  );
};

const PaymentModal = ({ onClose }) => {
  const [method, setMethod] = useState("upi");
  const [upiId, setUpiId] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-extrabold text-gray-800 text-lg">Pay Mess Fee</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-4 mb-5 text-white">
          <p className="text-blue-200 text-xs mb-1">Amount Due — April 2025</p>
          <p className="text-3xl font-extrabold">₹3,200</p>
          <p className="text-blue-200 text-xs mt-1">Due by 5th April · Late fee: ₹50/day</p>
        </div>
        <div className="flex gap-2 mb-4">
          {[{ id: "upi", label: "UPI", icon: "📱" }, { id: "card", label: "Card", icon: "💳" }, { id: "netbanking", label: "Net Banking", icon: "🏦" }].map(m => (
            <button key={m.id} onClick={() => setMethod(m.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${method === m.id ? "bg-blue-600 text-white shadow" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
              <span>{m.icon}</span>{m.label}
            </button>
          ))}
        </div>
        {method === "upi" && (
          <input value={upiId} onChange={e => setUpiId(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 mb-3"
            placeholder="Enter UPI ID (e.g. name@upi)" />
        )}
        {method === "card" && (
          <div className="space-y-2 mb-3">
            <input className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="Card Number" />
            <div className="flex gap-2">
              <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none" placeholder="MM/YY" />
              <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none" placeholder="CVV" />
            </div>
          </div>
        )}
        {method === "netbanking" && (
          <select className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300 mb-3">
            <option>Select Bank</option>
            <option>SBI</option><option>HDFC</option><option>ICICI</option><option>Axis</option><option>PNB</option>
          </select>
        )}
        <button onClick={() => { alert("Redirecting to payment gateway..."); onClose(); }}
          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-200 transition-all">
          Pay ₹3,200 Securely →
        </button>
        <p className="text-center text-xs text-gray-400 mt-2">🔒 Secured by BIT Mesra Payment Gateway</p>
      </div>
    </div>
  );
};

const MessRequestModal = ({ onClose }) => {
  const [selected, setSelected] = useState({ B: true, L: true, D: true });
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-extrabold text-gray-800 text-lg">Request Mess Access</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <p className="text-gray-400 text-xs mb-5">Select meals for <span className="text-blue-600 font-semibold">{dateStr}</span></p>
        <div className="space-y-3 mb-5">
          {[
            { key: "B", label: "Breakfast", time: "7:30 AM – 9:00 AM", icon: "🌅" },
            { key: "L", label: "Lunch", time: "12:30 PM – 2:30 PM", icon: "☀️" },
            { key: "D", label: "Dinner", time: "7:30 PM – 9:30 PM", icon: "🌙" },
          ].map(m => (
            <div key={m.key} onClick={() => setSelected(s => ({ ...s, [m.key]: !s[m.key] }))}
              className={`flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer border-2 transition-all ${selected[m.key] ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-gray-50"}`}>
              <div className="flex items-center gap-3">
                <span className="text-xl">{m.icon}</span>
                <div>
                  <p className="text-sm font-semibold text-gray-700">{m.label}</p>
                  <p className="text-xs text-gray-400">{m.time}</p>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selected[m.key] ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
                {selected[m.key] && <span className="text-white text-xs">✓</span>}
              </div>
            </div>
          ))}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4">
          <p className="text-xs text-amber-700">⚠️ Requests must be submitted before <strong>10:00 PM</strong> tonight. Changes not allowed after submission.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500">Cancel</button>
          <button onClick={() => { alert("Mess request submitted successfully!"); onClose(); }}
            className="flex-1 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm shadow shadow-green-200 transition-all">
            Confirm Request
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function StudentDashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [showReview, setShowReview] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showMessRequest, setShowMessRequest] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pct = Math.round((ATTENDANCE.thisMonth.present / ATTENDANCE.thisMonth.total) * 100);
  const circumference = 2 * Math.PI * 36;
  const dash = (pct / 100) * circumference;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "attendance", label: "Attendance", icon: "📅" },
    { id: "menu", label: "Mess Menu", icon: "🍽️" },
    { id: "fees", label: "Fee History", icon: "💰" },
    { id: "leave", label: "Mess Leave", icon: "🏖️" },    // → redirect to leave management page
    { id: "complaints", label: "Complaints", icon: "📢" }, // → redirect to complaints page
    { id: "settings", label: "Settings", icon: "⚙️" },    // → redirect to profile/settings page
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 bg-[#0f172a] flex flex-col transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex`}>
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-sm shadow-lg shadow-blue-500/30">M</div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Smart Mess</p>
              <p className="text-white/40 text-xs">BIT Mesra</p>
            </div>
          </div>
        </div>

        {/* Student mini-card */}
        <div className="mx-3 mt-4 mb-2 bg-white/5 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {STUDENT.avatar}
          </div>
          <div className="overflow-hidden">
            <p className="text-white text-xs font-semibold truncate">{STUDENT.name.split(" ")[0]} {STUDENT.name.split(" ")[1]}</p>
            <p className="text-white/40 text-xs truncate">{STUDENT.rollNo}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {navItems.map(item => (
            <button key={item.id} onClick={() => { setActiveNav(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left
                ${activeNav === item.id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-white/50 hover:text-white hover:bg-white/5"}`}>
              <span className="text-base">{item.icon}</span>
              {item.label}
              {/* NOTE: "Mess Leave", "Complaints", "Settings" would navigate to their own pages in a real router setup */}
              {["leave", "complaints", "settings"].includes(item.id) && (
                <span className="ml-auto text-white/20 text-xs">→</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10">
          {/* NOTE: This button would call logout() and redirect to /login */}
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all">
            <span>⏻</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Sidebar overlay on mobile */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-100 px-5 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700 text-xl p-1">☰</button>
            <div>
              <h1 className="text-base font-extrabold text-gray-800">Student Dashboard</h1>
              <p className="text-xs text-gray-400 hidden sm:block">
                {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* NOTE: Bell icon would open a notifications panel/page */}
            <button className="relative w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-all">
              🔔
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xs">
              {STUDENT.avatar}
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">

          {/* ── Welcome Banner ── */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-5 mb-5 text-white relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/5 rounded-full" />
            <div className="absolute right-10 -bottom-8 w-24 h-24 bg-white/5 rounded-full" />
            <div className="relative">
              <p className="text-blue-200 text-xs mb-1">Welcome back 👋</p>
              <h2 className="text-xl font-extrabold mb-1">{STUDENT.name}</h2>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge color="blue">{STUDENT.rollNo}</Badge>
                <span className="text-xs bg-white/10 rounded-full px-2.5 py-0.5">{STUDENT.department}</span>
                <span className="text-xs bg-white/10 rounded-full px-2.5 py-0.5">{STUDENT.messBlock}</span>
                <span className={`text-xs rounded-full px-2.5 py-0.5 font-semibold ${STUDENT.feeStatus === "Paid" ? "bg-green-400/20 text-green-300" : "bg-red-400/20 text-red-300"}`}>
                  Fee: {STUDENT.feeStatus}
                </span>
              </div>
            </div>
          </div>

          {/* ── Quick Stats Row ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <StatPill label="This Month" value={`${pct}%`} sub={`${ATTENDANCE.thisMonth.present}/${ATTENDANCE.thisMonth.total} days`} color="blue" />
            <StatPill label="Total Meals" value={ATTENDANCE.totalMeals} sub="Since enrollment" color="green" />
            <StatPill label="Current Streak" value={`${ATTENDANCE.streak}d`} sub="Consecutive meals" color="amber" />
            <StatPill label="Fee Due" value="₹0" sub="All paid ✓" color="violet" />
          </div>

          {/* ── Main Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* LEFT column */}
            <div className="lg:col-span-2 space-y-4">

              {/* Quick Actions */}
              <SectionCard title="Quick Actions" icon="⚡">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Request Mess Access", icon: "🍛", color: "bg-green-50 hover:bg-green-100 text-green-700 border-green-200", onClick: () => setShowMessRequest(true) },
                    { label: "Make Payment", icon: "💳", color: "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200", onClick: () => setShowPayment(true) },
                    { label: "Give Review", icon: "⭐", color: "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200", onClick: () => setShowReview(true) },
                    // NOTE: "Apply Leave" navigates to the Mess Leave page
                    { label: "Apply Leave", icon: "🏖️", color: "bg-violet-50 hover:bg-violet-100 text-violet-700 border-violet-200", onClick: () => alert("Redirecting to Mess Leave page...") },
                  ].map(a => (
                    <button key={a.label} onClick={a.onClick}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-xs font-bold transition-all active:scale-95 ${a.color}`}>
                      <span className="text-2xl">{a.icon}</span>
                      <span className="text-center leading-tight">{a.label}</span>
                    </button>
                  ))}
                </div>
              </SectionCard>

              {/* Today's Menu */}
              <SectionCard title="Today's Menu" icon="📋"
                action={<Badge color="green">Veg</Badge>}>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { meal: "Breakfast", icon: "🌅", time: "7:30–9:00 AM", items: TODAY_MENU.breakfast },
                    { meal: "Lunch", icon: "☀️", time: "12:30–2:30 PM", items: TODAY_MENU.lunch },
                    { meal: "Dinner", icon: "🌙", time: "7:30–9:30 PM", items: TODAY_MENU.dinner },
                  ].map(m => (
                    <div key={m.meal} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div className="flex items-center gap-1.5 mb-2">
                        <span>{m.icon}</span>
                        <div>
                          <p className="text-xs font-bold text-gray-700">{m.meal}</p>
                          <p className="text-gray-400" style={{ fontSize: "10px" }}>{m.time}</p>
                        </div>
                      </div>
                      <ul className="space-y-1">
                        {m.items.map(item => (
                          <li key={item} className="text-gray-600 flex items-center gap-1" style={{ fontSize: "11px" }}>
                            <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {/* NOTE: "View Full Weekly Menu" navigates to the Mess Menu page */}
                <button onClick={() => alert("Redirecting to full weekly menu page...")}
                  className="mt-3 w-full py-2 text-xs text-blue-600 font-semibold hover:bg-blue-50 rounded-xl transition-all border border-blue-100">
                  View Full Weekly Menu →
                </button>
              </SectionCard>

              {/* Fee History */}
              <SectionCard title="Mess Fee History" icon="💰"
                action={
                  <button onClick={() => setShowPayment(true)}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded-lg transition-all">
                    Pay Now
                  </button>
                }>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-400 border-b border-gray-100">
                        <th className="text-left pb-2 font-semibold">Month</th>
                        <th className="text-left pb-2 font-semibold">Txn ID</th>
                        <th className="text-left pb-2 font-semibold">Method</th>
                        <th className="text-right pb-2 font-semibold">Amount</th>
                        <th className="text-right pb-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {FEE_HISTORY.map(f => (
                        <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-2.5 font-medium text-gray-700">{f.month}</td>
                          <td className="py-2.5 text-gray-400 font-mono">{f.id}</td>
                          <td className="py-2.5 text-gray-500">{f.method}</td>
                          <td className="py-2.5 text-right font-bold text-gray-800">₹{f.amount.toLocaleString()}</td>
                          <td className="py-2.5 text-right">
                            <Badge color="green">{f.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* NOTE: "View Full History" navigates to the detailed fee history page */}
                <button onClick={() => alert("Redirecting to full fee history page...")}
                  className="mt-3 w-full py-2 text-xs text-blue-600 font-semibold hover:bg-blue-50 rounded-xl transition-all border border-blue-100">
                  View Full History →
                </button>
              </SectionCard>

            </div>

            {/* RIGHT column */}
            <div className="space-y-4">

              {/* Attendance ring */}
              <SectionCard title="Monthly Attendance" icon="📅">
                <div className="flex flex-col items-center">
                  <div className="relative w-28 h-28">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 84 84">
                      <circle cx="42" cy="42" r="36" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                      <circle cx="42" cy="42" r="36" fill="none"
                        stroke={pct >= 75 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444"}
                        strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${dash} ${circumference}`} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-extrabold text-gray-800">{pct}%</span>
                      <span className="text-gray-400 text-xs">Overall</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 w-full mt-4">
                    {[
                      { label: "B'fast", val: ATTENDANCE.thisMonth.meals.B, color: "text-orange-500" },
                      { label: "Lunch", val: ATTENDANCE.thisMonth.meals.L, color: "text-blue-500" },
                      { label: "Dinner", val: ATTENDANCE.thisMonth.meals.D, color: "text-indigo-500" },
                    ].map(m => (
                      <div key={m.label} className="text-center bg-gray-50 rounded-xl p-2">
                        <p className={`text-lg font-extrabold ${m.color}`}>{m.val}</p>
                        <p className="text-gray-400 text-xs">{m.label}</p>
                      </div>
                    ))}
                  </div>
                  {/* NOTE: "Detailed Report" navigates to full attendance history page */}
                  <button onClick={() => alert("Redirecting to full attendance report...")}
                    className="mt-3 w-full py-2 text-xs text-blue-600 font-semibold hover:bg-blue-50 rounded-xl transition-all border border-blue-100">
                    Detailed Report →
                  </button>
                </div>
              </SectionCard>

              {/* Student Info */}
              <SectionCard title="My Profile" icon="🎓"
                action={
                  // NOTE: "Edit" navigates to profile/settings page
                  <button onClick={() => alert("Redirecting to profile settings...")}
                    className="text-xs text-blue-500 hover:underline font-semibold">Edit</button>
                }>
                <dl className="space-y-2.5">
                  {[
                    { label: "Roll No.", value: STUDENT.rollNo },
                    { label: "Department", value: STUDENT.department },
                    { label: "Year", value: STUDENT.year },
                    { label: "Hostel", value: STUDENT.hostel },
                    { label: "Mess Type", value: STUDENT.messType },
                    { label: "Valid Till", value: STUDENT.validTill },
                  ].map(f => (
                    <div key={f.label} className="flex justify-between items-start gap-2">
                      <dt className="text-xs text-gray-400 flex-shrink-0">{f.label}</dt>
                      <dd className="text-xs font-semibold text-gray-700 text-right">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              </SectionCard>

              {/* Notices */}
              <SectionCard title="Notices" icon="📢">
                <div className="space-y-3">
                  {NOTICES.map(n => {
                    const styles = {
                      info: "bg-blue-50 border-blue-200 text-blue-800",
                      warn: "bg-amber-50 border-amber-200 text-amber-800",
                      success: "bg-green-50 border-green-200 text-green-800",
                    };
                    const icons = { info: "ℹ️", warn: "⚠️", success: "✅" };
                    return (
                      <div key={n.id} className={`rounded-xl border p-3 ${styles[n.type]}`}>
                        <div className="flex gap-2">
                          <span className="text-sm flex-shrink-0 mt-0.5">{icons[n.type]}</span>
                          <div>
                            <p className="text-xs leading-relaxed">{n.text}</p>
                            <p className="text-xs opacity-50 mt-1">{n.date}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* NOTE: "All Notices" navigates to full notices/announcements page */}
                <button onClick={() => alert("Redirecting to all notices page...")}
                  className="mt-3 w-full py-2 text-xs text-blue-600 font-semibold hover:bg-blue-50 rounded-xl transition-all border border-blue-100">
                  All Notices →
                </button>
              </SectionCard>

              {/* Mess Card / QR */}
              <SectionCard title="Digital Mess Card" icon="🪪">
                <div className="bg-gradient-to-br from-[#0f172a] to-[#1e3a5f] rounded-xl p-4 text-white text-center">
                  <p className="text-white/50 text-xs mb-1">BIT Mesra · Smart Mess</p>
                  <div className="w-20 h-20 bg-white rounded-lg mx-auto mb-3 flex items-center justify-center overflow-hidden">
                    {/* Simple QR representation */}
                    <svg viewBox="0 0 40 40" className="w-16 h-16">
                      {[0,1,2,3,4,5,6].map(r => [0,1,2,3,4,5,6].map(c => {
                        const corner = (r < 2 && c < 2) || (r < 2 && c > 4) || (r > 4 && c < 2);
                        const val = (r * 7 + c * 3 + 5) % 2 === 0;
                        return val ? <rect key={`${r}-${c}`} x={c * 5 + 2.5} y={r * 5 + 2.5} width="4" height="4" fill={corner ? "#0f172a" : "#374151"} /> : null;
                      }))}
                    </svg>
                  </div>
                  <p className="font-bold text-sm">{STUDENT.name.split(" ")[0]} {STUDENT.name.split(" ")[1]}</p>
                  <p className="text-white/50 text-xs">{STUDENT.rollNo}</p>
                  <div className="mt-2 flex justify-center gap-1.5">
                    <span className="text-xs bg-green-500/20 text-green-300 rounded-full px-2 py-0.5">Active</span>
                    <span className="text-xs bg-white/10 rounded-full px-2 py-0.5">{STUDENT.messType}</span>
                  </div>
                </div>
                {/* NOTE: "Download Card" would trigger PDF generation/download */}
                <button onClick={() => alert("Generating downloadable mess card...")}
                  className="mt-3 w-full py-2 text-xs text-gray-600 font-semibold hover:bg-gray-100 rounded-xl transition-all border border-gray-200">
                  ⬇ Download Card
                </button>
              </SectionCard>

            </div>
          </div>
        </main>
      </div>

      {/* ── Modals ── */}
      {showReview && <ReviewModal onClose={() => setShowReview(false)} />}
      {showPayment && <PaymentModal onClose={() => setShowPayment(false)} />}
      {showMessRequest && <MessRequestModal onClose={() => setShowMessRequest(false)} />}
    </div>
  );
}