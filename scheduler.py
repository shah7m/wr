from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
from pytz import utc
from pymongo import MongoClient
from twilio.rest import Client
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
mongo_client = MongoClient(MONGO_URI)
db = mongo_client["reminder_db"]
reminders = db["reminders"]

# Twilio credentials
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
scheduler = BackgroundScheduler(timezone=utc)

def calculate_next_occurrence(original_time, recurring_type):
    """Calculate the next occurrence for recurring reminders"""
    if recurring_type == "daily":
        return original_time + timedelta(days=1)
    elif recurring_type == "weekly":
        return original_time + timedelta(weeks=1)
    elif recurring_type == "monthly":
        # Add approximately 30 days for monthly
        return original_time + timedelta(days=30)
    return None

def send_due_reminders():
    now = datetime.utcnow().replace(tzinfo=utc)
    print(f"Checking for due reminders at {now.isoformat()}")

    # Find reminders that are due
    due_reminders = reminders.find({
        "sent": False,
        "time": {"$lte": now}
    })

    count = 0
    for reminder in due_reminders:
        phone = reminder["phone"]
        message = reminder["message"]
        reminder_time = reminder["time"]
        recurring = reminder.get("recurring", "none")
        
        print(f"Processing due reminder for {phone} scheduled at {reminder_time.isoformat()}")

        try:
            # Send WhatsApp message
            phone = phone.lstrip('+') if isinstance(phone, str) else phone
            
            message_response = client.messages.create(
                from_=TWILIO_WHATSAPP_FROM,
                to=f"whatsapp:+{phone}",
                body=message
            )
            
            print(f"Message sent with SID: {message_response.sid}")
            
            # Mark as sent
            reminders.update_one({"_id": reminder["_id"]}, {"$set": {"sent": True}})
            
            # Handle recurring reminders
            if recurring != "none":
                original_time = reminder.get("original_time", reminder_time)
                next_time = calculate_next_occurrence(original_time, recurring)
                
                if next_time:
                    # Create new reminder for next occurrence
                    new_reminder = {
                        "phone": phone,
                        "message": message,
                        "time": next_time,
                        "sent": False,
                        "recurring": recurring,
                        "original_time": original_time
                    }
                    
                    new_id = reminders.insert_one(new_reminder).inserted_id
                    print(f"Created next {recurring} reminder with ID: {new_id} for {next_time.isoformat()}")
            
            count += 1
            print(f"Sent reminder to {phone}")
            
        except Exception as e:
            print(f"Failed to send reminder to {phone}: {str(e)}")
            import traceback
            traceback.print_exc()
    
    if count == 0:
        print("No due reminders found.")

def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(send_due_reminders, 'interval', minutes=1)
        scheduler.start()
        print("Scheduler started")
        send_due_reminders()
