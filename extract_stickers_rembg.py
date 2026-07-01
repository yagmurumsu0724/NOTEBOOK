import cv2
import numpy as np
import os
import glob
from rembg import remove

input_dir = r"C:\Users\yatma\.gemini\antigravity\brain\7c5e6ff9-7d30-4cb7-848e-677070be0813"
output_dir = r"C:\Users\yatma\Desktop\NOTDEFTERİ\public\stickers"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# Read all jpg files
image_files = glob.glob(os.path.join(input_dir, "*.jpg"))

sticker_count = 0

for img_path in image_files:
    print(f"Processing {img_path} with rembg...")
    
    # Read the image
    with open(img_path, 'rb') as i:
        input_data = i.read()
    
    # Remove background
    output_data = remove(input_data)
    
    # Convert byte data to numpy array
    nparr = np.frombuffer(output_data, np.uint8)
    img_bgra = cv2.imdecode(nparr, cv2.IMREAD_UNCHANGED)
    
    if img_bgra is None or img_bgra.shape[2] != 4:
        print(f"Failed to process or missing alpha channel: {img_path}")
        continue
        
    # Extract alpha channel
    alpha = img_bgra[:, :, 3]
    
    # Threshold alpha channel to find solid objects
    _, thresh = cv2.threshold(alpha, 50, 255, cv2.THRESH_BINARY)
    
    # Morphological close to connect small disconnected parts within a sticker
    kernel = np.ones((15, 15), np.uint8)
    closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)
    
    # Find contours
    contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    boxes = []
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > 1000: # Ignore tiny noise
            x, y, w, h = cv2.boundingRect(cnt)
            pad = 5
            x1 = max(0, x - pad)
            y1 = max(0, y - pad)
            x2 = min(img_bgra.shape[1], x + w + pad)
            y2 = min(img_bgra.shape[0], y + h + pad)
            boxes.append((x1, y1, x2, y2))
            
    # Filter overlapping boxes
    final_boxes = []
    for b in boxes:
        x1, y1, x2, y2 = b
        keep = True
        for ob in boxes:
            if b == ob: continue
            ox1, oy1, ox2, oy2 = ob
            # if b is completely inside ob
            if x1 >= ox1 and y1 >= oy1 and x2 <= ox2 and y2 <= oy2:
                keep = False
                break
        if keep:
            final_boxes.append(b)
            
    # Save individual stickers
    for b in final_boxes:
        x1, y1, x2, y2 = b
        cropped = img_bgra[y1:y2, x1:x2]
        
        # Ensure it's not totally transparent
        if np.sum(cropped[:,:,3]) == 0:
            continue
            
        out_path = os.path.join(output_dir, f"sticker_{sticker_count}.png")
        cv2.imwrite(out_path, cropped)
        sticker_count += 1
        
    print(f"Extracted from this image. Total so far: {sticker_count}")

print(f"Total extracted stickers: {sticker_count}")

# Generate TS file
ts_content = "export const extractedStickers = [\n"
for i in range(sticker_count):
    ts_content += f"  '/stickers/sticker_{i}.png',\n"
ts_content += "];\n"

ts_path = r"C:\Users\yatma\Desktop\NOTDEFTERİ\src\features\canvas\components\stickers_data.ts"
with open(ts_path, 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"Generated {ts_path}")
