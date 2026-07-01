import cv2
import numpy as np

img_path = r"C:\Users\yatma\.gemini\antigravity\brain\7c5e6ff9-7d30-4cb7-848e-677070be0813\media__1782761144277.jpg"

img = cv2.imread(img_path)
h, w = img.shape[:2]

scale = min(1.0, 1500 / max(h, w))
img = cv2.resize(img, (int(w * scale), int(h * scale)))
h, w = img.shape[:2]

# Get border pixels to determine background color
top = img[0:5, :]
bottom = img[h-5:h, :]
left = img[:, 0:5]
right = img[:, w-5:w]

border_pixels = np.concatenate([
    top.reshape(-1, 3), 
    bottom.reshape(-1, 3), 
    left.reshape(-1, 3), 
    right.reshape(-1, 3)
])

# Find the median color of the border
bg_color = np.median(border_pixels, axis=0)

# Calculate Euclidean distance of all pixels to bg_color
# img is uint8, we need float for distance
diff = img.astype(np.float32) - bg_color
dist = np.linalg.norm(diff, axis=2)

# Threshold distance to find foreground
# Experiment with threshold, e.g. 20
mask = np.where(dist > 25, 255, 0).astype(np.uint8)

# Clean up mask
kernel = np.ones((5,5), np.uint8)
mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((15,15), np.uint8))

contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

vis = img.copy()
count = 0
for cnt in contours:
    x, y, bw, bh = cv2.boundingRect(cnt)
    if bw > 30 and bh > 30 and bw < w * 0.9 and bh < h * 0.9:
        cv2.rectangle(vis, (x, y), (x+bw, y+bh), (0, 255, 0), 2)
        count += 1

cv2.imwrite("test_colordist.jpg", vis)
print(f"Found {count} contours with color distance")
