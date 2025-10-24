# Batch Face Processor

Automatically process multiple group photos and crop all detected faces using CompreFace API.

## Quick Start

### 1. Install Dependencies
```bash
python setup_requirements.py
```

### 2. Setup Folders
The script will automatically create these folders:
- `group_photos/` - Put your group photos here
- `processed_crops/` - Cropped faces will be saved here

### 3. Add Your Group Photos
Copy all your group photos into the `group_photos/` folder.

Supported formats: `.jpg`, `.jpeg`, `.png`, `.bmp`, `.gif`, `.tiff`, `.webp`

### 4. Run Batch Processing
```bash
python batch_face_processor.py
```

## What It Does

1. **Scans** the `group_photos/` folder for images
2. **Calls CompreFace API** for each image to detect faces
3. **Crops each detected face** using bounding box coordinates
4. **Saves cropped faces** in organized subfolders
5. **Shows detailed progress** and statistics

## Output Structure

```
processed_crops/
├── photo1/
│   ├── photo1_face_1_Obad_0.695_conf_0.994.png
│   ├── photo1_face_2_Abaan_0.851_conf_0.999.png
│   └── photo1_face_3_Unknown_0.000_conf_0.997.png
├── photo2/
│   ├── photo2_face_1_John_0.823_conf_0.995.png
│   └── photo2_face_2_Mary_0.756_conf_0.998.png
└── ...
```

## Filename Format
`{original_name}_face_{number}_{subject}_{similarity}_{confidence}.png`

- **original_name**: Name of source photo
- **face_number**: Sequential face number (1, 2, 3...)
- **subject**: Recognized person name (or "Unknown")
- **similarity**: Recognition confidence (0.000-1.000)
- **confidence**: Detection confidence (0.000-1.000)

## Configuration

Edit these variables in `batch_face_processor.py`:

```python
API_KEY = "your-api-key-here"          # Your CompreFace API key
INPUT_FOLDER = "group_photos"          # Input folder name
OUTPUT_FOLDER = "processed_crops"      # Output folder name
```

## Features

- ✅ **Batch processing** of multiple images
- ✅ **Automatic folder creation**
- ✅ **Face recognition** with subject names
- ✅ **Organized output** in subfolders
- ✅ **Detailed progress tracking**
- ✅ **Error handling** and retry logic
- ✅ **Processing statistics**
- ✅ **Support for all image formats**

## Example Output

```
🚀 Starting Batch Face Processing...
📁 Created folders:
   Input: group_photos/
   Output: processed_crops/

📸 Found 3 images to process:
   - family_reunion.jpg
   - birthday_party.png
   - office_team.jpg

[1/3] Processing: family_reunion.jpg
🔍 Calling CompreFace API for family_reunion.jpg...
   👥 Found 5 faces in family_reunion.jpg
      Face 1: Obad (sim: 0.695, conf: 0.994) -> family_reunion_face_1_Obad_0.695_conf_0.994.png
      Face 2: Abaan (sim: 0.851, conf: 0.999) -> family_reunion_face_2_Abaan_0.851_conf_0.999.png
      ...
   ✅ Successfully processed: 5 faces cropped

📊 PROCESSING SUMMARY
📸 Total images: 3
✅ Successfully processed: 3
👥 Total faces cropped: 15
❌ Failed images: 0

🎉 Batch processing completed!
```