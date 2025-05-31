from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

# Connect to MongoDB using the URI from the .env file
client = MongoClient(os.getenv("MONGO_URI"))

# Access the database (it will be created automatically if it doesn't exist)
db = client["reminder_db"]

# Access the collection (like a table in SQL)
reminders = db["reminders"]
