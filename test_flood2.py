import cv2
import numpy as np

img_path = r"C:\Users\yatma\.gemini\antigravity\brain\7c5e6ff9-7d30-4cb7-848e-677070be0813\media__1782761144277.jpg"
img = cv2.imread(img_path)

h, w = img.shape[:2]
scale = min(1.0, 1500 / max(h, w))
img = cv2.resize(img, (int(w * scale), int(h * scale)))
h, w = img.shape[:2]

flood_img = img.copy()
mask = np.zeros((h + 2, w + 2), np.uint8)

lo_diff = (40, 40, 40)
up_diff = (40, 40, 40)

# Floodfill from all edges
points_to_fill = []
for x in range(0, w, 50):
    points_to_fill.extend([(x, 0), (x, h - 1)])
for y in range(0, h, 50):
    points_to_fill.extend([(0, y), (w - 1, y)])

for pt in points_to_fill:
    if mask[pt[1] + 1, pt[0] + 1] == 0:
        cv2.floodFill(flood_img, mask, pt, (255, 0, 255), lo_diff, up_diff, cv2.FLOODFILL_FIXED_RANGE)

# Foreground is everything not pink
fg_mask = np.where(np.all(flood_img == (255, 0, 255), axis=-1), 0, 255).astype(np.uint8)

# Clean up
kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel)
fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))

contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

vis = img.copy()
count = 0
for cnt in contours:
    x, y, bw, bh = cv2.boundingRect(cnt)
    if bw > 30 and bh > 30 and bw < w * 0.9 and bh < h * 0.9:
        cv2.rectangle(vis, (x, y), (x+bw, y+bh), (0, 255, 0), 2)
        count += 1

cv2.imwrite("test_flood2.jpg", vis)
print(f"Found {count} contours using multi-point flood fill")
