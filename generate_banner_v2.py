from PIL import Image, ImageEnhance, ImageDraw
import numpy as np

def create_banner_v2(cube_path, source_style_path, output_path):
    print(f"Creating banner using cube from {cube_path}...")
    
    # 1. Target Dimensions
    # We want a high-res banner. Let's go for Height = 2000px.
    BANNER_H = 2000
    BANNER_W = BANNER_H * 4
    
    # 2. Analyze Background Color from source style
    style_img = Image.open(source_style_path).convert("RGB")
    # Sample the top-left corner region to get the background color
    sample = style_img.crop((0, 0, 100, 100))
    # Average color
    avg_color = np.array(sample).mean(axis=(0,1))
    bg_color = tuple(avg_color.astype(int))
    print(f"Detected background color: {bg_color}")
    
    # 3. Create Canvas
    banner = Image.new("RGBA", (BANNER_W, BANNER_H), bg_color + (255,))
    
    # Optional: Add a subtle gradient to transparent to let the color breathe?
    # Or just keep it solid for "homogeneity" as requested.
    # User said "non-homogeneous" was bad. So solid is safer.
    
    # 4. Load and Process Cube
    cube = Image.open(cube_path).convert("RGBA")
    
    # Enhance contrast as requested ("podbij widocznosc")
    enhancer = ImageEnhance.Contrast(cube)
    cube = enhancer.enhance(1.2)
    
    # Resize Cube
    # User wants it "bigger" and "not cut".
    # Max height = BANNER_H.
    # Let's use 90% of height to leave a small breathing room but make it huge.
    cube_h = int(BANNER_H * 0.95)
    scale_factor = cube_h / cube.height
    cube_w = int(cube.width * scale_factor)
    
    cube = cube.resize((cube_w, cube_h), Image.Resampling.LANCZOS)
    
    # 5. Positioning
    # "Right side".
    # Let's align it to the right with some padding.
    padding_right = int(BANNER_W * 0.05) # 5% padding
    x_pos = BANNER_W - cube_w - padding_right
    
    # Center vertically
    y_pos = (BANNER_H - cube_h) // 2
    
    # Paste
    banner.paste(cube, (x_pos, y_pos), mask=cube)
    
    # 6. Upscaling?
    # The banner is already 8000x2000. That's effectively "Ultra 8K" width.
    # No further upscaling needed.
    
    banner.save(output_path)
    print(f"Saved v2 banner to {output_path}")

if __name__ == "__main__":
    # Increase Limit for 8K processing
    Image.MAX_IMAGE_PIXELS = None
    create_banner_v2(
        "public/archive/assets/Cube.png", 
        "public/graphics_archive/19_concept_v19_centered_misty.png",
        "public/archive/assets/banner_cube.png"
    )
