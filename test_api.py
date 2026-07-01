import requests
import io
import cv2

API_URL = "https://api-inference.huggingface.co/models/briaai/RMBG-1.4"
img_path = r"C:\Users\yatma\.gemini\antigravity\brain\7c5e6ff9-7d30-4cb7-848e-677070be0813\media__1782761144277.jpg"

with open(img_path, "rb") as f:
    data = f.read()

response = requests.post(API_URL, data=data)
if response.status_code == 200:
    print("Success API")
else:
    print("Failed API", response.status_code, response.text)
