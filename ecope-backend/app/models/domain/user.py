from sqlalchemy import Column, Integer, String, Boolean, Enum
import enum

from app.db.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    EMPLOYEE = "employee"
    SUPPORT = "support"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String(255), unique=True, index=True, nullable=False)   
    hashed_password = Column(String(255), nullable=False)                  
    full_name = Column(String(150), nullable=False)                        

    role = Column(Enum(UserRole), default=UserRole.EMPLOYEE)
    is_active = Column(Boolean, default=True)
