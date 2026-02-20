from sqlalchemy import Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
import enum

from app.db.database import Base


class Category(str, enum.Enum):
    EMPLOYEE_EXPERIENCE = "Employee Experience"
    FACILITIES = "Facilities"
    FINANCE = "Finance"
    HR_PAYROLL = "HR / Payroll"
    HR_WORKPLACE_CULTURE = "HR / Workplace Culture"
    HEALTH_SAFETY = "Health & Safety"
    IT_SUPPORT = "IT Support"
    MANAGEMENT = "Management"
    OFFICE_SUPPLIES = "Office Supplies"
    SECURITY = "Security"
    WORKPLACE_CULTURE = "Workplace Culture"
    OTHER = "Other" 


class Urgency(str, enum.Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_text = Column(Text, nullable=False)
    created_by = Column(String(255), nullable=True)  # Email of the user who created the complaint

    category = Column(Enum(Category), nullable=True)
    urgency = Column(Enum(Urgency), nullable=True)

    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

    status = Column(String(50), default="Pending")        
    assigned_to = Column(String(100), nullable=True)     
    response = Column(Text, nullable=True)
