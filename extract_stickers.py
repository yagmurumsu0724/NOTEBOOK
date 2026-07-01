import cv2
import numpy as np
import os
import glob

input_dir = r"C:\Users\yatma\.gemini\antigravity\brain\7c5e6ff9-7d30-4cb7-848e-677070be0813"
output_dir = "./public/stickers"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

image_files = glob.glob(os.path.join(input_dir, "*.jpg"))

sticker_count = 0

for img_path in image_files:
    print(f"Processing {img_path}")
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    if img is None: continue
    
    height, width = img.shape[:2]
    max_dim = 1000
    if height > max_dim or width > max_dim:
        scale = max_dim / max(height, width)
        img = cv2.resize(img, (int(width * scale), int(height * scale)))
        
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Simple Grid Slicing: 4 rows, 3 columns per image
    rows = 4
    cols = 3
    
    tile_h = height // rows
    tile_w = width // cols
    
    for r in range(rows):
        for c in range(cols):
            y1 = r * tile_h
            y2 = (r + 1) * tile_h if r < rows - 1 else height
            x1 = c * tile_w
            x2 = (c + 1) * tile_w if c < cols - 1 else width
            
            cropped = img[y1:y2, x1:x2]
            
            # Simple check to ensure the tile is not mostly white/background
            # Calculate mean brightness
            if len(cropped.shape) == 3:
                gray_crop = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
            else:
                gray_crop = cropped
            mean_val = np.mean(gray_crop)
            
            # If the mean brightness is very high (e.g. > 245), it's mostly blank background
            if mean_val < 245:
                out_path = os.path.join(output_dir, f"sticker_{sticker_count}.png")
                cv2.imwrite(out_path, cropped)
                sticker_count += 1

print(f"Total extracted stickers: {sticker_count}")

# Generate TS file
ts_content = "export const extractedStickers = [\n"
for i in range(sticker_count):
    ts_content += f"  '/stickers/sticker_{i}.png',\n"
ts_content += "];\n"

ts_path = "./src/features/canvas/components/stickers_data.ts"
with open(ts_path, 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"Generated {ts_path}")
