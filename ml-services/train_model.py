import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import StandardScaler
import pickle, json

df = pd.read_csv("mess_data.csv")

FEATURES = [
    "day_of_week", "month", "breakfast_booked",
    "lunch_booked", "dinner_booked", "menu_type", "total_booked"
]

# ── train waste % predictor ──────────────────────────────────────────────────
X = df[FEATURES]
y_waste = df["waste_pct"]
y_money = df["money_wasted_inr"]

X_train, X_test, yw_train, yw_test, ym_train, ym_test = train_test_split(
    X, y_waste, y_money, test_size=0.2, random_state=42
)

# Waste % model
waste_model = RandomForestRegressor(n_estimators=200, max_depth=8, random_state=42)
waste_model.fit(X_train, yw_train)
yw_pred  = waste_model.predict(X_test)
waste_mae = mean_absolute_error(yw_test, yw_pred)
waste_r2  = r2_score(yw_test, yw_pred)
waste_acc = round(waste_r2 * 100, 2)

# Money saved model (predicts money wasted; savings = baseline - prediction)
money_model = GradientBoostingRegressor(n_estimators=200, learning_rate=0.05, random_state=42)
money_model.fit(X_train, ym_train)
ym_pred   = money_model.predict(X_test)
money_mae = mean_absolute_error(ym_test, ym_pred)
money_r2  = r2_score(ym_test, ym_pred)
money_acc = round(money_r2 * 100, 2)


y_attendance = df["actual_attendance"]

X_train, X_test, ya_train, ya_test = train_test_split(
    X, y_attendance, test_size=0.2, random_state=42
)[:4]  # reuse same split

attendance_model = RandomForestRegressor(n_estimators=200, max_depth=8, random_state=42)
attendance_model.fit(X_train, ya_train)
ya_pred        = attendance_model.predict(X_test)
attendance_mae = mean_absolute_error(ya_test, ya_pred)
attendance_r2  = r2_score(ya_test, ya_pred)
attendance_acc = round(attendance_r2 * 100, 2)

# ── feature importance ───────────────────────────────────────────────────────
importances = dict(zip(FEATURES, waste_model.feature_importances_.round(3)))

# ── sample predictions for next 7 days ──────────────────────────────────────
today_dow = 0  # assume Monday
sample_inputs = []
for i in range(7):
    dow = (today_dow + i) % 7
    is_weekend = dow >= 5
    base = 190 if is_weekend else 270
    sample_inputs.append({
        "day_of_week":      dow,
        "month":            4,
        "breakfast_booked": base - 60,
        "lunch_booked":     base + 30,
        "dinner_booked":    base,
        "menu_type":        1 if i % 3 == 0 else 0,
        "total_booked":     (base - 60) + (base + 30) + base,
    })

sample_df    = pd.DataFrame(sample_inputs)
pred_waste   = waste_model.predict(sample_df).tolist()
pred_money   = money_model.predict(sample_df).tolist()

# Baseline = avg historical waste; savings = baseline - predicted
baseline_money = df["money_wasted_inr"].mean()
days_labels    = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]

forecast = []
pred_attendance = attendance_model.predict(sample_df).tolist()
for i, (w, m, a) in enumerate(zip(pred_waste, pred_money, pred_attendance)):
    dow = (today_dow + i) % 7
    forecast.append({
        "day":                     days_labels[dow],
        "predicted_waste_pct":     round(w, 2),
        "predicted_money_wasted":  round(m, 2),
        "estimated_savings":       round(max(0, baseline_money - m), 2),
        "predicted_attendance":    int(round(a)),           # ← new
        "booked_count":            int(sample_inputs[i]["total_booked"]),  # ← for comparison
    })

# ── save everything ──────────────────────────────────────────────────────────
with open("waste_model.pkl",  "wb") as f: pickle.dump(waste_model, f)
with open("money_model.pkl",  "wb") as f: pickle.dump(money_model, f)

results = {
    "waste_model": {
        "accuracy_r2_pct": waste_acc,
        "mae":             round(waste_mae, 3),
        "description":     "RandomForest — predicts daily food waste %"
    },
    "money_model": {
        "accuracy_r2_pct": money_acc,
        "mae":             round(money_mae, 3),
        "description":     "GradientBoosting — predicts money wasted per day (INR)"
    },
    "feature_importance": importances,
    "forecast_next_7_days": forecast,
    "attendance_model": {
        "accuracy_r2_pct": attendance_acc,
        "mae":             round(attendance_mae, 2),
        "description":     "RandomForest — predicts actual daily attendance from bookings"
    },
    "summary": {
        "avg_daily_waste_pct":    round(df["waste_pct"].mean(), 2),
        "avg_daily_money_wasted": round(df["money_wasted_inr"].mean(), 2),
        "projected_monthly_savings": round(
            sum(f["estimated_savings"] for f in forecast) / 7 * 30, 2
        ),
        "cost_per_kg_inr": 80,
    }
}

with open("attendance_model.pkl", "wb") as f:
    pickle.dump(attendance_model, f)

with open("predictions.json", "w") as f:
    json.dump(results, f, indent=2)

print("\n✅ Models trained and saved.")
print(f"Waste model  → R² accuracy: {waste_acc}%  |  MAE: {waste_mae:.3f}%")
print(f"Money model  → R² accuracy: {money_acc}%  |  MAE: ₹{money_mae:.2f}")
print(f"\n📅 7-day forecast:")
for f in forecast:
    print(f"  {f['day']}: {f['predicted_waste_pct']}% waste | "
          f"₹{f['predicted_money_wasted']} wasted | ₹{f['estimated_savings']} saved")