import cv2
import numpy as np

img_path = r"C:\Users\yatma\.gemini\antigravity\brain\7c5e6ff9-7d30-4cb7-848e-677070be0813\media__1782761144277.jpg"
img = cv2.imread(img_path)
h, w = img.shape[:2]

max_dim = 1200
if h > max_dim or w > max_dim:
    scale = max_dim / max(h, w)
    img = cv2.resize(img, (int(w * scale), int(h * scale)))
    h, w = img.shape[:2]

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
blurred = cv2.GaussianBlur(gray, (5, 5), 0)
edges = cv2.Canny(blurred, 30, 100)

contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

boxes = []
for cnt in contours:
    x, y, bw, bh = cv2.boundingRect(cnt)
    if bw > 10 and bh > 10 and bw < w * 0.9 and bh < h * 0.9:
        boxes.append([x, y, x + bw, y + bh])

def rect_distance(b1, b2):
    # Calculates distance between two rectangles
    x1_1, y1_1, x2_1, y2_1 = b1
    x1_2, y1_2, x2_2, y2_2 = b2
    
    left = x2_1 < x1_2
    right = x1_1 > x2_2
    bottom = y2_1 < y1_2
    top = y1_1 > y2_2
    
    if top and left: return np.hypot(x1_2 - x2_1, y2_1 - y1_2)
    elif left and bottom: return np.hypot(x1_2 - x2_1, y1_1 - y2_2)
    elif bottom and right: return np.hypot(x1_1 - x2_2, y1_1 - y2_2)
    elif right and top: return np.hypot(x1_1 - x2_2, y2_1 - y1_2)
    elif left: return x1_2 - x2_1
    elif right: return x1_1 - x2_2
    elif bottom: return y1_1 - y2_2
    elif top: return y2_1 - y1_2
    else: return 0 # Intersecting

threshold_dist = 25 # pixels

while True:
    merged = False
    new_boxes = []
    used = set()
    for i in range(len(boxes)):
        if i in used: continue
        box_i = boxes[i]
        for j in range(i + 1, len(boxes)):
            if j in used: continue
            if rect_distance(box_i, boxes[j]) < threshold_dist:
                # Merge
                box_j = boxes[j]
                merged_box = [
                    min(box_i[0], box_j[0]),
                    min(box_i[1], box_j[1]),
                    max(box_i[2], box_j[2]),
                    max(box_i[3], box_j[3])
                ]
                box_i = merged_box
                used.add(j)
                merged = True
        new_boxes.append(box_i)
    
    boxes = new_boxes
    if not merged:
        break

vis = img.copy()
count = 0
for b in boxes:
    x1, y1, x2, y2 = b
    bw = x2 - x1
    bh = y2 - y1
    if bw > 30 and bh > 30: # Final filter
        cv2.rectangle(vis, (x1, y1), (x2, y2), (0, 255, 0), 2)
        count += 1

cv2.imwrite("test_cluster.jpg", vis)
print(f"Found {count} stickers with clustering")
