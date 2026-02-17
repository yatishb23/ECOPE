import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoModel
from pathlib import Path
from app.core.config import settings
from app.models.domain.complaint import Category, Urgency
from sklearn.preprocessing._label import LabelEncoder as LabelEncoderClass


class MultiTaskModel(nn.Module):
    def __init__(self, num_genres, num_priority):
        super().__init__()
        print("Initializing MultiTaskModel with", num_genres, "categories and", num_priority, "urgency classes")
        self.enc = AutoModel.from_pretrained(settings.MODEL)
        h = self.enc.config.hidden_size
        self.drop = nn.Dropout(0.3)
        self.head_cat = nn.Linear(h, num_genres)
        self.head_urg = nn.Linear(h, num_priority)
        
    def forward(self, input_ids, attention_mask, token_type_ids=None):
        x = self.enc(input_ids, attention_mask=attention_mask)[0][:, 0]
        x = self.drop(x)
        return self.head_cat(x), self.head_urg(x)


class ModelPredictor:
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print("Using device:", self.device)

        # Load tokenizer
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(settings.MODEL)
            print("Tokenizer loaded successfully")
        except Exception as e:
            print("Failed to load tokenizer:", e)
            raise

        # Add safe globals for label encoder
        torch.serialization.add_safe_globals([LabelEncoderClass])

        # Check MODEL_PATH
        model_path = Path(settings.MODEL_PATH)
        print("Checking model path:", model_path)
        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found at {model_path}")

        try:
            # Load checkpoint
            checkpoint = torch.load(model_path, map_location=self.device)
            print("Checkpoint keys:", list(checkpoint.keys()))

            # Load label encoders
            self.le_cat = checkpoint.get('le_cat')
            self.le_urg = checkpoint.get('le_urg')
            if self.le_cat is None or self.le_urg is None:
                raise ValueError("Label encoders not found in checkpoint")

            # Initialize model
            self.model = MultiTaskModel(
                num_genres=len(self.le_cat.classes_),
                num_priority=len(self.le_urg.classes_)
            )

            # Load model weights
            self.model.load_state_dict(checkpoint['state'])
            self.model.to(self.device)
            self.model.eval()
            print("Model loaded successfully")

        except Exception as e:
            print(f"Error loading model: {str(e)}")
            raise

        # Enum validation
        self.category_values = {cat.value for cat in Category}
        self.urgency_values = {urg.value for urg in Urgency}

    def predict(self, text):
        """Predict category and urgency for a complaint text"""
        try:
            # Tokenize input
            inputs = self.tokenizer(
                text,
                return_tensors="pt",
                truncation=True,
                padding=True,
                max_length=512
            ).to(self.device)

            with torch.no_grad():
                category_logits, urgency_logits = self.model(**inputs)

                # Predicted indices
                category_idx = category_logits.argmax(1).item()
                urgency_idx = urgency_logits.argmax(1).item()

                # Probabilities
                category_probs = torch.softmax(category_logits, dim=1)
                urgency_probs = torch.softmax(urgency_logits, dim=1)
                confidence_category = category_probs[0][category_idx].item()
                confidence_urgency = urgency_probs[0][urgency_idx].item()

                # Map indices to labels
                category = self.le_cat.inverse_transform([category_idx])[0]
                urgency = self.le_urg.inverse_transform([urgency_idx])[0]

                # Validate enums
                if category not in self.category_values:
                    category = "Other"
                if urgency not in self.urgency_values:
                    urgency = "Medium"

                return {
                    "category": category,
                    "urgency": urgency,
                    "confidence_category": confidence_category,
                    "confidence_urgency": confidence_urgency
                }

        except Exception as e:
            print("Prediction failed:", e)
            return {
                "category": "Other",
                "urgency": "Medium",
                "confidence_category": 1.0,
                "confidence_urgency": 1.0
            }


# Singleton instance
model_predictor = None

def get_model_predictor():
    """Get or create model predictor singleton"""
    global model_predictor
    if model_predictor is None:
        try:
            model_predictor = ModelPredictor()
            print("Model predictor initialized successfully")
        except Exception as e:
            print(f"Failed to initialize model predictor: {str(e)}")
            # Fallback dummy predictor
            class DummyPredictor:
                def predict(self, text):
                    return {
                        "category": "Other",
                        "urgency": "Medium",
                        "confidence_category": 1.0,
                        "confidence_urgency": 1.0
                    }
            model_predictor = DummyPredictor()
            print("Using dummy predictor as fallback")
    return model_predictor


