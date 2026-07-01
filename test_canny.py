import cv2
import numpy as np

img_path = r"C:\Users\yatma\.gemini\antigravity\brain\7c5e6ff9-7d30-4cb7-848e-677070be0813\media__1782761144277.jpg"

img = cv2.imread(img_path)
height, width = img.shape[:2]

max_dim = 1000
if height > max_dim or width > max_dim:
    scale = max_dim / max(height, width)
    img = cv2.resize(img, (int(width * scale), int(height * scale)))

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
blurred = cv2.GaussianBlur(gray, (5, 5), 0)
edges = cv2.Canny(blurred, 50, 150)

# Apply a very mild dilation so edges connect, but don't merge everything
kernel = np.ones((5,5), np.uint8)
dilated = cv2.dilate(edges, kernel, iterations=1)

contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

vis_img = img.copy()
count = 0
for cnt in contours:
    x, y, w, h = cv2.boundingRect(cnt)
    if w > 30 and h > 30 and w < width * 0.9 and h < height * 0.9:
        cv2.rectangle(vis_img, (x, y), (x+w, y+h), (0, 255, 0), 2)
        count += 1

cv2.imwrite("test_canny.jpg", vis_img)
print(f"Found {count} contours using Canny")
