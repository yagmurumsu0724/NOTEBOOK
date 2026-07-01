import cv2
import numpy as np

img_path = r"C:\Users\yatma\.gemini\antigravity\brain\7c5e6ff9-7d30-4cb7-848e-677070be0813\media__1782761144277.jpg"
img = cv2.imread(img_path)

h, w = img.shape[:2]
scale = min(1.0, 1500 / max(h, w))
img = cv2.resize(img, (int(w * scale), int(h * scale)))

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
_, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

# noise removal
kernel = np.ones((3,3), np.uint8)
opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=2)

# sure background area
sure_bg = cv2.dilate(opening, kernel, iterations=3)

# Finding sure foreground area
dist_transform = cv2.distanceTransform(opening, cv2.DIST_L2, 5)
_, sure_fg = cv2.threshold(dist_transform, 0.2*dist_transform.max(), 255, 0)

# Finding unknown region
sure_fg = np.uint8(sure_fg)
unknown = cv2.subtract(sure_bg, sure_fg)

# Marker labelling
_, markers = cv2.connectedComponents(sure_fg)

# Add one to all labels so that sure background is not 0, but 1
markers = markers + 1

# Now, mark the region of unknown with zero
markers[unknown == 255] = 0

markers = cv2.watershed(img, markers)

count = 0
vis = img.copy()
for label in np.unique(markers):
    if label == 0 or label == 1:
        continue # Background or border
    
    # Create mask for this label
    mask = np.zeros(gray.shape, dtype="uint8")
    mask[markers == label] = 255
    
    # Find bounding box
    cnts, _ = cv2.findContours(mask.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if len(cnts) == 0: continue
    
    c = max(cnts, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(c)
    
    if w > 30 and h > 30 and w < img.shape[1] * 0.9 and h < img.shape[0] * 0.9:
        cv2.rectangle(vis, (x, y), (x+w, y+h), (0, 255, 0), 2)
        count += 1

cv2.imwrite("test_water.jpg", vis)
print(f"Found {count} stickers with watershed")
