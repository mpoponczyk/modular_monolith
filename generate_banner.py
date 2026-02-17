from PIL import Image, ImageEnhance, ImageOps

def create_banner(input_path, output_path):
    print(f"Opening {input_path}...")
    # Open the source image
    source = Image.open(input_path).convert("RGBA")
    
    # Calculate dimensions for 4:1 banner
    # We want the source image to fil the height of the banner
    height = source.height
    width = height * 4
    
    # Create new blank image
    banner = Image.new("RGBA", (width, height), (0, 0, 0, 255))
    
    # 1. Enhance the source image (Remove fog/mist)
    # Increase contrast to cut through the mist
    enhancer = ImageEnhance.Contrast(source)
    enhanced_source = enhancer.enhance(1.4) # Increase contrast by 40%
    
    # Decrease brightness slightly to deepen blacks?
    # enhancer = ImageEnhance.Brightness(enhanced_source)
    # enhanced_source = enhancer.enhance(0.9)
    
    # 2. Place the enhanced cube on the right side
    # Calculate position: Right aligned
    x_pos = width - source.width
    banner.paste(enhanced_source, (x_pos, 0))
    
    # 3. Fill the left side with background
    # Sample a vertical strip from the left edge of the source image
    # We'll take a few pixels wide strip to be safe
    strip_width = 10
    left_strip = enhanced_source.crop((0, 0, strip_width, height))
    
    # Resize this strip to fill the remaining width
    # This stretches the background gradient across the banner
    background_fill = left_strip.resize((x_pos + 1, height))
    
    # Paste the background fill
    banner.paste(background_fill, (0, 0))
    
    # Paste the cube again on top to ensure clean edge overlap
    banner.paste(enhanced_source, (x_pos, 0), mask=enhanced_source) # Use alpha mask if available
    
    # Save result
    banner.save(output_path)
    print(f"Saved banner to {output_path}")

if __name__ == "__main__":
    create_banner("public/graphics_archive/19_concept_v19_centered_misty.png", "public/archive/assets/banner_cube.png")
