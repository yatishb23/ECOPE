import sys
from pathlib import Path
import os

# Add backend to path
sys.path.append(os.getcwd())

from app.core.config import settings
from app.ml.model import get_model_predictor

print(f"Current Working Directory: {os.getcwd()}")
print(f"Settings.MODEL_PATH: {settings.MODEL_PATH}")
print(f"File exists: {Path(settings.MODEL_PATH).exists()}")

predictor = get_model_predictor()
print(f"Predictor class: {type(predictor).__name__}")
