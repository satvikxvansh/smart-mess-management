import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";

// ─── constants ────────────────────────────────────────────────────────────────

const MEAL_META = {
  breakfast: { label: "Breakfast", emoji: "🍳", time: "7:30 – 9:00 AM" },
  lunch:     { label: "Lunch",     emoji: "☀️", time: "12:30 – 2:30 PM" },
  dinner:    { label: "Dinner",    emoji: "🌙", time: "7:30 – 9:30 PM" },
};

// ─── helpers ──────────────────────────────────────────────────────────────────

function parsePayload(raw) {
  try {
    const data = JSON.parse(raw);
    if (!data.name || !data.roll) throw new Error("bad payload");
    return { ok: true, data };
  } catch {
    return { ok: false, data: null };
  }
}

// ─── component ────────────────────────────────────────────────────────────────

export default function QRScannerModal({ onClose }) {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);   // MediaStream — to stop tracks on unmount
  const rafRef     = useRef(null);   // requestAnimationFrame id

  const [phase, setPhase]       = useState("scanning"); // "scanning" | "result" | "error"
  const [result, setResult]     = useState(null);
  const [camError, setCamError] = useState(null);
  const [scanLine, setScanLine] = useState(0);

  // ── laser animation ──────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "scanning") return;
    let pos = 0, dir = 1;
    const id = setInterval(() => {
      pos += dir * 1.5;
      if (pos >= 100) { pos = 100; dir = -1; }
      if (pos <= 0)   { pos = 0;   dir =  1; }
      setScanLine(pos);
    }, 16);
    return () => clearInterval(id);
  }, [phase]);

  // ── stop camera helper ───────────────────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (rafRef.current)  cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  // ── scan loop ────────────────────────────────────────────────────────────
  const startScanLoop = useCallback((stream) => {
    streamRef.current = stream;
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    video.srcObject = stream;
    video.play();

    const tick = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        if (code) {
          stopCamera();
          const { ok, data } = parsePayload(code.data);
          if (ok) { setResult(data); setPhase("result"); }
          else    { setPhase("error"); }
          return; // stop the loop
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [stopCamera]);

  // ── start camera ─────────────────────────────────────────────────────────
  const startCamera = useCallback(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then(startScanLoop)
      .catch((err) => {
        console.error("Camera error:", err);
        setCamError("Camera permission denied. Please allow access and try again.");
        setPhase("error");
      });
  }, [startScanLoop]);

  // Mount → start; unmount → stop
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // ── rescan ────────────────────────────────────────────────────────────────
  const handleRescan = useCallback(() => {
    setResult(null);
    setCamError(null);
    setPhase("scanning");
    startCamera();
  }, [startCamera]);

  // ── derived ───────────────────────────────────────────────────────────────
  const meal     = result ? MEAL_META[result.currentMeal] : null;
  const allowed  = result?.allowed;
  const noWindow = result?.currentMeal === "none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-black text-slate-800">Mess QR Scanner</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {phase === "scanning" ? "Point camera at student's QR code" : "Scan complete"}
            </p>
          </div>
          <button
            onClick={() => { stopCamera(); onClose(); }}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ── SCANNING ── */}
        {phase === "scanning" && (
          <div className="px-5 pt-4 pb-5">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-square">
              {/* Live video feed */}
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                muted
                playsInline
              />

              {/* Hidden canvas for pixel capture — not shown to user */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Corner brackets */}
              {[
                ["top-3 left-3",    "border-t-2 border-l-2"],
                ["top-3 right-3",   "border-t-2 border-r-2"],
                ["bottom-3 left-3", "border-b-2 border-l-2"],
                ["bottom-3 right-3","border-b-2 border-r-2"],
              ].map(([pos, border], i) => (
                <div key={i} className={`absolute ${pos} w-7 h-7 ${border} border-green-400 rounded-sm z-10`} />
              ))}

              {/* Laser line */}
              <div
                className="absolute left-4 right-4 h-0.5 bg-green-400 z-10 shadow-[0_0_10px_3px_rgba(74,222,128,0.7)]"
                style={{ top: `${scanLine}%`, transition: "none" }}
              />
            </div>
            <p className="text-center text-xs text-slate-400 mt-3">
              Align the QR code within the frame
            </p>
          </div>
        )}

        {/* ── RESULT ── */}
        {phase === "result" && result && (
          <div className="px-5 pt-4 pb-5 space-y-4">

            {/* Banner */}
            {noWindow ? (
              <div className="flex items-center gap-3 rounded-2xl bg-slate-100 border border-slate-200 px-4 py-3.5">
                <span className="text-3xl">🕐</span>
                <div>
                  <p className="font-black text-slate-700 text-base">No Meal Window</p>
                  <p className="text-xs text-slate-500">No meal is currently being served.</p>
                </div>
              </div>
            ) : allowed ? (
              <div className="flex items-center gap-3 rounded-2xl bg-green-50 border-2 border-green-300 px-4 py-3.5">
                <span className="text-3xl">✅</span>
                <div>
                  <p className="font-black text-green-700 text-base">Entry Allowed</p>
                  <p className="text-xs text-green-600">
                    Booked for {meal?.emoji} {meal?.label} · {meal?.time}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl bg-red-50 border-2 border-red-300 px-4 py-3.5">
                <span className="text-3xl">🚫</span>
                <div>
                  <p className="font-black text-red-700 text-base">Entry Denied</p>
                  <p className="text-xs text-red-500">
                    Not booked for {meal?.emoji} {meal?.label} · {meal?.time}
                  </p>
                </div>
              </div>
            )}

            {/* Student info */}
            <div className="rounded-2xl bg-slate-50 border border-slate-100 divide-y divide-slate-100 overflow-hidden">
              {[
                ["Student",  result.name],
                ["Roll No.", result.roll],
                ["Dept",     result.dept],
                ["Scanned",  new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center px-4 py-2.5">
                  <span className="text-xs text-slate-400 font-medium">{label}</span>
                  <span className="text-sm font-bold text-slate-700">{value}</span>
                </div>
              ))}
            </div>

            {/* Meal slots */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 px-1">
                Today's Bookings
              </p>
              <div className="flex gap-2">
                {result.bookings?.map(({ meal: m, booked }) => (
                  <div
                    key={m}
                    className={`flex-1 flex flex-col items-center py-2 rounded-xl border text-xs font-semibold gap-1 ${
                      booked
                        ? "bg-blue-50 border-blue-200 text-blue-700"
                        : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                  >
                    <span className="text-base">{MEAL_META[m]?.emoji}</span>
                    <span>{MEAL_META[m]?.label}</span>
                    <span className={`text-[10px] font-bold ${booked ? "text-blue-500" : "text-slate-300"}`}>
                      {booked ? "Booked" : "—"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleRescan}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold transition-all active:scale-95"
              >
                Scan Next
              </button>
              <button
                onClick={() => { stopCamera(); onClose(); }}
                className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all active:scale-95"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* ── ERROR ── */}
        {phase === "error" && (
          <div className="px-5 pt-6 pb-6 flex flex-col items-center gap-4 text-center">
            <span className="text-5xl">⚠️</span>
            <div>
              <p className="font-black text-slate-800 text-base">
                {camError ? "Camera Error" : "Invalid QR Code"}
              </p>
              <p className="text-sm text-slate-500 mt-1 max-w-xs">
                {camError ?? "This QR code doesn't contain valid mess booking data."}
              </p>
            </div>
            <div className="flex gap-3 w-full">
              <button
                onClick={handleRescan}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold transition-all active:scale-95"
              >
                Try Again
              </button>
              <button
                onClick={() => { stopCamera(); onClose(); }}
                className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}