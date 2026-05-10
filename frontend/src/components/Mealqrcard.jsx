import { useRef, useEffect, useState, useCallback } from "react";
import QRCodeGen from "qrcode";

// ─── constants ───────────────────────────────────────────────────────────────

const MEALS = ["breakfast", "lunch", "dinner"];

const MEAL_META = {
  breakfast: { label: "Breakfast", time: "7:30 – 9:00 AM",  emoji: "🍳" },
  lunch:     { label: "Lunch",     time: "12:30 – 2:30 PM", emoji: "☀️" },
  dinner:    { label: "Dinner",    time: "7:30 – 9:30 PM",  emoji: "🌙" },
};

const QR_OPTS = {
  width: 200,
  margin: 2,
  errorCorrectionLevel: "H",
  color: { dark: "#1e293b", light: "#ffffff" },
};

// ─── helpers ─────────────────────────────────────────────────────────────────

function getCurrentMeal() {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  if (h >= 7.5  && h < 9)    return "breakfast";
  if (h >= 12.5 && h < 14.5) return "lunch";
  if (h >= 19.5 && h < 21.5) return "dinner";
  return null;
}

function isMealBooked(bookedSet, date, mealId) {
  return bookedSet instanceof Set
    ? bookedSet.has(`${date.toDateString()}_${mealId}`)
    : false;
}

function buildPayload(student, bookedSet) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentMeal = getCurrentMeal();
  const allowed = currentMeal !== null && isMealBooked(bookedSet, today, currentMeal);

  return JSON.stringify({
    name:        student.name,
    roll:        student.roll,
    dept:        student.dept,
    currentMeal: currentMeal ?? "none",
    allowed,
    generatedAt: new Date().toISOString(),
    bookings: MEALS.map(m => ({
      meal:   m,
      booked: isMealBooked(bookedSet, today, m),
    })),
  });
}

// ─── component ───────────────────────────────────────────────────────────────

export default function MealQRCard({ student, bookedSet }) {
  const canvasRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied]           = useState(false);
  const [qrError, setQrError]         = useState(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentMeal = getCurrentMeal();
  const allowed     = currentMeal !== null && isMealBooked(bookedSet, today, currentMeal);
  const payload     = buildPayload(student, bookedSet);

  // Draw QR onto canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    setQrError(null);
    QRCodeGen.toCanvas(canvasRef.current, payload, QR_OPTS, (err) => {
      if (err) {
        console.error("QR generation failed:", err);
        setQrError("Failed to generate QR code.");
      }
    });
  }, [payload]);

  // Download PNG
  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const dataUrl = await QRCodeGen.toDataURL(payload, { ...QR_OPTS, width: 600 });
      const a = document.createElement("a");
      a.href     = dataUrl;
      a.download = `meal-pass-${student.roll}-${Date.now()}.png`;
      a.click();
    } catch (e) {
      console.error("Download failed:", e);
    } finally {
      setDownloading(false);
    }
  }, [payload, student.roll]);

  // Copy JSON payload
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(payload).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }, [payload]);

  const qrBorderClass = allowed
    ? "border-green-200 bg-green-50"
    : currentMeal
    ? "border-red-200 bg-red-50"
    : "border-slate-200 bg-slate-50";

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden">

        {/* Accent strip */}
        <div className={`h-2 w-full ${allowed ? "bg-green-500" : currentMeal ? "bg-red-400" : "bg-slate-300"}`} />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100">
          <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-1">
            Mess Digital Pass
          </p>
          <h1 className="text-2xl font-black text-slate-800 leading-tight">{student.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm font-mono font-bold text-slate-500">{student.roll}</span>
            <span className="text-slate-300">·</span>
            <span className="text-sm text-slate-500">{student.dept}</span>
          </div>
        </div>

        {/* Status badge */}
        <div className="px-6 py-4 flex justify-center">
          {!currentMeal ? (
            <div className="flex items-center gap-2 bg-gray-100 text-gray-500 rounded-full px-4 py-1.5 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
              No Active Meal Window
            </div>
          ) : allowed ? (
            <div className="flex items-center gap-2 bg-green-100 text-green-700 rounded-full px-4 py-1.5 text-sm font-bold">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />
              Allowed — {MEAL_META[currentMeal].label}
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-red-100 text-red-600 rounded-full px-4 py-1.5 text-sm font-bold">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              Not Booked — {MEAL_META[currentMeal].label}
            </div>
          )}
        </div>

        {/* QR canvas */}
        <div className="flex justify-center px-6 pb-2">
          <div className={`p-3 rounded-2xl border-2 shadow-inner ${qrBorderClass}`}>
            {qrError ? (
              <div className="w-[200px] h-[200px] flex items-center justify-center text-xs text-red-400 text-center px-4">
                {qrError}
              </div>
            ) : (
              <canvas ref={canvasRef} />
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 pb-3 px-6">
          Scan at the mess counter · Valid for today only
        </p>

        {/* Today's meal slots */}
        <div className="mx-6 mb-4 rounded-xl bg-slate-50 border border-slate-100 divide-y divide-slate-100 overflow-hidden">
          {MEALS.map(m => {
            const booked = isMealBooked(bookedSet, today, m);
            const active = m === currentMeal;
            return (
              <div
                key={m}
                className={`flex items-center gap-3 px-4 py-2.5 ${
                  active ? (allowed ? "bg-green-50" : "bg-red-50") : ""
                }`}
              >
                <span className="text-base w-6 text-center select-none">{MEAL_META[m].emoji}</span>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${active ? "text-slate-800" : "text-slate-500"}`}>
                    {MEAL_META[m].label}
                    {active && (
                      <span className="ml-2 text-xs font-bold text-blue-500 uppercase tracking-wide">Now</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-400">{MEAL_META[m].time}</p>
                </div>
                {booked ? (
                  <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                ) : (
                  <span className="w-6 h-6 rounded-full border-2 border-slate-300 bg-white flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 active:scale-95 text-white text-sm font-bold py-3 rounded-xl transition-all disabled:opacity-60"
          >
            {downloading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Saving…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 3v12" />
                </svg>
                Download PNG
              </>
            )}
          </button>

          <button
            onClick={handleCopy}
            title="Copy QR payload"
            className="px-4 py-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 text-slate-600 transition-all active:scale-95"
          >
            {copied ? (
              <span className="text-green-500 font-bold text-sm">✓</span>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>

        <p className="text-center text-xs text-slate-300 pb-4">
          Generated · {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </p>

      </div>
    </div>
  );
}