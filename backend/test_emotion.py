import base64
import io
import sys
import os
import urllib.request
import ssl
from PIL import Image
import numpy as np

# Force UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

try:
    from deepface import DeepFace
except Exception:
    DeepFace = None

EMOTION_TO_MOOD = {
    "happy": "happy",
    "surprise": "energetic",
    "sad": "sad",
    "fear": "sad",
    "angry": "energetic",
    "disgust": "energetic",
    "neutral": "chill",
}

class EmotionDetectionService:
    def __init__(self):
        self._enabled = True

    def detect_from_image(self, image_data):
        image_array = self._decode_image(image_data)
        if image_array is None:
            return {"emotion": "neutral", "mood": "chill", "used_fallback": True, "message": "Decode failed."}

        try:
            analysis = DeepFace.analyze(
                img_path=image_array,
                actions=["emotion"],
                enforce_detection=False,
                detector_backend="opencv",
                silent=True,
            )
            if isinstance(analysis, list):
                analysis = analysis[0]
            emotion = (analysis or {}).get("dominant_emotion") or "neutral"
            mood = EMOTION_TO_MOOD.get(emotion, "chill")
            return {"emotion": emotion, "mood": mood, "used_fallback": False, "message": f"Detected {emotion}"}
        except Exception as exc:
            return {"emotion": "neutral", "mood": "chill", "used_fallback": True, "message": f"Error: {exc}"}

    def _decode_image(self, image_data):
        payload = image_data.split(",", 1)[1] if "," in image_data else image_data
        raw = base64.b64decode(payload)
        image = Image.open(io.BytesIO(raw)).convert("RGB")
        return np.array(image)

def test_emotion():
    print("Downloading a sample face image...")
    url = "https://thispersondoesnotexist.com/"
    
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, context=ctx) as resp:
        content = resp.read()

    b64_img = base64.b64encode(content).decode("utf-8")
    b64_data_uri = f"data:image/jpeg;base64,{b64_img}"
    
    print("Initializing EmotionDetectionService...")
    service = EmotionDetectionService()
    
    print("Testing image data through detection service...")
    result = service.detect_from_image(b64_data_uri)
    print("\n--- Emotion Detection Result ---")
    print(f"Detected Emotion: {result.get('emotion')}")
    print(f"Derived Mood: {result.get('mood')}")
    print(f"Algorithm Fallback Used: {result.get('used_fallback')}")
    print(f"Service Message: {result.get('message')}")
    print("--------------------------------")

if __name__ == "__main__":
    if DeepFace is not None:
        print(f"DeepFace module loaded successfully.")
    test_emotion()
