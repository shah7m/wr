from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
from pytz import utc
from models import reminders
from twilio.rest import Client
import os
from dotenv import load_dotenv

load_dotenv()

# Twilio credentials from .env
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
# Fix: Read the WhatsApp number from environment variable
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")  # Fallback to sandbox number

client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

scheduler = BackgroundScheduler(timezone=utc)  # explicitly set UTC timezone for scheduler

def send_due_reminders():
    # Make sure we have a timezone-aware UTC datetime for comparison
    now = datetime.utcnow().replace(tzinfo=utc)
    print(f"Checking for due reminders at {now.isoformat()}")

    # Debug: Print all upcoming reminders
    upcoming = list(reminders.find({"sent": False}).sort("time", 1))
    print(f"Found {len(upcoming)} upcoming reminders")
    
    for reminder in upcoming:
        reminder_time = reminder["time"]
        print(f"Reminder scheduled for: {reminder_time.isoformat()} (Current UTC: {now.isoformat()})")
    
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
        
        print(f"Processing due reminder for {phone} scheduled at {reminder_time.isoformat()}")

        try:
            # Fix: Ensure phone number is properly formatted
            # Remove any '+' if it's already in the phone number
            phone = phone.lstrip('+') if isinstance(phone, str) else phone
            
            # Debug: Print the full message details
            print(f"Attempting to send message to whatsapp:+{phone}")
            print(f"From: {TWILIO_WHATSAPP_FROM}")
            print(f"Message: {message}")
            
            message_response = client.messages.create(
                from_=TWILIO_WHATSAPP_FROM,
                to=f"whatsapp:+{phone}",
                body=message
            )
            
            # Debug: Print the message SID to confirm it was sent
            print(f"Message sent with SID: {message_response.sid}")
            
            reminders.update_one({"_id": reminder["_id"]}, {"$set": {"sent": True}})
            count += 1
            print(f"Sent reminder to {phone} at {datetime.utcnow().replace(tzinfo=utc).isoformat()}")
        except Exception as e:
            print(f"Failed to send reminder to {phone}: {str(e)}")
            # Print more detailed error information
            import traceback
            traceback.print_exc()
    
    if count == 0:
        print("No due reminders found.")

def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(send_due_reminders, 'interval', minutes=1)
        scheduler.start()
        print("Scheduler started")
        
        # Run once immediately to check for any pending reminders
        send_due_reminders()