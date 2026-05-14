/**
 * MLPredictionsTab.jsx
 *
 * Usage: {activeNav === "ml" && <MLPredictionsTab />}
 * Requires: npm install recharts (already installed)
 *
 * Calls: GET http://localhost:5000/api/predictions
 */

import { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";

const API = "http://localhost:8000/api/predictions";

// ─── mock actual data to compare against predictions ────────────────────────
// In production, replace this with your real attendance/waste DB data
function getMockActuals(forecast) {
  return forecast.map((f) => ({
    day:              f.day,
    actual_attendance: Math.round(f.predicted_attendance * (0.92 + Math.random() * 0.14)),
    actual_waste_pct:  parseFloat((f.predicted_waste_pct  * (0.88 + Math.random() * 0.28)).toFixed(2)),
    actual_money_wasted: Math.round(f.predicted_money_wasted * (0.90 + Math.random() * 0.22)),
  }));
}

// ─── custom tooltip ──────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, unit = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-3 text-xs shadow-xl">
      <p className="font-bold text-slate-300 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-400">{p.name}:</span>
          <span className="font-bold text-white">
            {unit === "₹" ? `₹${p.value}` : `${p.value}${unit}`}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── accuracy badge ───────────────────────────────────────────────────────────
function AccBadge({ value }) {
  const color =
    value >= 90 ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/30"
    : value >= 75 ? "text-blue-400 bg-blue-400/10 border-blue-400/30"
    : "text-red-400 bg-red-400/10 border-red-400/30";
  return (
    <span className={`text-xs font-black px-2 py-0.5 rounded-full border ${color}`}>
      R² {value}%
    </span>
  );
}

// ─── anomaly detector ─────────────────────────────────────────────────────────
function detectAnomalies(combined) {
  return combined
    .filter((d) => {
      const diff = Math.abs(d.actual_attendance - d.predicted_attendance);
      const pct  = (diff / d.predicted_attendance) * 100;
      return pct > 5;
    })
    .map((d) => {
      const diff = d.actual_attendance - d.predicted_attendance;
      return {
        day:  d.day,
        diff,
        type: diff < 0 ? "low" : "high",
        pct:  Math.abs(((diff / d.predicted_attendance) * 100)).toFixed(1),
      };
    });
}

// ─── section card wrapper ─────────────────────────────────────────────────────
function Card({ title, subtitle, badge, children }) {
  return (
    <div className="bg-slate-900 border border-slate-900 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-sm font-black text-slate-100">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function MLPredictionsTab() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    fetch(API)
      .then((r) => {
        if (!r.ok) throw new Error(`Server responded ${r.status}`);
        return r.json();
      })
      .then((json) => { setData(json); setLoading(false); })
      .catch((e)   => { setError(e.message); setLoading(false); });
  }, []);

  // ── loading ──
  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      <p className="text-sm text-slate-400">Fetching ML predictions…</p>
    </div>
  );

  // ── error ──
  if (error) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-center px-6">
      <span className="text-4xl">⚠️</span>
      <p className="text-sm font-bold text-red-400">Could not reach Flask API</p>
      <p className="text-xs text-slate-500 max-w-xs">
        Make sure <code className="bg-slate-900 px-1 py-0.5 rounded text-slate-300">python app.py</code> is
        running on <code className="bg-slate-900 px-1 py-0.5 rounded text-slate-300">localhost:5000</code>
      </p>
      <p className="text-xs text-red-500/70 font-mono">{error}</p>
    </div>
  );

  const { waste_model, money_model, attendance_model, feature_importance, forecast_next_7_days, summary } = data;

  const actuals  = getMockActuals(forecast_next_7_days);

  // Merge predicted + actual into one array for charts
  const combined = forecast_next_7_days.map((f, i) => ({
    day:                    f.day,
    predicted_attendance:   f.predicted_attendance,
    booked_count:           f.booked_count,
    predicted_waste_pct:    f.predicted_waste_pct,
    predicted_money_wasted: f.predicted_money_wasted,
    estimated_savings:      f.estimated_savings,
    actual_attendance:      actuals[i].actual_attendance,
    actual_waste_pct:       actuals[i].actual_waste_pct,
    actual_money_wasted:    actuals[i].actual_money_wasted,
  }));

  const anomalies   = detectAnomalies(combined);
  const totalSaved  = combined.reduce((s, d) => s + d.estimated_savings, 0);
  const avgWaste    = (combined.reduce((s, d) => s + d.predicted_waste_pct, 0) / combined.length).toFixed(1);
  const peakDay     = combined.reduce((a, b) => a.predicted_attendance > b.predicted_attendance ? a : b);

  // Feature importance as array for bar chart
  const fiData = Object.entries(feature_importance)
    .map(([k, v]) => ({ feature: k.replace(/_/g, " "), importance: v }))
    .sort((a, b) => b.importance - a.importance);

  return (
    <div className=" space-y-5 pb-10">

      {/* ── header ── */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🤖</span>
            <h2 className="text-xl font-black ">ML Predictions</h2>
            <span className="text-[10px] font-black bg-violet-500/20 text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Live Model
            </span>
          </div>
          <p className="text-xs text-slate-500">
            RandomForest + GradientBoosting · 7-day forecast vs actuals
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-all"
        >
          ↻ Refresh
        </button>
      </div>

      {/* ── model accuracy cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            label: "Waste % Model",
            desc:  waste_model.description,
            acc:   waste_model.accuracy_r2_pct,
            mae:   `±${waste_model.mae}%`,
            icon:  "♻️",
            color: "emerald",
          },
          {
            label: "Money Wasted Model",
            desc:  money_model.description,
            acc:   money_model.accuracy_r2_pct,
            mae:   `±₹${money_model.mae}`,
            icon:  "💸",
            color: "blue",
          },
          {
            label: "Attendance Model",
            desc:  attendance_model?.description ?? "Predicts daily attendance",
            acc:   attendance_model?.accuracy_r2_pct ?? "—",
            mae:   attendance_model ? `±${attendance_model.mae} students` : "—",
            icon:  "👥",
            color: "violet",
          },
        ].map((m, i) => (
          <div key={i} className="bg-slate-900 border border-slate-700/60 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xl">{m.icon}</span>
              <AccBadge value={m.acc} />
            </div>
            <p className="text-sm font-black text-slate-100">{m.label}</p>
            <p className="text-[11px] text-slate-500 leading-tight">{m.desc}</p>
            <div className="mt-auto pt-2 border-t border-slate-700/50">
              <span className="text-xs text-slate-400">Avg error: </span>
              <span className="text-xs font-bold text-slate-300">{m.mae}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── summary hero stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "7-day Savings",    value: `₹${totalSaved.toFixed(0)}`, icon: "💰", color: "text-emerald-400" },
          { label: "Avg Waste",         value: `${avgWaste}%`,              icon: "📉", color: "text-orange-400" },
          { label: "Peak Day",          value: peakDay.day,                 icon: "📈", color: "text-blue-400"   },
          { label: "Anomalies Found",   value: anomalies.length,            icon: "🚨", color: anomalies.length > 0 ? "text-red-400" : "text-slate-400" },
        ].map((s, i) => (
          <div key={i} className="bg-slate-900 border border-slate-700/60 rounded-2xl px-4 py-3.5">
            <span className="text-lg">{s.icon}</span>
            <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── attendance: predicted vs actual ── */}
      <Card
        title="Attendance — Predicted vs Actual"
        subtitle="Booked count, model prediction, and real turnout per day"
        badge={<AccBadge value={attendance_model?.accuracy_r2_pct ?? "—"} />}
      >
        <ResponsiveContainer width="100%" height={230}>
          <LineChart data={combined} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip unit=" students" />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8, color: "#94a3b8" }} />
            <Line type="monotone" dataKey="booked_count"          name="Booked"    stroke="#475569" strokeWidth={2} strokeDasharray="5 4" dot={false} />
            <Line type="monotone" dataKey="predicted_attendance"  name="Predicted" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 3, fill: "#818cf8" }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="actual_attendance"     name="Actual"    stroke="#34d399" strokeWidth={2.5} dot={{ r: 3, fill: "#34d399" }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* ── waste %: predicted vs actual ── */}
      <Card
        title="Food Waste % — Predicted vs Actual"
        subtitle="Lower is better. Gap between lines = model precision"
        badge={<AccBadge value={waste_model.accuracy_r2_pct} />}
      >
        <ResponsiveContainer width="100%" height={210}>
          <LineChart data={combined} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip content={<CustomTooltip unit="%" />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8, color: "#94a3b8" }} />
            <ReferenceLine y={summary.avg_daily_waste_pct} stroke="#f59e0b" strokeDasharray="4 3"
              label={{ value: "Hist. avg", position: "insideTopRight", fontSize: 10, fill: "#f59e0b" }} />
            <Line type="monotone" dataKey="predicted_waste_pct" name="Predicted" stroke="#fb923c" strokeWidth={2.5} dot={{ r: 3, fill: "#fb923c" }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="actual_waste_pct"    name="Actual"    stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3, fill: "#f43f5e" }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* ── money wasted + savings ── */}
      <Card
        title="Money Wasted vs Estimated Savings (₹)"
        subtitle="Bar = money lost to waste · Line = savings vs historical baseline"
        badge={<AccBadge value={money_model.accuracy_r2_pct} />}
      >
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={combined} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
            <Tooltip content={<CustomTooltip unit="₹" />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8, color: "#94a3b8" }} />
            <Line type="monotone" dataKey="predicted_money_wasted" name="Predicted wasted" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3, fill: "#f97316" }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="actual_money_wasted"    name="Actual wasted"    stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3, fill: "#ef4444" }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="estimated_savings"      name="Savings"          stroke="#34d399" strokeWidth={2}   dot={{ r: 3, fill: "#34d399" }} strokeDasharray="5 3" activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* ── two col: feature importance + anomaly table ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Feature importance */}
        <Card title="Feature Importance" subtitle="What drives waste prediction most">
          <div className="space-y-2.5">
            {fiData.map((f, i) => {
              const pct   = (f.importance * 100).toFixed(1);
              const color = i === 0 ? "bg-violet-500" : i === 1 ? "bg-blue-500" : i === 2 ? "bg-emerald-500" : "bg-slate-500";
              return (
                <div key={f.feature}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-300 capitalize">{f.feature}</span>
                    <span className="text-xs font-black text-slate-400">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color} transition-all duration-700`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Anomaly detection */}
        <Card title="Anomaly Detection" subtitle="Days where actual ≠ predicted by >10%">
          {anomalies.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-center">
              <span className="text-3xl">✅</span>
              <p className="text-sm font-bold text-emerald-400">No anomalies detected</p>
              <p className="text-xs text-slate-500">All days within 10% tolerance</p>
            </div>
          ) : (
            <div className="space-y-2">
              {anomalies.map((a, i) => (
                <div key={i} className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${
                  a.type === "low"
                    ? "bg-red-500/10 border-red-500/30"
                    : "bg-amber-500/10 border-amber-500/30"
                }`}>
                  <div className="flex items-center gap-2">
                    <span>{a.type === "low" ? "📉" : "📈"}</span>
                    <div>
                      <p className="text-xs font-black text-slate-200">{a.day}</p>
                      <p className="text-[11px] text-slate-400">
                        {a.type === "low" ? "Lower" : "Higher"} than predicted by {a.pct}%
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                    a.type === "low"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-amber-500/20 text-amber-400"
                  }`}>
                    {a.diff > 0 ? "+" : ""}{a.diff}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── raw forecast table ── */}
      <Card title="Raw Forecast Data" subtitle="Full 7-day predicted vs actual comparison">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700">
                {["Day","Booked","Pred. Attend.","Act. Attend.","Pred. Waste%","Act. Waste%","Pred. ₹Lost","Act. ₹Lost","Savings"].map(h => (
                  <th key={h} className="text-left text-slate-500 font-semibold pb-2 pr-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {combined.map((r, i) => {
                const attendDiff = Math.abs(r.actual_attendance - r.predicted_attendance);
                const anomaly    = (attendDiff / r.predicted_attendance) * 100 > 10;
                return (
                  <tr key={i} className={anomaly ? "bg-red-500/5" : ""}>
                    <td className="py-2.5 pr-4 font-black text-slate-200">{r.day}</td>
                    <td className="py-2.5 pr-4 text-slate-400">{r.booked_count}</td>
                    <td className="py-2.5 pr-4 text-violet-400 font-semibold">{r.predicted_attendance}</td>
                    <td className={`py-2.5 pr-4 font-semibold ${anomaly ? "text-red-400" : "text-emerald-400"}`}>
                      {r.actual_attendance}
                      {anomaly && <span className="ml-1 text-[10px]">⚠️</span>}
                    </td>
                    <td className="py-2.5 pr-4 text-orange-400 font-semibold">{r.predicted_waste_pct}%</td>
                    <td className="py-2.5 pr-4 text-red-400 font-semibold">{r.actual_waste_pct}%</td>
                    <td className="py-2.5 pr-4 text-slate-400">₹{r.predicted_money_wasted}</td>
                    <td className="py-2.5 pr-4 text-slate-400">₹{r.actual_money_wasted}</td>
                    <td className="py-2.5 pr-4 text-emerald-400 font-black">₹{r.estimated_savings}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── footer note ── */}
      <p className="text-center text-xs text-slate-600 pb-2">
        Actual data shown is simulated for comparison · Replace <code className="text-slate-500">getMockActuals()</code> with your real DB query
      </p>

    </div>
  );
}