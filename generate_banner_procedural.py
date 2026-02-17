from PIL import Image, ImageDraw, ImageFilter, ImageOps
import math

def create_procedural_banner():
    source_path = "public/graphics_archive/04_concept_v4_left_aligned_original.png"
    output_path = "public/graphics_archive/email_banner_procedural.png"
    
    print("Generating procedural banner...")
    
    # Configuration
    target_height = 1200
    target_width = 4800
    
    # Colors sampled from the image (approximate dark blue theme)
    # Center/Light color (near the cube)
    color_inner = (35, 45, 58) 
    # Outer/Dark color
    color_outer = (20, 26, 34)
    
    # 1. Create Layout Canvas
    canvas = Image.new("RGB", (target_width, target_height))
    draw = ImageDraw.Draw(canvas)
    
    # 2. Generate Gradient Background (Radial-ish)
    # We'll simulate a radial gradient centered on the left side where the cube will be
    print("Generating gradient background...")
    center_x = 600
    center_y = 600
    max_radius = math.sqrt((target_width - center_x)**2 + (target_height - center_y)**2)
    
    for y in range(target_height):
        for x in range(target_width):
            # Distance from "light source" (cube position)
            dist = math.sqrt((x - center_x)**2 + (y - center_y)**2)
            ratio = min(dist / (target_height * 1.5), 1.0) # Adjust spread
            
            # Interpolate
            r = int(color_inner[0] * (1 - ratio) + color_outer[0] * ratio)
            g = int(color_inner[1] * (1 - ratio) + color_outer[1] * ratio)
            b = int(color_inner[2] * (1 - ratio) + color_outer[2] * ratio)
            
            # Optimization: Draw pixel by pixel is slow in Python, but for 1 image it's okay-ish?
            # actually it's very slow for 4800x1200. Let's use a faster method.
            pass
            
    # Faster Gradient Method: Linear interpolation using Resize
    # Create a small gradient image and resizing it
    grad_width = 400
    grad_img = Image.new("RGB", (grad_width, 1))
    grad_draw = ImageDraw.Draw(grad_img)
    
    for x in range(grad_width):
        ratio = x / grad_width
        r = int(color_inner[0] * (1 - ratio) + color_outer[0] * ratio)
        g = int(color_inner[1] * (1 - ratio) + color_outer[1] * ratio)
        b = int(color_inner[2] * (1 - ratio) + color_outer[2] * ratio)
        grad_draw.point((x, 0), fill=(r, g, b))
        
    # Resize to fill canvas
    bg = grad_img.resize((target_width, target_height), Image.Resampling.BICUBIC)
    canvas.paste(bg, (0, 0))
    
    # 3. Add Tech Grid / Noise (Subtle)
    print("Adding aesthetic details...")
    # Horizontal line
    line_y = 1000
    draw = ImageDraw.Draw(canvas, "RGBA")
    draw.line([(0, line_y), (target_width, line_y)], fill=(255, 255, 255, 20), width=2)
    
    # 4. Extract and Place Cube
    print("Compositing cube...")
    source_img = Image.open(source_path).convert("RGBA")
    
    # Upscale source significantly to avoid pixelation on the cube
    # The cube is essentially the whole image content
    cube_size_target = 1200
    img_upscaled = source_img.resize((cube_size_target, cube_size_target), Image.Resampling.LANCZOS)
    
    # Masking: We want to fade the edges of the cube image so it blends into our generated background
    # Create a radial mask
    mask = Image.new("L", (cube_size_target, cube_size_target), 0)
    img_center = cube_size_target // 2
    radial_draw = ImageDraw.Draw(mask)
    
    # Draw a filled circle with soft edges? 
    # Let's just do a gradient mask from center
    for y in range(cube_size_target):
        for x in range(cube_size_target):
            dist = math.sqrt((x - img_center)**2 + (y - img_center)**2)
            if dist < 400:
                radial_draw.point((x,y), 255)
            elif dist < 600:
                # Fade out
                alpha = int(255 * (1 - (dist - 400) / 200))
                radial_draw.point((x,y), alpha)
            else:
                radial_draw.point((x,y), 0)
                
    # Composite
    # Place it on the left
    canvas.paste(img_upscaled, (0, 0), mask=mask)
    
    # 5. Save
    print(f"Saving to {output_path}...")
    canvas.save(output_path, dpi=(300, 300), quality=95)
    print("Done")

if __name__ == "__main__":
    create_procedural_banner()
