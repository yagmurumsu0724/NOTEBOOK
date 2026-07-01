import cv2
import numpy as np
import os

img_path = r"C:\Users\yatma\.gemini\antigravity\brain\7c5e6ff9-7d30-4cb7-848e-677070be0813\media__1782761144277.jpg"
output_dir = "test_extract_output"
os.makedirs(output_dir, exist_ok=True)

img = cv2.imread(img_path)
height, width = img.shape[:2]

# Resize for performance and consistent parameters
max_dim = 1500
if height > max_dim or width > max_dim:
    scale = max_dim / max(height, width)
    img = cv2.resize(img, (int(width * scale), int(height * scale)))

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

# Smooth the image heavily to blur out faint grid lines but keep thick sticker borders
blurred = cv2.bilateralFilter(gray, 9, 75, 75)

# Adaptive thresholding
thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)

# Morphological operations to remove thin lines (like grid lines)
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3,3))
cleaned = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)

# Dilate to connect parts of the same sticker
dilate_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15,15))
dilated = cv2.dilate(cleaned, dilate_kernel, iterations=3)

# Find contours
contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

count = 0
for cnt in contours:
    x, y, w, h = cv2.boundingRect(cnt)
    # Filter small noise and huge background contours
    if w > 40 and h > 40 and w < width * 0.9 and h < height * 0.9:
        # Check aspect ratio
        if w/h < 5 and h/w < 5:
            # Add padding
            pad = 10
            x1 = max(0, x - pad)
            y1 = max(0, y - pad)
            x2 = min(img.shape[1], x + w + pad)
            y2 = min(img.shape[0], y + h + pad)
            
            # Create a completely transparent image of the bounding box size
            sticker = img[y1:y2, x1:x2]
            
            # Try to mask the sticker
            mask = np.zeros((y2-y1, x2-x1), dtype=np.uint8)
            cnt_shifted = cnt - [x1, y1]
            cv2.drawContours(mask, [cnt_shifted], -1, 255, thickness=cv2.FILLED)
            
            # Smooth mask
            mask = cv2.GaussianBlur(mask, (7,7), 0)
            
            # Add alpha channel
            b, g, r = cv2.split(sticker)
            alpha = mask
            rgba = cv2.merge([b, g, r, alpha])
            
            cv2.imwrite(f"{output_dir}/sticker_{count}.png", rgba)
            count += 1

print(f"Extracted {count} stickers")
