from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.domain.complaint import Complaint
from app.models.domain.user import User, UserRole
from app.models.schemas.complaint import ComplaintCreate, ComplaintUpdate
from app.ml.model import get_model_predictor


class ComplaintService:
    @staticmethod
    async def create_complaint(db: Session, complaint: ComplaintCreate, current_user: User) -> Complaint:
        try:
            # Get predictions from ML model
            model_predictor = get_model_predictor()
            prediction = model_predictor.predict(complaint.complaint_text)
            
            # Decide on category and urgency
            category = prediction["category"]
            urgency = prediction["urgency"]
            
            # Implement Round Robin across all categories
            # Fetch all active support users
            support_users = db.query(User).filter(User.role == UserRole.SUPPORT, User.is_active == True).order_by(User.id).all()
            
            assigned_to = None
            if support_users:
                 # Find the next support guy in round robin based on total complaints
                total_complaints_count = db.query(Complaint).count()
                next_guy_index = total_complaints_count % len(support_users)
                assigned_to = support_users[next_guy_index].email
            else:
                 # Fallback if no support users found in DB (should be rare if seeded)
                 # Keep legacy logic or assign to admin/unassigned
                 assigned_to = "unassigned@university.edu"

            
            # Create new complaint with predicted categories
            db_complaint = Complaint(
                complaint_text=complaint.complaint_text,
                created_by=current_user.email,
                category=category,
                urgency=urgency,
                status="Pending",
                assigned_to=assigned_to
            )
        except Exception as e:
            print(f"Warning: Failed to use ML model for prediction: {e}")
            
            # Use Round Robin even in fallback
            support_users = db.query(User).filter(User.role == UserRole.SUPPORT, User.is_active == True).order_by(User.id).all()
            
            assigned_to = None
            if support_users:
                total_complaints_count = db.query(Complaint).count()
                next_guy_index = total_complaints_count % len(support_users)
                assigned_to = support_users[next_guy_index].email
            else:
                 assigned_to = "unassigned@university.edu"

            # Default to medium priority and "Other" category if model fails
            db_complaint = Complaint(
                complaint_text=complaint.complaint_text,
                created_by=current_user.email,
                category="Other",
                urgency="Medium",
                status="Pending",
                assigned_to=assigned_to
            )
        db.add(db_complaint)
        db.commit()
        db.refresh(db_complaint)
        return db_complaint
    
    @staticmethod
    async def get_complaint(db: Session, complaint_id: int) -> Optional[Complaint]:
        return db.query(Complaint).filter(Complaint.id == complaint_id).first()
    
    @staticmethod
    async def get_complaints(
        db: Session,
        current_user: User,
        skip: int = 0, 
        limit: int = 100,
        category: Optional[str] = None,
        urgency: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        assigned_to: Optional[str] = None
    ) -> List[Complaint]:
        query = db.query(Complaint)
        
        # Apply role-based filtering
        if current_user.role == UserRole.EMPLOYEE:
            # Employees can only see their own complaints
            query = query.filter(Complaint.created_by == current_user.email)
        elif current_user.role == UserRole.SUPPORT:
            # Support users can see complaints assigned to them OR created by them
            query = query.filter(
                (Complaint.assigned_to == current_user.email) | 
                (Complaint.created_by == current_user.email)
            )
        # Admin users can see all complaints (no additional filtering)
        
        # Apply other filters if provided
        if category:
            query = query.filter(Complaint.category == category)
        if urgency:
            query = query.filter(Complaint.urgency == urgency)
        if status:
            query = query.filter(Complaint.status == status)
        if assigned_to:
            query = query.filter(Complaint.assigned_to == assigned_to)
        if search:
            query = query.filter(Complaint.complaint_text.ilike(f"%{search}%"))
        
        # Sort by created_at in descending order (newest first)
        query = query.order_by(Complaint.created_at.desc())
            
        # Apply pagination
        return query.offset(skip).limit(limit).all()
        
    @staticmethod
    async def get_complaints_count(
        db: Session,
        current_user: User,
        category: Optional[str] = None,
        urgency: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        assigned_to: Optional[str] = None
    ) -> int:
        """Get the total count of complaints with the applied filters and role-based access."""
        query = db.query(Complaint)
        
        # Apply role-based filtering
        if current_user.role == UserRole.EMPLOYEE:
            # Employees can only see their own complaints
            query = query.filter(Complaint.created_by == current_user.email)
        elif current_user.role == UserRole.SUPPORT:
            # Support users can see complaints assigned to them OR created by them
            query = query.filter(
                (Complaint.assigned_to == current_user.email) | 
                (Complaint.created_by == current_user.email)
            )
        # Admin users can see all complaints (no additional filtering)
        
        # Apply other filters if provided
        if category:
            query = query.filter(Complaint.category == category)
        if urgency:
            query = query.filter(Complaint.urgency == urgency)
        if status:
            query = query.filter(Complaint.status == status)
        if assigned_to:
            query = query.filter(Complaint.assigned_to == assigned_to)
        if search:
            query = query.filter(Complaint.complaint_text.ilike(f"%{search}%"))
            
        return query.count()
    
    @staticmethod
    async def update_complaint(db: Session, complaint_id: int, complaint_update: ComplaintUpdate) -> Optional[Complaint]:
        db_complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if db_complaint:
            update_data = complaint_update.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_complaint, key, value)
            db.commit()
            db.refresh(db_complaint)
        return db_complaint
    
    @staticmethod
    async def delete_complaint(db: Session, complaint_id: int) -> bool:
        db_complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
        if db_complaint:
            db.delete(db_complaint)
            db.commit()
            return True
        return False
