import cv2
import numpy as np
import os

img_path = r"C:\Users\yatma\.gemini\antigravity\brain\7c5e6ff9-7d30-4cb7-848e-677070be0813\media__1782761144277.jpg"

img = cv2.imread(img_path)
height, width = img.shape[:2]

max_dim = 1000
if height > max_dim or width > max_dim:
    scale = max_dim / max(height, width)
    img = cv2.resize(img, (int(width * scale), int(height * scale)))

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Since the background is mostly white/off-white, and the stickers have a white border
# Let's try simple thresholding.
# Mean brightness of background is very high.
_, thresh = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)

# Find contours
contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

vis_img = img.copy()

count = 0
for cnt in contours:
    x, y, w, h = cv2.boundingRect(cnt)
    # Minimum size for a sticker
    if w > 30 and h > 30 and w < width * 0.8 and h < height * 0.8:
        # Check area against bounding box to avoid long skinny lines
        area = cv2.contourArea(cnt)
        if area > 400:
            cv2.rectangle(vis_img, (x, y), (x+w, y+h), (0, 255, 0), 2)
            count += 1

cv2.imwrite("test_vis.jpg", vis_img)
print(f"Found {count} contours")
