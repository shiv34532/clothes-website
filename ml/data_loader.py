"""
Data loader module for Little to Large clothing catalog.
Extracts products directly from SQLite database (little_to_large.db)
and prepares normalized feature strings for recommendation and search.
"""

import os
import sqlite3
import json
from typing import List, Dict, Any, Optional

DEFAULT_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "little_to_large.db")

def get_db_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    target = db_path or DEFAULT_DB_PATH
    if not os.path.exists(target):
        raise FileNotFoundError(f"Database not found at {target}")
    conn = sqlite3.connect(target)
    conn.row_factory = sqlite3.Row
    return conn

def load_products_from_db(db_path: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Load all products from little_to_large.db into structured dictionaries.
    """
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, name, category, subcategory, price, discount_price,
               stock, description, size_variants, image_urls, rating,
               fabric, color, style, gender, return_window_days
        FROM products
        ORDER BY id ASC
    """)
    rows = cursor.fetchall()
    conn.close()

    products = []
    for r in rows:
        item = dict(r)
        # Parse image_urls
        try:
            item["image_urls"] = json.loads(item["image_urls"]) if item["image_urls"] else []
        except Exception:
            item["image_urls"] = []
        
        # Build normalized feature representation for TF-IDF / search
        tokens = [
            str(item.get("name") or ""),
            str(item.get("category") or ""),
            str(item.get("subcategory") or ""),
            str(item.get("fabric") or ""),
            str(item.get("color") or ""),
            str(item.get("style") or ""),
            str(item.get("gender") or ""),
            str(item.get("description") or "")
        ]
        item["feature_text"] = " ".join([t.strip() for t in tokens if t.strip()]).lower()
        products.append(item)
    return products

if __name__ == "__main__":
    items = load_products_from_db()
    print(f"Loaded {len(items)} products from database.")
    if items:
        print(f"Sample: ID {items[0]['id']} - {items[0]['name']}")
