#!/usr/bin/env python3
"""
10-Second Deterministic Product Video / Animation Generator for Little to Large
Generates lightweight, responsive 10-second animated product showcase assets
using Pillow without requiring heavy external GPU dependencies.
100% Free, Local & Deterministic.
"""

import sys
import os
import json
import warnings
warnings.filterwarnings('ignore')
from PIL import Image, ImageDraw, ImageFilter

def create_ten_second_product_video(
    image_paths, 
    output_path, 
    title="Festive Indian Garment", 
    price=1999, 
    discount_price=1499,
    campaign_tag="Diwali & Festive Special"
):
    """
    Composes a 10-second animated video showcase (20 frames x 500ms = 10,000ms).
    Sequence:
    - Frames 1-4 (0-2s): Brand Hero Intro ("Little to Large Festive Spotlight") + Garment Reveal
    - Frames 5-8 (2-4s): Close-up Pan & Craftsmanship Highlight
    - Frames 9-12 (4-6s): Second Angle / Alternate View & Styling Note
    - Frames 13-16 (6-8s): Price & Discount Showcase (MRP crossed out + bold price)
    - Frames 17-20 (8-10s): Call to Action ("Shop Now at Little to Large | Free Shipping Across India")
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    
    # Load available images
    loaded_imgs = []
    for p in image_paths:
        if os.path.exists(p):
            try:
                loaded_imgs.append(Image.open(p).convert('RGBA'))
            except Exception:
                pass
    
    if not loaded_imgs:
        raise ValueError("No valid image files provided for video generation.")

    primary_img = loaded_imgs[0]
    secondary_img = loaded_imgs[1] if len(loaded_imgs) > 1 else primary_img

    frames = []
    canvas_size = (1080, 1080)

    # Color tokens
    burgundy = (136, 19, 55)
    gold = (212, 175, 55)
    cream = (250, 248, 245)
    charcoal = (30, 27, 75)

    discount_pct = 0
    if price and discount_price and price > discount_price:
        discount_pct = round(((price - discount_price) / price) * 100)

    # Generate 20 frames (each 500ms)
    for i in range(20):
        frame = Image.new('RGB', canvas_size, cream)
        draw = ImageDraw.Draw(frame)

        # Draw outer luxury borders
        draw.rectangle([25, 25, 1055, 1055], outline=gold, width=3)
        draw.rectangle([35, 35, 1045, 1045], outline=gold, width=1)

        # Header Banner (All frames)
        draw.rectangle([40, 40, 1040, 130], fill=burgundy)
        draw.text((1080 // 2, 70), "LITTLE TO LARGE", fill=(255, 255, 255), anchor="mm")
        draw.text((1080 // 2, 105), f"✨ {campaign_tag} ✨", fill=gold, anchor="mm")

        # Determine which stage of video
        if i < 4:
            # Stage 1: Brand reveal & hero garment zoom
            scale_factor = 0.72 + (i * 0.02)
            cur_img = primary_img
            caption = "Handcrafted Indian Family Collection"
        elif i < 8:
            # Stage 2: Craftsmanship & texture focus
            scale_factor = 0.80 + ((i - 4) * 0.02)
            cur_img = primary_img
            caption = "Premium Breathable Fabrics & Pure Festive Comfort"
        elif i < 12:
            # Stage 3: Secondary angle / details
            scale_factor = 0.78
            cur_img = secondary_img
            caption = "Tailored for Weddings, Pujas & Family Celebrations"
        elif i < 16:
            # Stage 4: Price & Value badge
            scale_factor = 0.75
            cur_img = primary_img
            caption = f"Special Festive Offer: Flat {discount_pct}% OFF Today!"
        else:
            # Stage 5: Final Call to Action
            scale_factor = 0.72
            cur_img = primary_img
            caption = "📦 Free Delivery Across India | 7-Day Easy Replacement"

        # Resize and place garment
        gw, gh = cur_img.size
        max_h = int(1080 * scale_factor)
        r = max_h / max(gw, gh)
        nw, nh = int(gw * r), int(gh * r)
        res_garment = cur_img.resize((nw, nh), Image.Resampling.LANCZOS)
        
        gx = (1080 - nw) // 2
        gy = 145 + (720 - nh) // 2

        # Contact shadow
        shadow = Image.new('RGBA', (int(nw * 0.7), 40), (0, 0, 0, 0))
        sh_d = ImageDraw.Draw(shadow)
        sh_d.ellipse([0, 0, int(nw * 0.7), 40], fill=(40, 30, 30, 45))
        shadow = shadow.filter(ImageFilter.GaussianBlur(10))
        frame.paste(shadow, (gx + int(nw * 0.15), gy + nh - 25), shadow)

        # Paste garment
        frame.paste(res_garment, (gx, gy), res_garment)

        # Stage 4 overlay: Big Price Card
        if 12 <= i < 16:
            draw.rectangle([180, 740, 900, 890], fill=(255, 255, 255), outline=burgundy, width=2)
            disp_price = discount_price or price
            draw.text((1080 // 2, 785), f"PRICE: ₹{disp_price}", fill=burgundy, anchor="mm")
            if discount_price and price:
                draw.text((1080 // 2, 840), f"MRP: ₹{price} ({discount_pct}% OFF)", fill=(100, 116, 139), anchor="mm")

        # Bottom Title & CTA Banner
        draw.rectangle([40, 920, 1040, 1035], fill=charcoal)
        # Shorten title if too long
        disp_title = (title[:48] + '...') if len(title) > 48 else title
        draw.text((1080 // 2, 955), disp_title, fill=(255, 255, 255), anchor="mm")
        draw.text((1080 // 2, 995), caption, fill=gold, anchor="mm")

        # Timeline progress bar at very bottom
        progress_w = int((i + 1) / 20 * (1040 - 40))
        draw.rectangle([40, 1035, 40 + progress_w, 1045], fill=gold)

        frames.append(frame)

    # Save as high-efficiency animated WebP (20 frames x 500ms = 10.0 seconds total loop)
    frames[0].save(
        output_path,
        save_all=True,
        append_images=frames[1:],
        duration=500,
        loop=0,
        quality=88
    )

    return {
        "success": True,
        "video_path": output_path,
        "duration_seconds": 10.0,
        "total_frames": len(frames),
        "frame_delay_ms": 500,
        "resolution": "1080x1080",
        "format": "Animated WebP Video Container (Compatible with 100% of modern browsers)",
        "file_size_bytes": os.path.getsize(output_path)
    }

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Usage: python video_generator.py <out_path> <image1> [<image2>...] [--title '...'] [--price 1999] [--discount 1499]"}))
        sys.exit(1)

    out_file = sys.argv[1]
    raw_args = sys.argv[2:]

    images = []
    title = "Festive Indian Garment"
    price = 1999
    discount = 1499

    i = 0
    while i < len(raw_args):
        arg = raw_args[i]
        if arg == '--title' and i + 1 < len(raw_args):
            title = raw_args[i + 1]
            i += 2
        elif arg == '--price' and i + 1 < len(raw_args):
            price = float(raw_args[i + 1])
            i += 2
        elif arg == '--discount' and i + 1 < len(raw_args):
            discount = float(raw_args[i + 1])
            i += 2
        else:
            if not arg.startswith('--'):
                images.append(arg)
            i += 1

    try:
        res = create_ten_second_product_video(images, out_file, title=title, price=price, discount_price=discount)
        print(json.dumps(res, indent=2))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)
