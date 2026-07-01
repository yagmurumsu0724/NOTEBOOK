import cv2
import numpy as np
from pymatting import estimate_alpha_knn

img_path = r"C:\Users\yatma\.gemini\antigravity\brain\7c5e6ff9-7d30-4cb7-848e-677070be0813\media__1782761144277.jpg"
img = cv2.imread(img_path)
h, w = img.shape[:2]

scale = min(1.0, 1500 / max(h, w))
img = cv2.resize(img, (int(w * scale), int(h * scale)))
h, w = img.shape[:2]

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
_, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

kernel = np.ones((3,3), np.uint8)
opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=2)
sure_bg = cv2.dilate(opening, kernel, iterations=3)
dist_transform = cv2.distanceTransform(opening, cv2.DIST_L2, 5)
_, sure_fg = cv2.threshold(dist_transform, 0.15*dist_transform.max(), 255, 0)
sure_fg = np.uint8(sure_fg)
unknown = cv2.subtract(sure_bg, sure_fg)

_, markers = cv2.connectedComponents(sure_fg)
markers = markers + 1
markers[unknown == 255] = 0
markers = cv2.watershed(img, markers)

# Pick the first valid sticker
sticker_mask = None
sticker_rect = None
for label in np.unique(markers):
    if label == 0 or label == 1: continue
    m = np.zeros(gray.shape, dtype="uint8")
    m[markers == label] = 255
    cnts, _ = cv2.findContours(m.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts: continue
    c = max(cnts, key=cv2.contourArea)
    x, y, bw, bh = cv2.boundingRect(c)
    if bw > 40 and bh > 40:
        sticker_mask = m
        sticker_rect = (x, y, bw, bh)
        break

if sticker_mask is not None:
    x, y, bw, bh = sticker_rect
    pad = 15
    x1, y1 = max(0, x - pad), max(0, y - pad)
    x2, y2 = min(w, x + bw + pad), min(h, y + bh + pad)
    
    crop_img = img[y1:y2, x1:x2]
    crop_mask = sticker_mask[y1:y2, x1:x2]
    
    # Create Trimap
    # 0 = Background (Black), 128 = Unknown (Gray), 255 = Foreground (White)
    trimap = np.full(crop_mask.shape, 128, dtype=np.uint8)
    
    # Erode the mask to find sure foreground
    fg_kernel = np.ones((7,7), np.uint8)
    sure_fg_crop = cv2.erode(crop_mask, fg_kernel, iterations=1)
    
    # Dilate the mask to find sure background
    bg_kernel = np.ones((11,11), np.uint8)
    sure_bg_crop = cv2.dilate(crop_mask, bg_kernel, iterations=1)
    
    trimap[sure_fg_crop == 255] = 255
    trimap[sure_bg_crop == 0] = 0
    
    # Estimate Alpha
    # Pymatting expects images in float format [0, 1]
    image_float = crop_img.astype(np.float64) / 255.0
    trimap_float = trimap.astype(np.float64) / 255.0
    
    alpha = estimate_alpha_knn(image_float, trimap_float)
    
    # Apply Alpha
    b, g, r = cv2.split(crop_img)
    rgba = cv2.merge([b, g, r, (alpha * 255).astype(np.uint8)])
    
    cv2.imwrite("test_pymatting.png", rgba)
    cv2.imwrite("test_trimap.png", trimap)
    print("Successfully tested pymatting")
else:
    print("No sticker found")
