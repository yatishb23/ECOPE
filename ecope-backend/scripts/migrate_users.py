import os
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db.database import SessionLocal
from app.models.domain.user import User, UserRole

def migrate_existing_users():
    db = SessionLocal()
    try:
        # Update admin role string if needed (it remains ADMIN, but let's check)
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        if admin:
            admin.role = UserRole.ADMIN
            print("Updated admin@example.com to ADMIN role")

        # Migrate staff to employee
        staff = db.query(User).filter(User.email == "staff@example.com").first()
        if staff:
            staff.email = "employee@example.com"
            staff.full_name = "Employee User"
            staff.hashed_password = "employeepassword" # Matching the update in main.py
            staff.role = UserRole.EMPLOYEE
            print("Migrated staff@example.com to employee@example.com with EMPLOYEE role")

        db.commit()
        print("Successfully migrated existing users to new roles and emails.")
    except Exception as e:
        print(f"Error during migration: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_existing_users()
