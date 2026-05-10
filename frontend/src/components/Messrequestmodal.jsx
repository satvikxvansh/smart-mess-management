import { useState } from "react";

const MEALS = [
  { id: "breakfast", label: "Breakfast", time: "7:30 AM – 9:00 AM", emoji: "🍳" },
  { id: "lunch",     label: "Lunch",     time: "12:30 PM – 2:30 PM", emoji: "☀️" },
  { id: "dinner",    label: "Dinner",    time: "7:30 PM – 9:30 PM",  emoji: "🌙" },
];

/** Returns the Date for day-offset from today (0 = today, 1 = tomorrow, …) */
function getDate(offset) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

/** Formats Date → "Mon, 12 May" */
function fmt(date) {
  return date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

/** Formats Date → "Mon" short */
function fmtDay(date) {
  return date.toLocaleDateString("en-IN", { weekday: "short" });
}

/** Formats Date → "12" */
function fmtNum(date) {
  return date.getDate();
}

/**
 * Slot status:
 *  "past"      – day/meal slot already gone (grey, locked)
 *  "booked"    – user has booked (blue, can un-book if deadline not passed)
 *  "available" – open for booking (green)
 */
function getSlotStatus(date, mealId, bookedSet) {
  const now = new Date();
  // Deadline: bookings must be made before 10 PM the *previous* night for that day
  // i.e. we lock a day's slots once now >= that day's 00:00 (past day) OR
  // for today: all slots are past since meal times are in the past.
  const slotTimes = {
    breakfast: 9,    // ends 9 AM
    lunch:     14.5, // ends 2:30 PM
    dinner:    21.5, // ends 9:30 PM
  };
  // If the date is before today → past
  const today = getDate(0);
  if (date < today) return "past";

  // If date is today, check if meal end time has passed
  if (date.toDateString() === today.toDateString()) {
    const endHour = slotTimes[mealId];
    const nowHours = now.getHours() + now.getMinutes() / 60;
    if (nowHours >= endHour) return "past";
  }

  const key = `${date.toDateString()}_${mealId}`;
  return bookedSet.has(key) ? "booked" : "available";
}

// Pre-populate some booked slots for demo (today + tomorrow breakfast/lunch)
function defaultBooked() {
  const s = new Set();
  const today = getDate(0);
  const tomorrow = getDate(1);
  s.add(`${today.toDateString()}_breakfast`);
  s.add(`${today.toDateString()}_lunch`);
  s.add(`${tomorrow.toDateString()}_breakfast`);
  s.add(`${tomorrow.toDateString()}_lunch`);
  return s;
}

const DEADLINE_HOUR = 22; // 10 PM

function canToggle(date, mealId) {
  // Booking/un-booking allowed only before 10 PM the previous night
  // Simplified: allowed if date is tomorrow or later AND now < 10 PM today
  const now = new Date();
  const today = getDate(0);
  if (date <= today) return false; // past or today → locked
  // Must submit before 10 PM tonight
  return now.getHours() < DEADLINE_HOUR;
}

export default function MessRequestModal({ onClose }) {
  const [booked, setBooked] = useState(defaultBooked);
  const [saved, setSaved] = useState(false);

  // Build 7-day window starting today
  const days = Array.from({ length: 7 }, (_, i) => getDate(i));

  const toggle = (date, mealId) => {
    if (!canToggle(date, mealId)) return;
    const key = `${date.toDateString()}_${mealId}`;
    setBooked(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
    setSaved(false);
  };

  const handleConfirm = () => {
    setSaved(true);
    setTimeout(() => {
      onClose?.();
    }, 1200);
  };

  const totalBooked = [...booked].filter(k => {
    const [dateStr] = k.split("_");
    const d = new Date(dateStr);
    return d >= getDate(1); // only count future bookings
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Request Mess Access</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Book meals for the next 7 days
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none mt-0.5 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Legend */}
        <div className="flex gap-4 px-6 py-2.5 bg-gray-50 border-b border-gray-100 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
            <span className="text-gray-600">Booked</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block" />
            <span className="text-gray-600">Available</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-300 inline-block" />
            <span className="text-gray-600">Past / Locked</span>
          </span>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-3">
          {days.map((date, dayIdx) => {
            const isToday = dayIdx === 0;
            const isTomorrow = dayIdx === 1;
            return (
              <div key={date.toDateString()} className="rounded-xl border border-gray-200 overflow-hidden">
                {/* Day header */}
                <div className={`flex items-center gap-2 px-4 py-2 ${isToday ? "bg-blue-50" : "bg-gray-50"}`}>
                  <span className={`text-sm font-semibold ${isToday ? "text-blue-700" : "text-gray-700"}`}>
                    {fmt(date)}
                  </span>
                  {isToday && (
                    <span className="text-xs bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                  {isTomorrow && (
                    <span className="text-xs bg-green-100 text-green-600 font-semibold px-2 py-0.5 rounded-full">
                      Tomorrow
                    </span>
                  )}
                </div>

                {/* Meal rows */}
                <div className="divide-y divide-gray-100">
                  {MEALS.map(meal => {
                    const status = getSlotStatus(date, meal.id, booked);
                    const clickable = canToggle(date, meal.id);

                    // Style map
                    const styles = {
                      past: {
                        row: "bg-white opacity-50 cursor-not-allowed",
                        radio: "border-gray-300 bg-gray-100",
                        dot: null,
                        label: "text-gray-400",
                      },
                      booked: {
                        row: "bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors",
                        radio: "border-blue-500 bg-blue-500",
                        dot: "bg-white",
                        label: "text-gray-800",
                      },
                      available: {
                        row: "bg-white cursor-pointer hover:bg-green-50 transition-colors",
                        radio: "border-gray-300",
                        dot: null,
                        label: "text-gray-800",
                      },
                    }[status];

                    return (
                      <div
                        key={meal.id}
                        onClick={() => toggle(date, meal.id)}
                        className={`flex items-center gap-3 px-4 py-2.5 ${styles.row}`}
                        role={clickable ? "checkbox" : undefined}
                        aria-checked={status === "booked"}
                        tabIndex={clickable ? 0 : -1}
                        onKeyDown={e => e.key === " " && toggle(date, meal.id)}
                      >
                        <span className="text-lg w-7 text-center select-none">{meal.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold leading-tight ${styles.label}`}>{meal.label}</p>
                          <p className="text-xs text-gray-400 leading-tight">{meal.time}</p>
                        </div>
                        {/* Status indicator */}
                        {status === "booked" ? (
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        ) : status === "available" ? (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v.01M12 9v4" />
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Warning */}
        <div className="px-4 pt-2">
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800">
            <span className="mt-0.5">⚠️</span>
            <p>
              Requests must be submitted before <strong>10:00 PM</strong> tonight.
              Changes not allowed after submission.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-4 py-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saved}
            className={`flex-1 py-3 rounded-xl text-sm font-bold text-white transition-all ${
              saved
                ? "bg-green-400 scale-95"
                : "bg-green-500 hover:bg-green-600 active:scale-95"
            }`}
          >
            {saved ? "✓ Confirmed!" : `Confirm Request${totalBooked > 0 ? ` (${totalBooked})` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}