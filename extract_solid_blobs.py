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
    
    # Very slight blur to remove noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    
    # Canny edge detection
    edges = cv2.Canny(blurred, 30, 100)
    
    # MASSIVE dilation to fuse all internal edges of a sticker into one solid blob
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    dilated = cv2.dilate(edges, kernel, iterations=2)
    
    # Close any remaining holes inside the sticker blob
    closed = cv2.morphologyEx(dilated, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (35, 35)))
    
    # Find contours of the massive fused blobs
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for cnt in contours:
        x, y, bw, bh = cv2.boundingRect(cnt)
        
        # Filter tiny specks or massive false positives (like the whole page)
        if bw > 50 and bh > 50 and bw < w * 0.8 and bh < h * 0.8:
            pad = 10
            x1 = max(0, x - pad)
            y1 = max(0, y - pad)
            x2 = min(w, x + bw + pad)
            y2 = min(h, y + bh + pad)
            
            sticker_crop = img[y1:y2, x1:x2].copy()
            ch, cw = sticker_crop.shape[:2]
            
            # Let's use GrabCut to remove the background inside the rectangular crop
            mask = np.zeros((ch, cw), np.uint8)
            bgdModel = np.zeros((1,65), np.float64)
            fgdModel = np.zeros((1,65), np.float64)
            
            # The rectangle for GrabCut is slightly smaller than the crop to give background context
            rect = (2, 2, cw - 4, ch - 4)
            
            try:
                cv2.grabCut(sticker_crop, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)
                mask2 = np.where((mask==2)|(mask==0), 0, 1).astype('uint8')
                
                # If GrabCut failed to find anything foreground, just use the rectangle
                if np.sum(mask2) < 100:
                    mask2 = np.ones((ch, cw), np.uint8)
                
                # Smooth the mask for premium edges
                # Erode 1 pixel
                mask2 = cv2.erode(mask2, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3,3)), iterations=1)
                mask_float = mask2.astype(np.float32)
                feathered_mask = cv2.GaussianBlur(mask_float, (5, 5), 0)
                
                # Apply feathered mask to alpha channel
                b, g, r = cv2.split(sticker_crop)
                alpha = (feathered_mask * 255).astype(np.uint8)
                rgba = cv2.merge([b, g, r, alpha])
                
                out_path = os.path.join(output_dir, f"sticker_{sticker_count}.png")
                cv2.imwrite(out_path, rgba)
                sticker_count += 1
            except Exception as e:
                print(f"GrabCut failed: {e}")

print(f"Total flawless extracted stickers: {sticker_count}")

ts_content = "const stickerModules = import.meta.glob('../../../assets/stickers/*.png', { eager: true, import: 'default' });\n"
ts_content += "export const extractedStickers = Object.values(stickerModules) as string[];\n"

ts_path = "./src/features/canvas/components/stickers_data.ts"
with open(ts_path, 'w', encoding='utf-8') as f:
    f.write(ts_content)
