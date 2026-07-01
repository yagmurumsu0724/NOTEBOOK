import cv2
import numpy as np

img_path = r"C:\Users\yatma\.gemini\antigravity\brain\7c5e6ff9-7d30-4cb7-848e-677070be0813\media__1782761144277.jpg"

img = cv2.imread(img_path)
h, w = img.shape[:2]

scale = min(1.0, 1500 / max(h, w))
small = cv2.resize(img, (int(w * scale), int(h * scale)))

gray = cv2.cvtColor(small, cv2.COLOR_BGR2GRAY)

# Bilateral filter removes faint textures but keeps strong edges
blurred = cv2.bilateralFilter(gray, 9, 150, 150)

# The background is bright. Stickers are dark or have dark shadows.
# Let's threshold the blurred image. 
# Anything darker than 235 is part of a sticker or shadow.
_, thresh = cv2.threshold(blurred, 235, 255, cv2.THRESH_BINARY_INV)

# Morphological operations to clean up
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5,5))
opened = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel) # Remove small noise
closed = cv2.morphologyEx(opened, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25,25))) # Fill holes in stickers

contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

vis = small.copy()
count = 0
for cnt in contours:
    x, y, bw, bh = cv2.boundingRect(cnt)
    if bw > 30 and bh > 30:
        cv2.rectangle(vis, (x, y), (x+bw, y+bh), (0, 255, 0), 2)
        count += 1

cv2.imwrite("test_bila.jpg", vis)
print(f"Found {count} contours with bilateral + threshold")
