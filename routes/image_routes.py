import os
from flask import Blueprint, request, jsonify, current_app
from services.image_forensics import analyze_image_file, generate_sample_images

image_bp = Blueprint('image', __name__)

@image_bp.route('/api/analyze/image', methods=['POST'])
def api_analyze_image():
    # Check if analyzing built-in samples
    if request.is_json:
        data = request.json
        sample = data.get("sample")
        
        img_dir = os.path.join(current_app.static_folder, 'images')
        if sample == 'gps_exif':
            filepath = os.path.join(img_dir, 'sample_exif.jpg')
            filename = 'sample_exif.jpg'
        elif sample == 'stego_hidden':
            filepath = os.path.join(img_dir, 'sample_stego.png')
            filename = 'sample_stego.png'
        else:
            return jsonify({"error": "Unknown sample request"}), 400
            
        if not os.path.exists(filepath):
            generate_sample_images(current_app.static_folder)
            
        try:
            with open(filepath, 'rb') as f:
                file_bytes = f.read()
            result = analyze_image_file(file_bytes, filename)
            return jsonify(result)
        except Exception as e:
            return jsonify({"error": f"Failed to analyze sample image: {str(e)}"}), 500
            
    # Handle direct file uploads
    if 'image' not in request.files:
        return jsonify({"error": "No image file uploaded"}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "Empty file name"}), 400
        
    ext = file.filename.rsplit('.', 1)[-1].lower() if '.' in file.filename else ''
    if ext not in ['jpg', 'jpeg', 'png']:
        return jsonify({"error": "Unsupported file format. Please upload JPG, JPEG, or PNG images."}), 400
        
    try:
        file_bytes = file.read()
        result = analyze_image_file(file_bytes, file.filename)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 400
