from typing import Any, Optional, List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.api.dependencies.auth import get_current_user, get_current_staff_user
from app.services.complaint_service import ComplaintService
from app.services.ocr_service import OCRService
from app.models.domain.user import UserRole
from app.models.domain.complaint import Complaint
from app.models.schemas.complaint import (
    ComplaintCreate,
    ComplaintResponse,
    ComplaintUpdate,
    ComplaintPrediction,
    PaginatedComplaintsResponse
)
from app.ml.model import get_model_predictor

router = APIRouter()


def check_complaint_access(complaint: Complaint, current_user: User, operation: str = "read") -> None:
    """Check if user has access to the complaint based on their role."""
    if current_user.role == UserRole.ADMIN:
        # Admin can access all complaints
        return
    elif current_user.role == UserRole.EMPLOYEE:
        # Employee can only access their own complaints
        if complaint.created_by != current_user.email:
            raise HTTPException(
                status_code=403, 
                detail="You can only access your own complaints"
            )
    elif current_user.role == UserRole.SUPPORT:
        # Support can access complaints assigned to them or created by them
        if complaint.assigned_to != current_user.email and complaint.created_by != current_user.email:
            raise HTTPException(
                status_code=403, 
                detail="You can only access complaints assigned to you or created by you"
            )
        # Support users can only modify complaints assigned to them (for update/delete)
        if operation in ["update", "delete"] and complaint.assigned_to != current_user.email:
            raise HTTPException(
                status_code=403, 
                detail="You can only modify complaints assigned to you"
            )


@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
async def create_complaint(
    complaint: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Any:
    return await ComplaintService.create_complaint(db=db, complaint=complaint, current_user=current_user)

@router.get("/", response_model=PaginatedComplaintsResponse)
async def read_complaints(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    urgency: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    assigned_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Any:
    complaints = await ComplaintService.get_complaints(
        db,
        current_user=current_user,
        skip=skip, 
        limit=limit,
        category=category,
        urgency=urgency,
        status=status,
        search=search,
        assigned_to=assigned_to
    )
    
    # Get total count with same filters
    total = await ComplaintService.get_complaints_count(
        db,
        current_user=current_user,
        category=category,
        urgency=urgency,
        status=status,
        search=search,
        assigned_to=assigned_to
    )
    
    return PaginatedComplaintsResponse(
        items=complaints,
        total=total,
        page=skip // limit + 1,
        size=limit
    )


@router.get("/{complaint_id}", response_model=ComplaintResponse)
async def read_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Any:
    complaint = await ComplaintService.get_complaint(db, complaint_id=complaint_id)
    if complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Check access permissions
    check_complaint_access(complaint, current_user, "read")
    
    return complaint


@router.put("/{complaint_id}", response_model=ComplaintResponse)
async def update_complaint(
    complaint_id: int,
    complaint_update: ComplaintUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> Any:
    # First check if complaint exists and get it
    existing_complaint = await ComplaintService.get_complaint(db, complaint_id=complaint_id)
    if existing_complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Check access permissions
    check_complaint_access(existing_complaint, current_user, "update")
    
    complaint = await ComplaintService.update_complaint(
        db=db, complaint_id=complaint_id, complaint_update=complaint_update
    )
    return complaint


@router.delete("/{complaint_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
) -> None:
    # First check if complaint exists and get it
    existing_complaint = await ComplaintService.get_complaint(db, complaint_id=complaint_id)
    if existing_complaint is None:
        raise HTTPException(status_code=404, detail="Complaint not found")
    
    # Check access permissions
    check_complaint_access(existing_complaint, current_user, "delete")
    
    success = await ComplaintService.delete_complaint(db=db, complaint_id=complaint_id)
    if not success:
        raise HTTPException(status_code=404, detail="Complaint not found")


@router.post("/classify", response_model=ComplaintPrediction)
async def classify_complaint_text(
    complaint: ComplaintCreate,
    current_user = Depends(get_current_user)
) -> Any:
    model_predictor = get_model_predictor()
    prediction = model_predictor.predict(complaint.complaint_text)
    return prediction


@router.post("/ocr", response_model=dict)
async def perform_ocr(
    files: List[UploadFile] = File(...),
    current_user = Depends(get_current_user)
) -> Any:
    """
    Perform OCR on uploaded image files and return extracted text
    """
    try:
        # Filter only image files
        image_files = [
            file for file in files 
            if file.content_type and file.content_type.startswith('image/')
        ]
        
        if not image_files:
            raise HTTPException(
                status_code=400,
                detail="No image files found in the uploaded files"
            )
        
        # Extract text from images
        extracted_text = await OCRService.extract_text_from_images(image_files)
        
        if not extracted_text:
            return {
                "extracted_text": "",
                "message": "No text could be extracted from the uploaded images",
                "files_processed": len(image_files)
            }
        
        return {
            "extracted_text": extracted_text,
            "message": "OCR processing completed successfully",
            "files_processed": len(image_files)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error during OCR processing: {str(e)}"
        )


@router.post("/classify-with-files", response_model=ComplaintPrediction)
async def classify_complaint_with_files(
    complaint_text: Optional[str] = Form(None),
    files: Optional[List[UploadFile]] = File(None),
    current_user = Depends(get_current_user)
) -> Any:
    """
    Classify complaint that may include both text and image attachments.
    Will perform OCR on images and combine with provided text for classification.
    """
    try:
        final_text = complaint_text or ""
        
        # If files are provided, perform OCR
        if files:
            image_files = [
                file for file in files 
                if file.content_type and file.content_type.startswith('image/')
            ]
            
            if image_files:
                extracted_text = await OCRService.extract_text_from_images(image_files)
                if extracted_text:
                    if final_text:
                        final_text = f"{final_text}\n\n--- Text extracted from images ---\n{extracted_text}"
                    else:
                        final_text = extracted_text
        
        if not final_text.strip():
            raise HTTPException(
                status_code=400,
                detail="No text provided and no text could be extracted from images"
            )
        
        # Classify the combined text
        model_predictor = get_model_predictor()
        prediction = model_predictor.predict(final_text)
        
        return prediction
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error during classification: {str(e)}"
        )
