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
| **Detection** | Find faces | 1 image | Locations + attributes | “Where are the faces?” |
| **Recognition** | Identify people | 1 image + trained collection | Names + confidence | “Who is this person?” |
| **Verification** | Compare faces | 2 images | Similarity score | “Are these the same person?” |
