from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

# Connect to MongoDB using the URI from the environment variable
# Use MONGODB_URI (not MONGO_URI) to match what you set in Render
MONGO_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URI)

# Access the database (it will be created automatically if it doesn't exist)
db = client["reminder_db"]

# Access the collection (like a table in SQL)
reminders = db["reminders"]
