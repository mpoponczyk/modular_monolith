from PIL import Image, ImageFilter, ImageDraw
import numpy as np

def create_banner_v4():
    source_path = "public/graphics_archive/04_concept_v4_left_aligned_original.png"
    output_path = "public/graphics_archive/email_banner_v4.png"
    
    print(f"Processing {source_path}...")
    
    try:
        # 1. Load Image
        img = Image.open(source_path).convert("RGBA")
        
        # 2. Upscale (High Quality)
        # Target height = 1200px
        target_height = 1200
        aspect_ratio = img.width / img.height
        new_width_from_scaling = int(target_height * aspect_ratio)
        
        print(f"Upscaling to {new_width_from_scaling}x{target_height}...")
        img = img.resize((new_width_from_scaling, target_height), Image.Resampling.LANCZOS)
        
        # 3. Create Canvas (4:1 Ratio)
        target_width_total = target_height * 4 # 4800px
        canvas = Image.new("RGBA", (target_width_total, target_height), (0,0,0,0))
        
        # 4. Analyze Background Color at the Edge
        # Take a strip at the right edge
        edge_width = 20
        edge_strip = img.crop((img.width - edge_width, 0, img.width, img.height))
        
        # Calculate average color of the edge strip
        # We can just resize it to 1x1 to get an average color!
        avg_color_img = edge_strip.resize((1, 1), Image.Resampling.BOX)
        avg_color = avg_color_img.getpixel((0, 0))
        print(f"Detected background extension color: {avg_color}")
        
        # 5. Fill Canvas with Background Color
        # We create a solid background layer
        bg_layer = Image.new("RGBA", (target_width_total, target_height), avg_color)
        canvas.paste(bg_layer, (0, 0))
        
        # 6. Paste Image with Soft Blend
        # We want to paste the image on the left, but fade it out on the right edge so it blends into the BG
        # Create a mask for the image
        mask = Image.new("L", (img.width, img.height), 255)
        
        # Create a gradient for the fade out at the rightmost part of the image
        fade_length = 150 # pixels over which to fade
        draw = ImageDraw.Draw(mask)
        
        for x in range(img.width - fade_length, img.width):
            # linear fade from 255 to 0
            alpha = int(255 * (1 - (x - (img.width - fade_length)) / fade_length))
            draw.line([(x, 0), (x, target_height)], fill=alpha)
            
        canvas.paste(img, (0, 0), mask=mask)
        
        # 7. Final Output
        # Convert to RGB to save as PNG (drop alpha if not needed, but keeping for safety if transparent parts exist)
        # Actually email readers behave better with flat RGB usually, but if we have transparency we need RGBA.
        # The prompt implies a "banner", usually opaque. Let's stick to RGB for the final save to enable optimization.
        final_rgb = canvas.convert("RGB")
        
        print(f"Saving to {output_path} with 300 DPI...")
        final_rgb.save(output_path, dpi=(300, 300), quality=95, optimize=True)
        print("Done!")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    create_banner_v4()
