import { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function AdminScanPage() {
  const [meal, setMeal]       = useState("lunch");
  const [result, setResult]   = useState(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError]     = useState("");
  const scannerRef            = useRef(null);

  // ── Start camera scanner ───────────────────────────────────────────────────
  const startScanner = async () => {
    setError("");
    setResult(null);

    const scanner = new Html5Qrcode("qr-reader-container");
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },          // rear camera
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          // Called once on successful scan
          await scanner.stop();
          setScanning(false);
          handleScan(decodedText);
        },
        () => {} 
      );
      setScanning(true);
    } catch (err) {
      setError("Camera access denied. Please allow camera permission and try again.");
      setScanning(false);
    }
  };

  // ── Stop scanner on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  // ── Send token to backend ──────────────────────────────────────────────────
  const handleScan = async (token) => {
    try {
      const res = await fetch("http://localhost:5000/api/attendance/scan", {
        method : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization : `Bearer ${localStorage.getItem("mess_token")}`,
        },
        body: JSON.stringify({ qrToken: token, meal }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ success: false, message: "Network error. Please try again." });
    }
  };

  // ── Scan next student ──────────────────────────────────────────────────────
  const handleScanNext = () => {
    setResult(null);
    startScanner();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-6">
      <h2 className="text-white font-bold text-xl mb-1">Scan Meal QR</h2>
      <p className="text-gray-400 text-xs mb-5">
        {new Date().toLocaleDateString("en-IN", { weekday:"long", day:"numeric", month:"long" })}
      </p>

      {/* Meal selector */}
      <div className="flex gap-2 mb-6">
        {["breakfast", "lunch", "dinner"].map(m => (
          <button key={m} onClick={() => setMeal(m)}
            className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all
              ${meal === m ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}>
            {m}
          </button>
        ))}
      </div>

      {/* Scanner container — html5-qrcode mounts into this div */}
      {!result && (
        <div className="w-full max-w-xs">
          <div
            id="qr-reader-container"
            className="rounded-2xl overflow-hidden border-4 border-blue-500 bg-black w-full"
            style={{ minHeight: scanning ? "300px" : "0px" }}
          />

          {!scanning && (
            <button onClick={startScanner}
              className="mt-4 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all">
              📷 Start Scanner
            </button>
          )}

          {scanning && (
            <p className="text-center text-blue-400 text-xs mt-3 animate-pulse">
              Point camera at student's QR code…
            </p>
          )}

          {error && (
            <div className="mt-3 bg-red-900/50 border border-red-500 rounded-xl px-4 py-3 text-red-300 text-xs text-center">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Result card — same as before */}
      {result && (
        <div className={`mt-4 w-full max-w-xs rounded-2xl p-5 text-center border
          ${result.success
            ? "bg-green-900/60 border-green-500"
            : "bg-red-900/60 border-red-500"}`}>
          <p className="text-4xl mb-2">{result.success ? "✅" : "❌"}</p>
          <p className={`font-bold text-base ${result.success ? "text-green-300" : "text-red-300"}`}>
            {result.message}
          </p>
          {result.success && result.data && (
            <div className="mt-4 text-left bg-black/30 rounded-xl p-3 space-y-1.5">
              {[
                ["Name",  result.data.name],
                ["Roll",  result.data.rollNo],
                ["Dept",  result.data.department],
                ["Meal",  result.data.meal],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-white/40">{label}</span>
                  <span className="text-white font-semibold capitalize">{value}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={handleScanNext}
            className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all">
            Scan Next Student →
          </button>
        </div>
      )}
    </div>
  );
}