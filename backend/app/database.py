"""
Database connection and initialization
"""

from google.cloud import firestore
from app.config import settings

# Initialize Firestore client
db = firestore.Client(
    project=settings.GCP_PROJECT_ID,
    database=settings.FIRESTORE_DATABASE_ID
)

# Collection names
USERS_COLLECTION = "users"
JOBS_COLLECTION = "jobs"
PROPOSALS_COLLECTION = "proposals"
DISPUTES_COLLECTION = "disputes"
NOTIFICATIONS_COLLECTION = "notifications"

def get_db():
    """Get database instance"""
    return db
