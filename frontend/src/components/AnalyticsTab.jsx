import { useState } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from "recharts";

// ─── mock data ────────────────────────────────────────────────────────────────

const WEEKLY_ATTENDANCE = [
  { day: "Mon", breakfast: 187, lunch: 312, dinner: 278 },
  { day: "Tue", breakfast: 203, lunch: 298, dinner: 261 },
  { day: "Wed", breakfast: 176, lunch: 334, dinner: 289 },
  { day: "Thu", breakfast: 221, lunch: 307, dinner: 254 },
  { day: "Fri", breakfast: 195, lunch: 289, dinner: 302 },
  { day: "Sat", breakfast: 143, lunch: 256, dinner: 318 },
  { day: "Sun", breakfast: 132, lunch: 241, dinner: 334 },
];

const MONTHLY_TREND = [
  { week: "Wk 1", total: 1842, capacity: 2100 },
  { week: "Wk 2", total: 1967, capacity: 2100 },
  { week: "Wk 3", total: 2031, capacity: 2100 },
  { week: "Wk 4", total: 1889, capacity: 2100 },
];

const MEAL_DISTRIBUTION = [
  { name: "Breakfast", value: 1257, color: "#f97316" },
  { name: "Lunch",     value: 2037, color: "#3b82f6" },
  { name: "Dinner",    value: 2036, color: "#8b5cf6" },
];

const DEPT_BREAKDOWN = [
  { dept: "CSE",  students: 312, attending: 289 },
  { dept: "ECE",  students: 278, attending: 241 },
  { dept: "ME",   students: 256, attending: 198 },
  { dept: "CE",   students: 234, attending: 201 },
  { dept: "EEE",  students: 198, attending: 167 },
  { dept: "IT",   students: 189, attending: 176 },
];

const WASTE_TREND = [
  { day: "Mon", waste: 12 },
  { day: "Tue", waste: 8  },
  { day: "Wed", waste: 15 },
  { day: "Thu", waste: 6  },
  { day: "Fri", waste: 11 },
  { day: "Sat", waste: 18 },
  { day: "Sun", waste: 21 },
];

// ─── summary stats ────────────────────────────────────────────────────────────

const STATS = [
  {
    label: "Avg Daily Meals",
    value: "763",
    sub: "+4.2% vs last week",
    up: true,
    icon: "🍽️",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-100",
  },
  {
    label: "Attendance Rate",
    value: "87.3%",
    sub: "+1.8% vs last week",
    up: true,
    icon: "📈",
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-100",
  },
  {
    label: "Peak Meal",
    value: "Dinner",
    sub: "Avg 296 students/day",
    up: null,
    icon: "🌙",
    bg: "bg-violet-50",
    text: "text-violet-700",
    border: "border-violet-100",
  },
  {
    label: "Food Waste",
    value: "13.0%",
    sub: "−2.1% vs last week",
    up: false,
    icon: "♻️",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-100",
  },
];

// ─── custom tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2.5 text-xs">
      <p className="font-bold text-slate-700 mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span className="text-slate-500 capitalize">{p.name}:</span>
          <span className="font-bold text-slate-800">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── range toggle ─────────────────────────────────────────────────────────────

function RangeToggle({ value, onChange, options }) {
  return (
    <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
      {options.map(o => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
            value === o
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function AnalyticsTab() {
  const [attendanceRange, setAttendanceRange] = useState("Weekly");
  const [distRange, setDistRange]             = useState("This Week");

  const attendanceData =
    attendanceRange === "Weekly" ? WEEKLY_ATTENDANCE : MONTHLY_TREND;

  return (
    <div className="space-y-6 pb-8">

      {/* ── page title ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800">Mess Analytics</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            May 2025 · BIT Mesra Hostel-13 Mess
          </p>
        </div>
        <span className="text-xs bg-green-100 text-green-700 font-bold px-3 py-1.5 rounded-full">
          ● Live
        </span>
      </div>

      {/* ── summary cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STATS.map((s, i) => (
          <div
            key={i}
            className={`rounded-2xl border ${s.border} ${s.bg} px-4 py-3.5 flex flex-col gap-1.5`}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg">{s.icon}</span>
              {s.up !== null && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  s.up
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-500"
                }`}>
                  {s.up ? "▲" : "▼"}
                </span>
              )}
            </div>
            <p className={`text-2xl font-black ${s.text}`}>{s.value}</p>
            <p className="text-xs font-semibold text-slate-500 leading-tight">{s.label}</p>
            <p className="text-[11px] text-slate-400 leading-tight">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── attendance trend (line chart) ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-800">Attendance Trend</h3>
            <p className="text-xs text-slate-400">Meals served per day by type</p>
          </div>
          <RangeToggle
            value={attendanceRange}
            onChange={setAttendanceRange}
            options={["Weekly", "Monthly"]}
          />
        </div>
        <ResponsiveContainer width="100%" height={220}>
          {attendanceRange === "Weekly" ? (
            <LineChart data={WEEKLY_ATTENDANCE} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
              />
              <Line type="monotone" dataKey="breakfast" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3, fill: "#f97316" }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="lunch"     stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3, fill: "#3b82f6" }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="dinner"    stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3, fill: "#8b5cf6" }} activeDot={{ r: 5 }} />
            </LineChart>
          ) : (
            <LineChart data={MONTHLY_TREND} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Line type="monotone" dataKey="total"    stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: "#3b82f6" }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="capacity" stroke="#e2e8f0" strokeWidth={2} strokeDasharray="5 4" dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* ── two-col row: meal distribution + dept breakdown ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Meal type distribution — bar chart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-800">Meal Distribution</h3>
              <p className="text-xs text-slate-400">Total bookings by meal type</p>
            </div>
            <RangeToggle
              value={distRange}
              onChange={setDistRange}
              options={["This Week", "Last Week"]}
            />
          </div>
          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={MEAL_DISTRIBUTION} margin={{ top: 4, right: 8, left: -24, bottom: 0 }} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
              <Bar dataKey="value" name="Bookings" radius={[6, 6, 0, 0]}>
                {MEAL_DISTRIBUTION.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Mini legend with percentages */}
          <div className="flex gap-3 mt-3">
            {MEAL_DISTRIBUTION.map((m) => {
              const total = MEAL_DISTRIBUTION.reduce((s, x) => s + x.value, 0);
              const pct   = ((m.value / total) * 100).toFixed(1);
              return (
                <div key={m.name} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                  <span className="text-[10px] text-slate-500 font-medium">{m.name}</span>
                  <span className="text-xs font-black text-slate-700">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Department breakdown — horizontal bar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="mb-4">
            <h3 className="text-sm font-black text-slate-800">Dept. Attendance</h3>
            <p className="text-xs text-slate-400">Students attending vs enrolled</p>
          </div>
          <div className="space-y-3">
            {DEPT_BREAKDOWN.map((d) => {
              const pct = Math.round((d.attending / d.students) * 100);
              const color =
                pct >= 90 ? "bg-green-500"
                : pct >= 75 ? "bg-blue-500"
                : pct >= 60 ? "bg-amber-400"
                : "bg-red-400";
              return (
                <div key={d.dept}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700">{d.dept}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">{d.attending}/{d.students}</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                        pct >= 90 ? "bg-green-100 text-green-700"
                        : pct >= 75 ? "bg-blue-100 text-blue-700"
                        : pct >= 60 ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-600"
                      }`}>{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${color} transition-all duration-700`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── food waste trend (line chart) ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-800">Food Waste Trend</h3>
            <p className="text-xs text-slate-400">Estimated waste % per day this week</p>
          </div>
          <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full">
            Avg 13.0%
          </span>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={WASTE_TREND} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${v}%`}
            />
            <Tooltip
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="bg-white border border-slate-200 rounded-xl shadow px-3 py-2 text-xs">
                    <p className="font-bold text-slate-700">{label}</p>
                    <p className="text-orange-600 font-bold mt-0.5">Waste: {payload[0].value}%</p>
                  </div>
                ) : null
              }
            />
            <Line
              type="monotone"
              dataKey="waste"
              stroke="#f97316"
              strokeWidth={2.5}
              dot={{ r: 4, fill: "#f97316", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── quick insight chips ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            icon: "🏆",
            title: "Best Day",
            value: "Wednesday",
            note: "Highest avg attendance (300 meals)",
            bg: "bg-blue-50 border-blue-100",
            vtext: "text-blue-800",
          },
          {
            icon: "📉",
            title: "Lowest Turnout",
            value: "Sunday Breakfast",
            note: "132 students attended",
            bg: "bg-amber-50 border-amber-100",
            vtext: "text-amber-800",
          },
          {
            icon: "🎯",
            title: "Top Dept.",
            value: "CSE",
            note: "92.6% attendance rate",
            bg: "bg-green-50 border-green-100",
            vtext: "text-green-800",
          },
        ].map((c, i) => (
          <div key={i} className={`rounded-2xl border p-4 ${c.bg} flex items-start gap-3`}>
            <span className="text-2xl">{c.icon}</span>
            <div>
              <p className="text-xs text-slate-500 font-semibold">{c.title}</p>
              <p className={`text-sm font-black ${c.vtext} mt-0.5`}>{c.value}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{c.note}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}