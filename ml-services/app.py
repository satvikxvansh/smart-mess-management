from flask import Flask, jsonify
from flask_cors import CORS
import json, pickle
import pandas as pd

app = Flask(__name__)
CORS(app)

with open("predictions.json") as f:
    PREDICTIONS = json.load(f)
with open("waste_model.pkl",  "rb") as f:
    waste_model = pickle.load(f)
with open("money_model.pkl",  "rb") as f:
    money_model = pickle.load(f)
with open("attendance_model.pkl", "rb") as f:
    attendance_model = pickle.load(f)

@app.route("/api/predictions")
def get_predictions():
    return jsonify(PREDICTIONS)

@app.route("/api/predict", methods=["POST"])
def predict():
    from flask import request
    data = request.json
    df   = pd.DataFrame([data])
    waste = waste_model.predict(df)[0]
    money = money_model.predict(df)[0]
    return jsonify({
        "predicted_waste_pct":    round(waste, 2),
        "predicted_money_wasted": round(money, 2),
        "estimated_savings":      round(max(0, 1200 - money), 2)
    })

if __name__ == "__main__":
    app.run(debug=True, port=8000)