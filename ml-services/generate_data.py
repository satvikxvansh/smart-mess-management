import pandas as pd
import numpy as np
import random

np.random.seed(42)
days = 730

data = []
for i in range(days):
    day_of_week = i % 7          # 0=Mon … 6=Sun
    week = i // 7
    month = (i // 30) % 12

    # More bookings on weekdays, fewer on weekends
    base_booked = 280 if day_of_week < 5 else 190

    breakfast_booked = int(base_booked * 0.6 + np.random.normal(0, 15))
    lunch_booked     = int(base_booked * 1.1 + np.random.normal(0, 20))
    dinner_booked    = int(base_booked * 1.0 + np.random.normal(0, 18))
    actual_attendance = int(
      (breakfast_booked + lunch_booked + dinner_booked)*random.uniform(0.88, 0.98)  # 88–98% of booked actually show up
    )

    # Waste is higher on weekends, when menu is repetitive (mid-week), and when attendance is low
    menu_type = random.choice([0, 1])  # 0=regular, 1=special
    waste_pct = (
        12
        + (4 if day_of_week >= 5 else 0)           # weekend spike
        + (3 if day_of_week == 6 else 0)           # Sunday even worse
        + (3 if menu_type == 0 else -5)            # special menu has stronger effect
        - 0.015 * (breakfast_booked + lunch_booked + dinner_booked)
        + (2 if month in [11, 0, 1] else 0)        # winter months more waste
        + np.random.normal(0, 0.8)                 # ← reduced noise from 2 to 0.8
    )
    waste_pct = max(3, min(35, waste_pct))  # clamp between 3–35%

    total_food_kg = (breakfast_booked * 0.4 + lunch_booked * 0.6 + dinner_booked * 0.55)
    waste_kg      = total_food_kg * (waste_pct / 100)
    cost_per_kg   = 80  # INR
    money_wasted  = round(waste_kg * cost_per_kg, 2)

    data.append({
        "day_of_week":       day_of_week,
        "month":             month,
        "breakfast_booked":  breakfast_booked,
        "lunch_booked":      lunch_booked,
        "dinner_booked":     dinner_booked,
        "menu_type":         menu_type,       # 0=regular, 1=special
        "total_booked":      breakfast_booked + lunch_booked + dinner_booked,
        "waste_pct":         round(waste_pct, 2),
        "waste_kg":          round(waste_kg, 2),
        "money_wasted_inr":  money_wasted,
        "actual_attendance": actual_attendance,
    })

df = pd.DataFrame(data)
df.to_csv("mess_data.csv", index=False)
print(df.head())
print(f"\nAvg waste: {df['waste_pct'].mean():.2f}%")
print(f"Avg money wasted/day: ₹{df['money_wasted_inr'].mean():.2f}")