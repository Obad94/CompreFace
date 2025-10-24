import os
import requests
import json
from PIL import Image
import time
from pathlib import Path

# Configuration
API_BASE_URL = "http://localhost:8000"
API_KEY = "6b818a80-3193-4873-ad58-06d38c9a4010"  # Your Recognition Service API key
INPUT_FOLDER = "group_photos"  # Folder containing group photos
OUTPUT_FOLDER = "processed_crops"  # Folder to save cropped faces
SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff', '.webp']

# API endpoint for face recognition
RECOGNITION_ENDPOINT = f"{API_BASE_URL}/api/v1/recognition/recognize"

def create_folders():
    """Create input and output folders if they don't exist"""
    Path(INPUT_FOLDER).mkdir(exist_ok=True)
    Path(OUTPUT_FOLDER).mkdir(exist_ok=True)
    print(f"📁 Created folders:")
    print(f"   Input: {INPUT_FOLDER}/")
    print(f"   Output: {OUTPUT_FOLDER}/")

def get_image_files(folder):
    """Get all supported image files from folder"""
    image_files = []
    for file in os.listdir(folder):
        if any(file.lower().endswith(ext) for ext in SUPPORTED_FORMATS):
            image_files.append(file)
    return image_files

def call_compreface_api(image_path):
    """Call CompreFace API to detect faces"""
    try:
        with open(image_path, 'rb') as image_file:
            files = {'file': image_file}
            headers = {'x-api-key': API_KEY}
            params = {
                'limit': 0,  # No limit on faces
                'det_prob_threshold': 0.8,
                'face_plugins': 'landmarks',
                'status': True
            }
            
            print(f"🔍 Calling CompreFace API for {os.path.basename(image_path)}...")
            response = requests.post(RECOGNITION_ENDPOINT, files=files, headers=headers, params=params)
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"❌ API Error: {response.status_code} - {response.text}")
                return None
                
    except Exception as e:
        print(f"❌ Error calling API: {str(e)}")
        return None

def crop_faces_from_response(image_path, api_response, output_subfolder):
    """Crop faces based on API response"""
    try:
        # Load the original image
        img = Image.open(image_path)
        image_name = Path(image_path).stem
        
        faces_data = api_response.get('result', [])
        if not faces_data:
            print(f"   ⚠️  No faces detected in {os.path.basename(image_path)}")
            return 0
            
        print(f"   👥 Found {len(faces_data)} faces in {os.path.basename(image_path)}")
        
        # Create subfolder for this image's crops
        image_output_folder = os.path.join(OUTPUT_FOLDER, output_subfolder)
        Path(image_output_folder).mkdir(exist_ok=True)
        
        cropped_count = 0
        for i, face_data in enumerate(faces_data):
            box = face_data['box']
            subject_name = face_data['subjects'][0]['subject'] if face_data['subjects'] else "Unknown"
            similarity = face_data['subjects'][0]['similarity'] if face_data['subjects'] else 0
            confidence = box['probability']
            
            # Extract coordinates
            x_min, y_min = box['x_min'], box['y_min']
            x_max, y_max = box['x_max'], box['y_max']
            
            # Crop the face
            face_crop = img.crop((x_min, y_min, x_max, y_max))
            
            # Create descriptive filename
            filename = f"{image_name}_face_{i+1}_{subject_name}_{similarity:.3f}_conf_{confidence:.3f}.png"
            output_path = os.path.join(image_output_folder, filename)
            
            face_crop.save(output_path)
            cropped_count += 1
            
            print(f"      Face {i+1}: {subject_name} (sim: {similarity:.3f}, conf: {confidence:.3f}) -> {filename}")
            
        return cropped_count
        
    except Exception as e:
        print(f"❌ Error cropping faces: {str(e)}")
        return 0

def process_all_images():
    """Main function to process all images in input folder"""
    print("🚀 Starting Batch Face Processing...")
    print("=" * 60)
    
    # Create folders
    create_folders()
    
    # Get all image files
    image_files = get_image_files(INPUT_FOLDER)
    
    if not image_files:
        print(f"❌ No image files found in '{INPUT_FOLDER}/' folder")
        print(f"   Supported formats: {', '.join(SUPPORTED_FORMATS)}")
        print(f"   Please add some group photos to the '{INPUT_FOLDER}/' folder and try again.")
        return
    
    print(f"\n📸 Found {len(image_files)} images to process:")
    for img_file in image_files:
        print(f"   - {img_file}")
    
    # Process statistics
    total_images = len(image_files)
    processed_images = 0
    total_faces_cropped = 0
    failed_images = []
    
    print("\n" + "=" * 60)
    print("🔄 Processing Images...")
    
    for i, image_file in enumerate(image_files, 1):
        print(f"\n[{i}/{total_images}] Processing: {image_file}")
        
        image_path = os.path.join(INPUT_FOLDER, image_file)
        
        # Call CompreFace API
        api_response = call_compreface_api(image_path)
        
        if api_response:
            # Create output subfolder name (remove extension)
            output_subfolder = Path(image_file).stem
            
            # Crop faces
            faces_cropped = crop_faces_from_response(image_path, api_response, output_subfolder)
            
            if faces_cropped > 0:
                processed_images += 1
                total_faces_cropped += faces_cropped
                print(f"   ✅ Successfully processed: {faces_cropped} faces cropped")
            else:
                failed_images.append(image_file)
        else:
            failed_images.append(image_file)
            
        # Small delay to avoid overwhelming the API
        time.sleep(0.5)
    
    # Final summary
    print("\n" + "=" * 60)
    print("📊 PROCESSING SUMMARY")
    print("=" * 60)
    print(f"📸 Total images: {total_images}")
    print(f"✅ Successfully processed: {processed_images}")
    print(f"👥 Total faces cropped: {total_faces_cropped}")
    print(f"❌ Failed images: {len(failed_images)}")
    
    if failed_images:
        print(f"\n⚠️  Failed to process:")
        for failed_file in failed_images:
            print(f"   - {failed_file}")
    
    print(f"\n📁 Cropped faces saved in: '{OUTPUT_FOLDER}/' folder")
    print("🎉 Batch processing completed!")

if __name__ == "__main__":
    process_all_images()