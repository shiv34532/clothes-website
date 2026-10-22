"""
Unified Command-Line JSON Interface for Little to Large ML Services.
Allows Node.js / external processes to execute ML operations and receive typed JSON outputs.
"""

import sys
import os
import json
import argparse

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.recommend import RecommendationEngine
from ml.search import SmartSearchEngine
from ml.size_advisor import recommend_size
from ml.forecast import calculate_inventory_forecast


def main():
    parser = argparse.ArgumentParser(description="Little to Large ML CLI")
    subparsers = parser.add_subparsers(dest="command")

    # Command: recommend
    rec_parser = subparsers.add_parser("recommend")
    rec_parser.add_argument("--id", type=int, required=True, help="Target product ID")
    rec_parser.add_argument("--type", type=str, default="similar", choices=["similar", "complementary"])
    rec_parser.add_argument("--limit", type=int, default=4)

    # Command: search
    search_parser = subparsers.add_parser("search")
    search_parser.add_argument("--query", type=str, required=True, help="Search query")
    search_parser.add_argument("--limit", type=int, default=12)

    # Command: suggestions
    sug_parser = subparsers.add_parser("suggestions")
    sug_parser.add_argument("--prefix", type=str, default="")
    sug_parser.add_argument("--limit", type=int, default=5)

    # Command: size
    size_parser = subparsers.add_parser("size")
    size_parser.add_argument("--category", type=str, default="Women")
    size_parser.add_argument("--chest", type=float, default=None)
    size_parser.add_argument("--waist", type=float, default=None)
    size_parser.add_argument("--height", type=float, default=None)
    size_parser.add_argument("--age", type=float, default=None)
    size_parser.add_argument("--fit", type=str, default="regular", choices=["slim", "regular", "relaxed"])

    # Command: forecast
    subparsers.add_parser("forecast")

    # Command: analyze (Product Metadata Assistant)
    analyze_parser = subparsers.add_parser("analyze")
    analyze_parser.add_argument("--images", nargs="+", required=True, help="Paths to uploaded product images")
    analyze_parser.add_argument("--category", type=str, default=None, help="Optional category hint")

    # Command: studio_clean (Background Removal & Studio Normalization)
    clean_parser = subparsers.add_parser("studio_clean")
    clean_parser.add_argument("--input", type=str, required=True, help="Input garment image")
    clean_parser.add_argument("--output", type=str, required=True, help="Output image destination")
    clean_parser.add_argument("--preset", type=str, default="studio_white", choices=["studio_white", "festive_cream", "royal_parchment", "transparent"])

    # Command: studio_concepts (5 Model-Worn Visual Concepts)
    concept_parser = subparsers.add_parser("studio_concepts")
    concept_parser.add_argument("--input", type=str, required=True, help="Input garment image")
    concept_parser.add_argument("--outdir", type=str, required=True, help="Output directory for concepts")
    concept_parser.add_argument("--title", type=str, default="Festive Ethnic Garment")

    # Command: video (10-Second Deterministic Product Video)
    video_parser = subparsers.add_parser("video")
    video_parser.add_argument("--output", type=str, required=True, help="Output video path")
    video_parser.add_argument("--images", nargs="+", required=True, help="Image paths")
    video_parser.add_argument("--title", type=str, default="Festive Indian Garment")
    video_parser.add_argument("--price", type=float, default=1999)
    video_parser.add_argument("--discount", type=float, default=1499)

    # Command: assistant_marketing
    mkt_parser = subparsers.add_parser("assistant_marketing")
    mkt_parser.add_argument("--campaign", type=str, default="Diwali & Dhanteras Festive Dhamaka")
    mkt_parser.add_argument("--category", type=str, default="Family Matching Ethnic Wear")

    # Command: assistant_reply
    reply_parser = subparsers.add_parser("assistant_reply")
    reply_parser.add_argument("--subject", type=str, required=True)
    reply_parser.add_argument("--message", type=str, required=True)
    reply_parser.add_argument("--customer", type=str, default="Valued Customer")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    try:
        if args.command == "recommend":
            engine = RecommendationEngine()
            if args.type == "complementary":
                results = engine.get_complementary_outfits(args.id, limit=args.limit)
            else:
                results = engine.get_similar_products(args.id, limit=args.limit)
            print(json.dumps({"success": True, "type": args.type, "product_id": args.id, "results": results}))

        elif args.command == "search":
            searcher = SmartSearchEngine()
            results = searcher.search(args.query, limit=args.limit)
            print(json.dumps({"success": True, **results}))

        elif args.command == "suggestions":
            searcher = SmartSearchEngine()
            suggestions = searcher.get_query_suggestions(args.prefix, max_suggestions=args.limit)
            print(json.dumps({"success": True, "prefix": args.prefix, "suggestions": suggestions}))

        elif args.command == "size":
            res = recommend_size(
                category=args.category,
                user_chest=args.chest,
                user_waist=args.waist,
                user_height_cm=args.height,
                user_age_years=args.age,
                fit_preference=args.fit
            )
            print(json.dumps(res))

        elif args.command == "forecast":
            forecast = calculate_inventory_forecast()
            print(json.dumps({"success": True, "total_skus": len(forecast), "forecast": forecast}))

        elif args.command == "analyze":
            from ml.product_assistant import generate_product_metadata
            res = generate_product_metadata(args.images, hint_category=args.category)
            print(json.dumps(res))

        elif args.command == "studio_clean":
            from ml.image_studio import remove_background_and_compose
            res = remove_background_and_compose(args.input, args.output, bg_preset=args.preset)
            print(json.dumps(res))

        elif args.command == "studio_concepts":
            from ml.image_studio import generate_five_visual_concepts
            res = generate_five_visual_concepts(args.input, args.outdir, product_name=args.title)
            print(json.dumps(res))

        elif args.command == "video":
            from ml.video_generator import create_ten_second_product_video
            res = create_ten_second_product_video(args.images, args.output, title=args.title, price=args.price, discount_price=args.discount)
            print(json.dumps(res))

        elif args.command == "assistant_marketing":
            campaign = args.campaign
            cat = args.category
            copy_templates = {
                "headline": f"Celebrate Togetherness: {campaign}",
                "tagline": f"Dress every generation in matching handcrafted elegance with our {cat}.",
                "social_caption": f"Festivals are sweeter when the entire family shines together! ✨ Discover our all-new {cat} collection crafted from breathable festive silks and rich cottons. Tap the link in bio to shop now with Flat 10% OFF code: FAMILY10 🪔✨ #LittleToLarge #IndianFamilyFashion #EthnicWear #FestiveOutfit",
                "email_subject": f"🪔 Special Festive Invitation: Discover {campaign} at Little to Large",
                "recommended_channels": ["Instagram Reels & Carousel", "WhatsApp Broadcast", "Email Newsletter"]
            }
            print(json.dumps({"success": True, "campaign": campaign, "category": cat, "drafts": copy_templates}))

        elif args.command == "assistant_reply":
            subj = args.subject
            msg = args.message
            cust = args.customer
            first_name = cust.split()[0] if cust else "Customer"

            if "size" in subj.lower() or "fit" in subj.lower() or "size" in msg.lower():
                reply = (
                    f"Namaste {first_name},\n\n"
                    f"Thank you for contacting Little to Large! For ethnic kurtas and festive sets, "
                    f"we recommend measuring across the fullest part of your chest. We tailor our garments with a standard 3 to 4-inch ease allowance "
                    f"for comfort during long family celebrations. You can also utilize our interactive 'Size & Fit Advisor' on any product page. "
                    f"If you'd like a personalized fit check, simply share your chest and height measurements and we will be delighted to guide you!\n\n"
                    f"Warm regards,\nCustomer Care Team | Little to Large"
                )
            elif "return" in subj.lower() or "exchange" in subj.lower() or "replacement" in subj.lower():
                reply = (
                    f"Namaste {first_name},\n\n"
                    f"Thank you for reaching out to us. At Little to Large, we want your entire family to feel completely confident in what you wear. "
                    f"We offer a hassle-free 7-day replacement window from the date of delivery. If you need a size exchange or different color, "
                    f"please keep the item unworn with original tags attached, and reply with your order number so we can arrange an easy courier pickup for you.\n\n"
                    f"Warm regards,\nCustomer Care Team | Little to Large"
                )
            else:
                reply = (
                    f"Namaste {first_name},\n\n"
                    f"Thank you for writing to Little to Large! We have received your inquiry regarding '{subj}' and our support team is looking into this. "
                    f"We strive to resolve every family inquiry within 24 business hours. If this is urgent regarding an order in transit, "
                    f"you may also reach our helpline directly at +91 7383874045.\n\n"
                    f"Warm regards,\nCustomer Care Team | Little to Large"
                )
            print(json.dumps({"success": True, "suggested_reply": reply, "policy_referenced": "7-Day Replacement / Size Ease Guidelines"}))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()

