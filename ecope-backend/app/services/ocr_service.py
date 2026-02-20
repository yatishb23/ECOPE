import pytesseract
from PIL import Image
from typing import List, Optional
import io
from fastapi import UploadFile, HTTPException
import os
import tempfile


class OCRService:
    @staticmethod
    async def extract_text_from_images(files: List[UploadFile]) -> str:
        """
        Extract text from uploaded image files using OCR
        
        Args:
            files: List of uploaded files (images)
            
        Returns:
            Combined text extracted from all images
        """
        extracted_texts = []
        
        for file in files:
            try:
                # Validate file type
                if not file.content_type or not file.content_type.startswith('image/'):
                    continue  # Skip non-image files
                
                # Read the uploaded file
                content = await file.read()
                
                # Open image with PIL
                image = Image.open(io.BytesIO(content))
                
                # Convert to RGB if necessary (for certain image formats)
                if image.mode != 'RGB':
                    image = image.convert('RGB')
                
                # Extract text using pytesseract
                text = pytesseract.image_to_string(image, lang='eng')
                
                if text.strip():
                    extracted_texts.append(text.strip())
                    
            except Exception as e:
                # Log the error but continue processing other files
                print(f"Error processing file {file.filename}: {e}")
                continue
        
        # Combine all extracted texts
        combined_text = "\n\n".join(extracted_texts)
        return combined_text.strip()
    
    @staticmethod
    async def extract_text_from_single_image(file: UploadFile) -> str:
        """
        Extract text from a single uploaded image file using OCR
        
        Args:
            file: Single uploaded file (image)
            
        Returns:
            Text extracted from the image
        """
        try:
            # Validate file type
            if not file.content_type or not file.content_type.startswith('image/'):
                raise HTTPException(
                    status_code=400, 
                    detail=f"File {file.filename} is not an image"
                )
            
            # Read the uploaded file
            content = await file.read()
            
            # Open image with PIL
            image = Image.open(io.BytesIO(content))
            
            # Convert to RGB if necessary (for certain image formats)
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Extract text using pytesseract
            text = pytesseract.image_to_string(image, lang='eng')
            
            return text.strip()
                    
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Error processing image {file.filename}: {str(e)}"
            )
    
    @staticmethod
    def is_image_file(filename: str) -> bool:
        """
        Check if a file is an image based on its extension
        
        Args:
            filename: Name of the file
            
        Returns:
            True if the file is an image, False otherwise
        """
        if not filename:
            return False
            
        image_extensions = {'.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff', '.webp'}
        file_extension = os.path.splitext(filename.lower())[1]
        return file_extension in image_extensions