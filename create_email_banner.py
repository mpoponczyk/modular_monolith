from PIL import Image, ImageFilter
import os

def create_email_banner():
    source_path = "public/graphics_archive/04_concept_v4_left_aligned_original.png"
    output_path = "public/graphics_archive/email_banner_4_1_highres.png"
    
    print(f"Processing {source_path}...")
    
    try:
        # 1. Load Image
        img = Image.open(source_path).convert("RGB") # Source is likely JPEG/RGB
        
        # 2. Upscale
        # Target height = 1200px (to be safe for high res screens)
        # 4:1 ratio means width should be 4800px.
        target_height = 1200
        aspect_ratio = img.width / img.height
        new_width_from_scaling = int(target_height * aspect_ratio)
        
        print(f"Upscaling from {img.width}x{img.height} to {new_width_from_scaling}x{target_height}...")
        
        img_upscaled = img.resize((new_width_from_scaling, target_height), Image.Resampling.LANCZOS)
        
        # 3. Create Canvas
        target_width_total = target_height * 4 # 4800px
        canvas = Image.new("RGB", (target_width_total, target_height))
        
        # 4. Paste Image (Left Aligned)
        canvas.paste(img_upscaled, (0, 0))
        
        # 5. Extend Background
        # We'll take the last column of pixels and repeat it to fill the rest.
        remaining_width = target_width_total - new_width_from_scaling
        
        if remaining_width > 0:
            print(f"Extending background by {remaining_width} pixels...")
            
            # Get the last column of pixels
            last_column = img_upscaled.crop((img_upscaled.width - 1, 0, img_upscaled.width, target_height))
            
            # Resize it to fill the remaining space (stretching the 1px width to remaining_width)
            # This effectively repeats the gradient/color horizontally
            extension = last_column.resize((remaining_width, target_height), Image.Resampling.NEAREST) 
            
            # Paste it
            canvas.paste(extension, (new_width_from_scaling, 0))
            
            # Optional: Blur the seam slightly to hide any hard edge if the source had noise
            # Only blur the transition area
            seam_x = new_width_from_scaling
            seam_width = 20
            if seam_x - 10 > 0 and seam_x + 10 < target_width_total:
                box = (seam_x - 10, 0, seam_x + 10, target_height)
                seam_region = canvas.crop(box)
                seam_blurred = seam_region.filter(ImageFilter.GaussianBlur(radius=2))
                canvas.paste(seam_blurred, box)
        
        # 6. Save with High Quality and DPI
        print(f"Saving to {output_path} with 300 DPI...")
        canvas.save(output_path, dpi=(300, 300), quality=95, optimize=True)
        
        print("Done!")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_email_banner()
