from flask import Flask, request, jsonify, render_template
from pymongo import MongoClient
from pytz import utc
from scheduler import scheduler, start_scheduler
from datetime import datetime
import pytz
from dotenv import load_dotenv
import os
import atexit

load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URI)
db = client.reminder_db
reminders = db.reminders

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/reminder", methods=["POST"])
def create_reminder():
    if request.is_json:
        data = request.get_json()
    else:
        data = request.form

    phone = data.get("phone")
    message = data.get("message")
    time_str = data.get("time")

    if not phone or not message or not time_str:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        # Parse naive datetime from input (e.g. 'YYYY-MM-DDTHH:MM')
        reminder_time_naive = datetime.fromisoformat(time_str)
        
        # IMPORTANT: Qatar is UTC+3, so we need to convert properly
        qatar_tz = pytz.timezone('Asia/Qatar')  # Qatar timezone (UTC+3)
        
        # First, make it timezone-aware in Qatar timezone
        reminder_time_qatar = qatar_tz.localize(reminder_time_naive)
        
        # Then convert to UTC for storage
        reminder_time_utc = reminder_time_qatar.astimezone(utc)
        
        # Debug: Print all times to see the conversion
        print(f"Original time input: {time_str} (Qatar local time)")
        print(f"Qatar time parsed: {reminder_time_qatar.isoformat()}")
        print(f"UTC time stored: {reminder_time_utc.isoformat()}")
        print(f"Current Qatar time: {datetime.now(qatar_tz).isoformat()}")
        print(f"Current UTC time: {datetime.utcnow().replace(tzinfo=utc).isoformat()}")
        
    except Exception as e:
        print(f"Error parsing date: {str(e)}")
        return jsonify({"error": "Invalid datetime format. Use YYYY-MM-DDTHH:MM"}), 400

    # Debug: Print the phone number format
    print(f"Phone number being saved: {phone}")
    
    reminder_id = reminders.insert_one({
        "phone": phone,
        "message": message,
        "time": reminder_time_utc,
        "sent": False
    }).inserted_id
    
    print(f"Reminder created with ID: {reminder_id}")

    return jsonify({"success": True, "message": "Reminder set!"}), 201

# Add a debug route to check current time in both timezones
@app.route("/debug/time")
def debug_time():
    now_utc = datetime.utcnow().replace(tzinfo=utc)
    qatar_tz = pytz.timezone('Asia/Qatar')
    now_qatar = datetime.now(qatar_tz)
    
    # Get upcoming reminders
    upcoming_reminders = list(reminders.find({"sent": False}).sort("time", 1).limit(5))
    
    reminder_info = []
    for reminder in upcoming_reminders:
        utc_time = reminder["time"]
        qatar_time = utc_time.astimezone(qatar_tz)
        reminder_info.append({
            "phone": reminder["phone"],
            "message": reminder["message"][:50] + "..." if len(reminder["message"]) > 50 else reminder["message"],
            "utc_time": utc_time.isoformat(),
            "qatar_time": qatar_time.isoformat(),
            "minutes_until": int((utc_time - now_utc).total_seconds() / 60)
        })
    
    return jsonify({
        "current_utc_time": now_utc.isoformat(),
        "current_qatar_time": now_qatar.isoformat(),
        "timezone_offset": "+03:00",
        "pending_reminders_count": reminders.count_documents({"sent": False}),
        "upcoming_reminders": reminder_info
    })

# Start the scheduler when the app starts
start_scheduler()

# Shut down the scheduler when exiting the app
atexit.register(lambda: scheduler.shutdown() if scheduler.running else None)

if __name__ == "__main__":
    print("WhatsApp Reminder Service is Running!")
    print(f"Server timezone: Qatar (UTC+3)")
    port = int(os.environ.get('PORT', 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
