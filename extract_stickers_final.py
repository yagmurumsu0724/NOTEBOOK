import cv2
import numpy as np
import os
import glob
import shutil

input_dir = r"C:\Users\yatma\.gemini\antigravity\brain\7c5e6ff9-7d30-4cb7-848e-677070be0813"
output_dir = "./src/assets/stickers"

# Clear old stickers
if os.path.exists(output_dir):
    shutil.rmtree(output_dir)
os.makedirs(output_dir)

image_files = glob.glob(os.path.join(input_dir, "*.jpg"))
sticker_count = 0

for img_path in image_files:
    print(f"Processing {img_path}")
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    if img is None: continue
    
    height, width = img.shape[:2]
    max_dim = 1200
    if height > max_dim or width > max_dim:
        scale = max_dim / max(height, width)
        img = cv2.resize(img, (int(width * scale), int(height * scale)))
        height, width = img.shape[:2]
        
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    
    # Mild dilation
    kernel = np.ones((7,7), np.uint8)
    dilated = cv2.dilate(edges, kernel, iterations=2)
    
    # Close any small holes inside the blobs
    closed = cv2.morphologyEx(dilated, cv2.MORPH_CLOSE, np.ones((15, 15), np.uint8))
    
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    boxes = []
    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        if w > 40 and h > 40 and w < width * 0.9 and h < height * 0.9:
            # Check aspect ratio
            if w/h < 8 and h/w < 8:
                pad = 15
                x1 = max(0, x - pad)
                y1 = max(0, y - pad)
                x2 = min(width, x + w + pad)
                y2 = min(height, y + h + pad)
                boxes.append((x1, y1, x2, y2))
                
    # Non-maximum suppression to remove overlapping boxes
    final_boxes = []
    for b in boxes:
        x1, y1, x2, y2 = b
        keep = True
        for ob in final_boxes:
            ox1, oy1, ox2, oy2 = ob
            # Compute intersection area
            ix1 = max(x1, ox1)
            iy1 = max(y1, oy1)
            ix2 = min(x2, ox2)
            iy2 = min(y2, oy2)
            if ix1 < ix2 and iy1 < iy2:
                inter_area = (ix2 - ix1) * (iy2 - iy1)
                b_area = (x2 - x1) * (y2 - y1)
                ob_area = (ox2 - ox1) * (oy2 - oy1)
                # If highly overlapping, keep the larger one
                if inter_area > 0.3 * b_area or inter_area > 0.3 * ob_area:
                    keep = False
                    # Expand the existing box to include this one
                    ob[0] = min(x1, ox1)
                    ob[1] = min(y1, oy1)
                    ob[2] = max(x2, ox2)
                    ob[3] = max(y2, oy2)
                    break
        if keep:
            final_boxes.append(list(b))
            
    for b in final_boxes:
        x1, y1, x2, y2 = b
        
        rect = (x1, y1, x2 - x1, y2 - y1)
        
        # GrabCut for perfect transparency
        mask = np.zeros((height, width), np.uint8)
        bgdModel = np.zeros((1,65), np.float64)
        fgdModel = np.zeros((1,65), np.float64)
        
        try:
            cv2.grabCut(img, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)
            mask2 = np.where((mask==2)|(mask==0), 0, 1).astype('uint8')
            
            sticker_crop = img[y1:y2, x1:x2]
            mask_crop = mask2[y1:y2, x1:x2]
            
            # Create alpha channel
            b, g, r = cv2.split(sticker_crop)
            alpha = mask_crop * 255
            rgba = cv2.merge([b, g, r, alpha])
            
            # Only save if there's significant content (not just a tiny sliver)
            if np.sum(mask_crop) > 400:
                out_path = os.path.join(output_dir, f"sticker_{sticker_count}.png")
                cv2.imwrite(out_path, rgba)
                sticker_count += 1
        except Exception as e:
            print(f"Error on grabcut: {e}")

print(f"Total extracted stickers: {sticker_count}")

# Generate TS file
ts_content = "const stickerModules = import.meta.glob('../../../assets/stickers/*.png', { eager: true, import: 'default' });\n"
ts_content += "export const extractedStickers = Object.values(stickerModules) as string[];\n"

ts_path = "./src/features/canvas/components/stickers_data.ts"
with open(ts_path, 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"Generated {ts_path}")
