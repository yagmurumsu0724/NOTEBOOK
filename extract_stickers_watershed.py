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
    # Resize slightly if too massive to prevent memory issues, but keep detail
    max_dim = 1800
    if h > max_dim or w > max_dim:
        scale = max_dim / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)))
        h, w = img.shape[:2]

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Use Otsu's thresholding
    _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Noise removal
    kernel = np.ones((3,3), np.uint8)
    opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=2)

    # Sure background area (dilate the stickers so we know what is definitely background)
    sure_bg = cv2.dilate(opening, kernel, iterations=3)

    # Finding sure foreground area (distance transform to find the core of the stickers)
    dist_transform = cv2.distanceTransform(opening, cv2.DIST_L2, 5)
    _, sure_fg = cv2.threshold(dist_transform, 0.15*dist_transform.max(), 255, 0)

    # Finding unknown region
    sure_fg = np.uint8(sure_fg)
    unknown = cv2.subtract(sure_bg, sure_fg)

    # Marker labelling
    _, markers = cv2.connectedComponents(sure_fg)

    # Add one to all labels so that sure background is not 0, but 1
    markers = markers + 1

    # Mark the region of unknown with zero
    markers[unknown == 255] = 0

    # Apply watershed
    markers = cv2.watershed(img, markers)

    for label in np.unique(markers):
        if label == 0 or label == 1:
            continue # Skip background and borders
        
        # Create mask for this sticker
        mask = np.zeros(gray.shape, dtype="uint8")
        mask[markers == label] = 255
        
        # Find bounding box for this sticker
        cnts, _ = cv2.findContours(mask.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if len(cnts) == 0: continue
        
        c = max(cnts, key=cv2.contourArea)
        x, y, bw, bh = cv2.boundingRect(c)
        
        # Filter tiny specks or massive false positives
        if bw > 40 and bh > 40 and bw < w * 0.95 and bh < h * 0.95:
            # Crop the sticker
            # Add padding
            pad = 5
            x1 = max(0, x - pad)
            y1 = max(0, y - pad)
            x2 = min(w, x + bw + pad)
            y2 = min(h, y + bh + pad)
            
            sticker_crop = img[y1:y2, x1:x2].copy()
            sticker_mask = mask[y1:y2, x1:x2].copy()
            
            # Smooth the mask to avoid jagged edges
            sticker_mask = cv2.GaussianBlur(sticker_mask, (3,3), 0)
            
            # Add alpha channel
            b, g, r = cv2.split(sticker_crop)
            rgba = cv2.merge([b, g, r, sticker_mask])
            
            out_path = os.path.join(output_dir, f"sticker_{sticker_count}.png")
            cv2.imwrite(out_path, rgba)
            sticker_count += 1

print(f"Total extracted stickers: {sticker_count}")

# Generate TS file
ts_content = "const stickerModules = import.meta.glob('../../../assets/stickers/*.png', { eager: true, import: 'default' });\n"
ts_content += "export const extractedStickers = Object.values(stickerModules) as string[];\n"

ts_path = "./src/features/canvas/components/stickers_data.ts"
with open(ts_path, 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"Generated {ts_path}")
