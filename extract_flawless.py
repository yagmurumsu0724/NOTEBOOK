import cv2
import numpy as np
import os
import glob
import shutil

input_dir = r"C:\Users\yatma\.gemini\antigravity\brain\7c5e6ff9-7d30-4cb7-848e-677070be0813"
output_dir = "./src/assets/stickers"

if os.path.exists(output_dir):
    shutil.rmtree(output_dir)
os.makedirs(output_dir)

image_files = glob.glob(os.path.join(input_dir, "*.jpg"))
sticker_count = 0

for img_path in image_files:
    print(f"Processing {img_path}")
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    if img is None: continue
    
    h, w = img.shape[:2]
    max_dim = 1800
    if h > max_dim or w > max_dim:
        scale = max_dim / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
        h, w = img.shape[:2]

    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Very slight blur before thresholding to smooth out noise
    blurred_gray = cv2.GaussianBlur(gray, (3,3), 0)
    
    # Adaptive thresholding instead of Otsu for more robust local background rejection
    thresh = cv2.adaptiveThreshold(blurred_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 5)

    # Noise removal and hole filling
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3,3))
    opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=2)
    closing = cv2.morphologyEx(opening, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5,5)), iterations=3)

    # Sure background area
    sure_bg = cv2.dilate(closing, kernel, iterations=4)

    # Finding sure foreground area
    dist_transform = cv2.distanceTransform(closing, cv2.DIST_L2, 5)
    _, sure_fg = cv2.threshold(dist_transform, 0.2*dist_transform.max(), 255, 0)
    sure_fg = np.uint8(sure_fg)

    # Unknown region
    unknown = cv2.subtract(sure_bg, sure_fg)

    # Marker labelling
    _, markers = cv2.connectedComponents(sure_fg)
    markers = markers + 1
    markers[unknown == 255] = 0

    # Watershed
    markers = cv2.watershed(img, markers)

    for label in np.unique(markers):
        if label == 0 or label == 1: continue
        
        # Raw binary mask from watershed
        raw_mask = np.zeros(gray.shape, dtype="uint8")
        raw_mask[markers == label] = 255
        
        cnts, _ = cv2.findContours(raw_mask.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not cnts: continue
        
        c = max(cnts, key=cv2.contourArea)
        x, y, bw, bh = cv2.boundingRect(c)
        
        if bw > 40 and bh > 40 and bw < w * 0.95 and bh < h * 0.95:
            pad = 10
            x1 = max(0, x - pad)
            y1 = max(0, y - pad)
            x2 = min(w, x + bw + pad)
            y2 = min(h, y + bh + pad)
            
            # Create a pristine smooth polygon mask
            smooth_mask = np.zeros(gray.shape, dtype=np.uint8)
            cv2.drawContours(smooth_mask, [c], -1, 255, thickness=cv2.FILLED)
            
            # Erode slightly to eliminate the background halo
            erode_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3,3))
            eroded_mask = cv2.erode(smooth_mask, erode_kernel, iterations=1)
            
            # Extract crop
            sticker_crop = img[y1:y2, x1:x2].copy()
            crop_mask = eroded_mask[y1:y2, x1:x2].copy()
            
            # Feather the edges with Gaussian Blur for perfect anti-aliasing
            feathered_mask = cv2.GaussianBlur(crop_mask, (5, 5), 0)
            
            # Split and merge with feathered alpha
            b, g, r = cv2.split(sticker_crop)
            rgba = cv2.merge([b, g, r, feathered_mask])
            
            out_path = os.path.join(output_dir, f"sticker_{sticker_count}.png")
            cv2.imwrite(out_path, rgba)
            sticker_count += 1

print(f"Total flawless extracted stickers: {sticker_count}")

ts_content = "const stickerModules = import.meta.glob('../../../assets/stickers/*.png', { eager: true, import: 'default' });\n"
ts_content += "export const extractedStickers = Object.values(stickerModules) as string[];\n"

ts_path = "./src/features/canvas/components/stickers_data.ts"
with open(ts_path, 'w', encoding='utf-8') as f:
    f.write(ts_content)
