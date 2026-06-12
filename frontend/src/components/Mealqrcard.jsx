import { useRef, useEffect, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";

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

export default function MealQRCard({ student, qrToken }) {
  const canvasRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied]           = useState(false);
  const [qrError, setQrError]         = useState(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

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
  }, [student.roll]);

  return (
    <div className="bg-slate-100 flex items-center rounded-2xl justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden">

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

        {/* QR canvas */}
        <div className="flex justify-center px-6 pb-2">
          <div className={`p-3 rounded-2xl border-2 shadow-inner}`}>
            {qrError ? (
              <div className="w-[200px] h-[200px] flex items-center justify-center text-xs text-red-400 text-center px-4">
                {qrError}
              </div>
            ) : (
            <div className="bg-white p-2 rounded-lg">
              <QRCodeSVG value={qrToken} size={180} />
            </div>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 pb-3 px-6">
          Scan at the mess counter · Valid for today only
        </p>


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
        </div>

        <p className="text-center text-xs text-slate-300 pb-4">
          Generated · {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </p>

      </div>
    </div>
  );
}