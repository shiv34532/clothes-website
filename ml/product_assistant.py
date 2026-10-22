#!/usr/bin/env python3
"""
AI Product Assistant Engine for Little to Large
Extracts visual characteristics from uploaded product photographs using Pillow,
generates intelligent product title, descriptions, keywords, SEO metadata,
and flags financial/stock fields requiring administrator confirmation.
100% Free & Self-Hosted. Zero Paid APIs.
"""

import sys
import os
import json
from PIL import Image

COLOR_MAP = {
    'Maroon': (128, 0, 32),
    'Burgundy': (100, 10, 30),
    'Red': (200, 30, 40),
    'Saffron': (255, 153, 51),
    'Yellow': (245, 200, 60),
    'Emerald': (16, 120, 70),
    'Green': (40, 160, 80),
    'Mint': (160, 220, 180),
    'Indigo': (40, 60, 140),
    'Royal Blue': (20, 50, 180),
    'Navy': (20, 30, 70),
    'Pink': (240, 130, 160),
    'Rose': (210, 80, 110),
    'Gold': (212, 175, 55),
    'Ivory': (250, 245, 235),
    'White': (250, 250, 250),
    'Beige': (225, 210, 185),
    'Black': (25, 25, 25)
}

def analyze_image_colors(image_path):
    """Extract dominant color palette and tones from the garment photograph."""
    try:
        with Image.open(image_path) as img:
            img = img.convert('RGB')
            # Resize small for fast color sampling
            small = img.resize((60, 60), Image.Resampling.LANCZOS)
            pixels = list(small.getdata())
            
            # Filter out near-white or near-transparent background pixels
            garment_pixels = [
                p for p in pixels 
                if not (p[0] > 240 and p[1] > 240 and p[2] > 240) and not (p[0] < 15 and p[1] < 15 and p[2] < 15)
            ]
            
            if not garment_pixels:
                garment_pixels = pixels

            # Find closest colors in COLOR_MAP
            counts = {}
            for p in garment_pixels:
                closest_name = 'Multicolor'
                min_dist = float('inf')
                for name, rgb in COLOR_MAP.items():
                    dist = ((p[0] - rgb[0])**2 + (p[1] - rgb[1])**2 + (p[2] - rgb[2])**2)**0.5
                    if dist < min_dist:
                        min_dist = dist
                        closest_name = name
                counts[closest_name] = counts.get(closest_name, 0) + 1

            sorted_colors = sorted(counts.items(), key=lambda x: x[1], reverse=True)
            dominant = [c[0] for c in sorted_colors[:3]]
            return dominant if dominant else ['Ethnic Multicolor']
    except Exception as e:
        return ['Festive Multicolor']

def detect_visual_pattern(image_path):
    """Estimate pattern based on pixel variance and standard deviation."""
    try:
        with Image.open(image_path) as img:
            gray = img.convert('L').resize((80, 80))
            pixels = list(gray.getdata())
            avg = sum(pixels) / len(pixels)
            variance = sum((p - avg) ** 2 for p in pixels) / len(pixels)
            std_dev = variance ** 0.5

            if std_dev > 50:
                return 'Intricate Floral / Hand-Block Print'
            elif std_dev > 35:
                return 'Embroidered Border / Gota Patti Work'
            elif std_dev > 20:
                return 'Woven Jacquard / Self-Textured'
            else:
                return 'Rich Solid Minimalist'
    except Exception:
        return 'Authentic Handcrafted Print'

def generate_product_metadata(image_paths, hint_category=None, hint_gender=None):
    """Generate comprehensive, professional Indian clothing metadata."""
    primary_image = image_paths[0] if image_paths else None
    
    colors = analyze_image_colors(primary_image) if primary_image else ['Maroon', 'Gold']
    pattern = detect_visual_pattern(primary_image) if primary_image else 'Embroidered'
    
    primary_color = colors[0] if colors else 'Festive'
    secondary_color = colors[1] if len(colors) > 1 else 'Antique Gold'
    
    # Infer or default category
    category = hint_category or 'Women'
    gender = hint_gender or ('Men' if category == 'Men' else ('Kids' if category == 'Kids' else 'Women'))
    
    # Determine garment type and titles
    if category == 'Women':
        garment_type = 'Anarkali Kurta & Dupatta Set'
        fabric_guess = 'Pure Chanderi Silk & Mulmul Cotton'
        occasions = ['Diwali & Dhanteras', 'Navratri Celebrations', 'Family Weddings', 'Puja Ceremonies']
        suggested_title = f"{primary_color} Handcrafted {garment_type} with {secondary_color} Accents"
        sizes = "XS, S, M, L, XL, XXL"
    elif category == 'Men':
        garment_type = 'Festive Mandarin Collar Kurta'
        fabric_guess = 'Slub Cotton & Tussar Silk Blend'
        occasions = ['Festive Evenings', 'Wedding Receptions', 'Family Gatherings', 'Religious Pujas']
        suggested_title = f"Royal {primary_color} Heritage {garment_type}"
        sizes = "S, M, L, XL, XXL"
    elif category == 'Kids':
        garment_type = 'Traditional Kurta Pyjama / Dhoti Set'
        fabric_guess = 'Breathable Organic Cotton with Soft Lining'
        occasions = ['Family Festivities', 'Naming Ceremonies', 'Birthday Celebrations', 'Cultural School Days']
        suggested_title = f"Playful {primary_color} Kids {garment_type} ({pattern})"
        sizes = "2T, 3T, 4T, 5T, 6T, 7T"
    else:
        garment_type = 'Matching Family Twinning Festive Collection'
        fabric_guess = 'Pure Cotton & Silk Blend'
        occasions = ['Family Photoshoots', 'Diwali Family Twinning', 'Festivals & Weddings']
        suggested_title = f"{primary_color} & {secondary_color} Family Coordinated Celebration Set"
        sizes = "Men: M/L/XL | Women: S/M/L | Kids: 2T-6T"

    short_desc = f"Exquisite {primary_color.lower()} {garment_type.lower()} featuring {pattern.lower()}. Tailored from {fabric_guess.lower()} for effortless elegance and lasting festive comfort."
    
    detailed_desc = (
        f"Celebrate timeless Indian heritage with this bespoke {suggested_title}. "
        f"Crafted with meticulous attention to detail, this outfit showcases {pattern.lower()} "
        f"accentuated by subtle {secondary_color.lower()} undertones. "
        f"The lightweight {fabric_guess.lower()} ensures maximum breathability, allowing you and your loved ones "
        f"to enjoy all-day wedding rituals and vibrant festival celebrations with effortless grace. "
        f"Features reinforced stitching, gentle inner seam finishing, and an authentic festive drape."
    )

    keywords = [
        f"{primary_color.lower()} {garment_type.lower()}",
        f"indian ethnic wear {category.lower()}",
        f"{fabric_guess.lower()} online india",
        "family fashion store",
        "festive clothing collection",
        "diwali wedding ethnic outfits",
        pattern.lower()
    ]

    seo_title = f"{suggested_title} | Little to Large"
    meta_description = f"Shop {suggested_title}. Crafted from {fabric_guess} with {pattern}. Free shipping across India and 7-day replacement guarantee."

    return {
        "success": True,
        "observed_visuals": {
            "dominant_colors": colors,
            "detected_pattern": pattern,
            "images_processed": len(image_paths)
        },
        "ai_suggestions": {
            "title": suggested_title,
            "short_description": short_desc,
            "detailed_description": detailed_desc,
            "category": category,
            "subcategory": "Ethnic Wear",
            "gender": gender,
            "garment_type": garment_type,
            "suggested_fabric": fabric_guess,
            "suggested_color": f"{primary_color} & {secondary_color}",
            "occasions": occasions,
            "season": "All-Season Festive",
            "search_keywords": ", ".join(keywords),
            "seo_title": seo_title,
            "meta_description": meta_description,
            "alt_text": f"{suggested_title} - Indian Family Fashion",
            "suggested_tags": f"Ethnic, Festive, {primary_color}, Handcrafted, {category}",
            "suggested_sizes": sizes
        },
        "requires_admin_confirmation": {
            "original_mrp": None,
            "selling_price": None,
            "stock_count": None,
            "sizes_in_stock": sizes,
            "return_window_days": 7
        },
        "transparency_notice": "Observed visual characteristics and descriptions were generated locally from uploaded product photos. Financial values (MRP, Selling Price) and stock inventory must be verified and confirmed by the administrator."
    }

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python product_assistant.py <image1> [<image2> ...]"}))
        sys.exit(1)

    image_paths = [arg for arg in sys.argv[1:] if not arg.startswith('--')]
    
    # Parse optional category hint
    category_hint = None
    if '--category' in sys.argv:
        idx = sys.argv.index('--category')
        if idx + 1 < len(sys.argv):
            category_hint = sys.argv[idx + 1]

    result = generate_product_metadata(image_paths, hint_category=category_hint)
    print(json.dumps(result, indent=2))
