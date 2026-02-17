from PIL import Image, ImageEnhance, ImageChops

def create_banner_v3(banner_path, text_path, output_path):
    print(f"Creating final banner...")
    
    # 1. Load Banner (8000x2000)
    banner = Image.open(banner_path).convert("RGBA")
    
    # 2. Load Text (High Res)
    text = Image.open(text_path).convert("RGBA")
    
    # 3. Crop Text to remove excess background
    # We set background to #1F2C38 (31, 44, 56) in browser
    # We want to keep the white text.
    # Let's crop to content bounding box.
    # Convert to grayscale and threshold to find content?
    # Text is White, Bg is Dark Blue.
    # Simply getbbox() on the alpha channel won't work if alpha is 255 everywhere.
    # BUT, we can mask by color difference from #1F2C38?
    # Actually, simpler: Crop by finding white pixels.
    
    # Find bounding box of white pixels
    # Threshold: anything > 200 brightness is text.
    gray = text.convert("L")
    binary = gray.point(lambda x: 255 if x > 100 else 0, mode='1')
    bbox = binary.getbbox()
    
    if bbox:
        text_cropped = text.crop(bbox)
        print(f"Cropped text to {bbox}")
    else:
        print("Warning: Could not find text bounding box!")
        text_cropped = text
        
    # 4. Resize Text relative to Banner
    # Banner Height = 2000.
    # Let's make text height about 15-20% of banner height? Or visually appealing.
    # Original SVG aspect ratio ~4.6.
    # Let's target width = 30% of banner (2400px) or height based.
    # Visually, let's say height = 300px (15% of 2000).
    target_h = int(banner.height * 0.15)
    scale = target_h / text_cropped.height
    target_w = int(text_cropped.width * scale)
    
    text_resized = text_cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # 5. Position Text
    # Vertically Center
    y_pos = (banner.height - text_resized.height) // 2
    
    # Horizontal: Left align with padding. Same padding as right (5%)?
    x_pos = int(banner.width * 0.05)
    
    # 6. Composite
    # Since text image has background color #1F2C38 and banner has same background, 
    # we can just paste.
    # However, to be cleaner, let's use the binary mask from before (resized) to make background transparent.
    # Re-create mask for resized text
    text_gray = text_resized.convert("L")
    # Improved thresholding: White text on dark bg.
    mask = text_gray.point(lambda x: 255 if x > 100 else 0, mode='1')
    
    banner.paste(text_resized, (x_pos, y_pos), mask=mask)
    
    # 7. Final Polish
    # "Podbij widocznosc kostki" - User asked again.
    # Let's crop the Right Side (where cube is) and apply a slight sharpness filter or brightness?
    # But generate_banner_v2 already did contrast enhancement.
    # Let's apply a global "Unsharp Mask" to make it crisp for 8K?
    from PIL import ImageFilter
    # Apply mild sharpening to the whole banner
    banner = banner.filter(ImageFilter.UnsharpMask(radius=2, percent=100, threshold=3))
    
    banner.save(output_path)
    print(f"Saved final v3 banner to {output_path}")

if __name__ == "__main__":
    Image.MAX_IMAGE_PIXELS = None
    create_banner_v3(
        "public/archive/assets/banner_cube.png", 
        "public/archive/assets/modMonolith_text_highres.png",
        "public/archive/assets/banner_cube.png" # Overwrite or new file? Let's overwrite as requested "zrob baner"
    )
