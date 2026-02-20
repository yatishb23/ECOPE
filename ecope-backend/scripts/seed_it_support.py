import os
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal
from app.models.domain.user import User, UserRole


def seed_it_support_users():
    db = SessionLocal()
    try:
        # Check if they already exist
        existing_emails = [u.email for u in db.query(User).filter(User.role == UserRole.SUPPORT).all()]
        
        for i in range(1, 11):
            email = f"it-support-{i}@university.edu"
            if email not in existing_emails:
                user = User(
                    email=email,
                    hashed_password="password123", # Default password
                    full_name=f"IT Support Personnel {i}",
                    role=UserRole.SUPPORT,
                    is_active=True
                )
                db.add(user)
                print(f"Added IT support user: {email}")
        
        db.commit()
        print("Successfully seeded IT support users")
    except Exception as e:
        print(f"Error seeding IT support users: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_it_support_users()
