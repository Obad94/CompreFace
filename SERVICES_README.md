# 🎯 The Three CompreFace Services Explained

---

## 1. 🔍 Face Detection Service  
**API Key:** `affe7c01-670b-4dff-a93f-5afc7cd4c3bd`

### 🧩 What It Does
- Finds faces in images **without identifying who they are**  
- Returns **bounding boxes** around detected faces  
- Provides **confidence scores** for each detection  
- Can analyze face attributes (**age, gender, landmarks, masks, pose**)  

### 💡 When to Use
✅ Counting people in crowds or stores  
✅ Demographic analysis (age/gender statistics)  
✅ Security monitoring (detecting if people wear masks)  
✅ Photo organization (finding images with faces)  
✅ **Your use case:** Processing group photos to crop faces  

**API Endpoint:** `POST /api/v1/detection/detect`

**Example Response:** _(not shown)_

---

## 2. 🧠 Face Recognition Service  
**API Key:** `6b818a80-3193-4873-ad58-06d38c9a4010` *(the one you've been using)*

### 🧩 What It Does
- Identifies **specific people** from a known collection  
- Requires training with **example photos of each person**  
- Returns **subject names** and **similarity scores**  
- Can manage **face collections** (add/remove people)  

### 💡 When to Use
✅ Employee identification at office entrances  
✅ VIP guest recognition at events  
✅ Attendance tracking at conferences  
✅ Security systems identifying known individuals  
✅ Photo tagging with people's names  

### ⚙️ Workflow
1. **Train:** Upload photos of known people (subjects)  
2. **Recognize:** Upload unknown photo to identify people in it  

### 🔗 API Endpoints
- `POST /api/v1/recognition/faces` → Add training photos  
- `POST /api/v1/recognition/recognize` → Identify people  

**Example Response:** _(not shown)_

---

## 3. ⚖️ Face Verification Service  
**API Key:** `f9698fb8-24c5-4a80-8ae0-dec655299c3c`

### 🧩 What It Does
- Compares **two specific faces** to check if they're the same person  
- Returns a **similarity score** between 0–1  
- **No training required** – direct comparison  
- One-to-one verification only  

### 💡 When to Use
✅ ID verification (compare photo to driver's license)  
✅ Account security (verify profile photo matches selfie)  
✅ Access control (compare live photo to stored ID photo)  
✅ Social media verification (confirm user matches their photos)  

**API Endpoint:** `POST /api/v1/verification/verify`

**Example Input:** Two images (`source_image` and `target_image`)  
**Example Response:** _(not shown)_

---

## 🔄 Key Differences Summary

| Service | Purpose | Input Required | Output | Typical Use Case |
|----------|----------|----------------|---------|------------------|
| **Detection** | Find faces | 1 image | Locations + attributes | "Where are the faces?" |
| **Recognition** | Identify people | 1 image + trained collection | Names + confidence | "Who is this person?" |
| **Verification** | Compare faces | 2 images | Similarity score | "Are these the same person?" |

---

## 📹 Video Stream & CCTV Integration

CompreFace **supports real-time video processing** including CCTV cameras, IP cameras, and live webcam feeds. Here's how to integrate it:

### 🎥 Real-Time Processing Approach

CompreFace processes **individual frames** rather than video streams directly. The workflow is:

1. **Extract frames** from video stream (using OpenCV, FFmpeg, or similar)
2. **Send frames** to CompreFace API as images
3. **Process results** in real-time
4. **Display results** with bounding boxes and names

### 🌐 Webcam Demo Example

CompreFace includes a **live webcam demo** (`docs/demos/webcam_demo.html`) that shows:

```javascript
// Capture webcam frame
navigator.mediaDevices.getUserMedia({video: {width: 640, height: 480}})
  .then(function(stream) {
    video.srcObject = stream;
    
    // Process each frame
    function processFrame() {
      ctx.drawImage(video, 0, 0, 640, 480);
      canvas.toBlob(function(blob) {
        
        // Send frame to CompreFace
        fetch('http://localhost:8000/api/v1/recognition/recognize', {
          method: "POST",
          headers: {"x-api-key": apiKey},
          body: formData
        }).then(r => r.json()).then(function(data) {
          
          // Draw bounding box and name
          if(data.result) {
            let box = data.result[0].box;
            let name = data.result[0].subjects[0].subject;
            ctx.strokeRect(box.x_min, box.y_min, 
                          box.x_max - box.x_min, box.y_max - box.y_min);
            ctx.strokeText(name, box.x_min, box.y_min - 20);
          }
          
          // Process next frame
          requestAnimationFrame(processFrame);
        });
      }, 'image/jpeg');
    }
  });
```

### 📺 CCTV Camera Integration

For **IP cameras** and **RTSP streams**, you can use:

#### **Python Integration Example:**
```python
import cv2
import requests
import base64

# Connect to RTSP stream
cap = cv2.VideoCapture('rtsp://camera_ip:port/stream')

while True:
    ret, frame = cap.read()
    if not ret:
        break
        
    # Convert frame to JPEG
    _, buffer = cv2.imencode('.jpg', frame)
    img_base64 = base64.b64encode(buffer).decode('utf-8')
    
    # Send to CompreFace
    response = requests.post(
        'http://localhost:8000/api/v1/recognition/recognize',
        headers={'x-api-key': 'your-api-key', 'Content-Type': 'application/json'},
        json={'file': img_base64}
    )
    
    # Process results
    data = response.json()
    for face in data.get('result', []):
        box = face['box']
        subject = face.get('subjects', [{}])[0].get('subject', 'Unknown')
        
        # Draw bounding box
        cv2.rectangle(frame, (box['x_min'], box['y_min']), 
                     (box['x_max'], box['y_max']), (0, 255, 0), 2)
        cv2.putText(frame, subject, (box['x_min'], box['y_min']-10), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
    
    # Display result
    cv2.imshow('CCTV Recognition', frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
```

### ⚡ Performance Considerations

**For Real-Time Processing:**

✅ **Use GPU builds** for better performance (`custom-builds/` folder)  
✅ **Reduce frame rate** (process every 2nd or 3rd frame)  
✅ **Lower resolution** for faster processing  
✅ **Multiple API servers** for high-throughput scenarios  
✅ **Async processing** to avoid blocking  

**Recommended Setup:**
- **Detection Service**: For crowd counting, mask detection
- **Recognition Service**: For identifying specific individuals
- **Custom GPU Build**: For real-time processing (see `/custom-builds/`)

### 🏗️ Production Architecture

For **large-scale CCTV systems**:

```
[CCTV Cameras] → [Frame Extractor] → [Load Balancer] → [CompreFace API Cluster]
                                                     ↓
[Alert System] ← [Database] ← [Result Processor] ← [Recognition Results]
```

**Key Components:**
- **Frame Extractor**: OpenCV/FFmpeg to extract frames from RTSP
- **Load Balancer**: Distribute requests across multiple CompreFace instances  
- **GPU Nodes**: Run CompreFace with GPU acceleration
- **Result Processor**: Handle recognition results and trigger alerts
- **Database**: Store identifications and generate reports

### 🚀 Getting Started with Video Streams

1. **Start with webcam demo**: `docs/demos/webcam_demo.html`
2. **Test with your camera**: Use Python + OpenCV
3. **Scale up**: Use GPU builds and multiple API servers
4. **Production**: Implement proper architecture with load balancing

**CompreFace is ideal for real-time surveillance and CCTV systems!** 🎯
