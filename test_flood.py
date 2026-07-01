import cv2
import numpy as np

img_path = r"C:\Users\yatma\.gemini\antigravity\brain\7c5e6ff9-7d30-4cb7-848e-677070be0813\media__1782761144277.jpg"

img = cv2.imread(img_path)
h, w = img.shape[:2]

# Scale down for speed
max_dim = 1500
if h > max_dim or w > max_dim:
    scale = max_dim / max(h, w)
    img = cv2.resize(img, (int(w * scale), int(h * scale)))
    h, w = img.shape[:2]

# Create a mask for floodFill. It needs to be 2 pixels wider and taller than the image
mask = np.zeros((h + 2, w + 2), np.uint8)

# Start floodFill from top-left corner
# We'll use a fairly large tolerance to eat through faint grid lines
lo_diff = (10, 10, 10)
up_diff = (10, 10, 10)

flood_img = img.copy()
cv2.floodFill(flood_img, mask, (0, 0), (255, 0, 255), lo_diff, up_diff)

# Now, any pixel that is (255,0,255) in flood_img is background.
# Let's find contours of the NON-background regions!
fg_mask = np.where(np.all(flood_img == (255, 0, 255), axis=-1), 0, 255).astype(np.uint8)

# Clean up the mask
kernel = np.ones((5,5), np.uint8)
fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_OPEN, kernel)
fg_mask = cv2.morphologyEx(fg_mask, cv2.MORPH_CLOSE, np.ones((15,15), np.uint8))

contours, _ = cv2.findContours(fg_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

vis = img.copy()
count = 0
for cnt in contours:
    x, y, bw, bh = cv2.boundingRect(cnt)
    if bw > 30 and bh > 30 and bw < w * 0.9 and bh < h * 0.9:
        cv2.rectangle(vis, (x, y), (x+bw, y+bh), (0, 255, 0), 2)
        count += 1

cv2.imwrite("test_flood.jpg", vis)
print(f"Found {count} contours with FloodFill")
