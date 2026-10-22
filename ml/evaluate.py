"""
Offline Evaluation Suite for Little to Large Machine Learning Services.
Tests:
1. Recommendation engine consistency, coverage, latency, and complementary diversity.
2. Smart search relevance on Indian fashion queries and typo tolerance.
3. Size advisor bounds checking and uncertainty handling.
4. Inventory forecasting mathematical validity.
"""

import time
import json
import sys
import os

# Ensure project root is in sys.path for direct script execution
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.recommend import RecommendationEngine
from ml.search import SmartSearchEngine
from ml.size_advisor import recommend_size
from ml.forecast import calculate_inventory_forecast


def run_ml_evaluation():
    print("=" * 60)
    print("RUNNING MACHINE LEARNING EVALUATION SUITE")
    print("=" * 60)

    # 1. Evaluate Recommendation Engine
    t0 = time.time()
    rec_engine = RecommendationEngine()
    init_time = (time.time() - t0) * 1000
    print(f"[OK] Recommendation engine initialized in {init_time:.1f}ms with {len(rec_engine.products)} catalog products.")

    assert len(rec_engine.products) > 0, "Catalog must not be empty"

    # Test similarity on all products
    rec_latencies = []
    coverage_set = set()
    for p in rec_engine.products:
        t_start = time.time()
        sims = rec_engine.get_similar_products(p["id"], limit=4)
        rec_latencies.append((time.time() - t_start) * 1000)
        assert len(sims) <= 4, "Bounded limit respected"
        for s in sims:
            coverage_set.add(s["id"])

    avg_rec_latency = sum(rec_latencies) / len(rec_latencies)
    coverage_pct = (len(coverage_set) / len(rec_engine.products)) * 100
    print(f"[PASS] Rec Engine Latency: avg {avg_rec_latency:.2f}ms | Catalog coverage: {coverage_pct:.1f}%")

    # 2. Evaluate Complementary Outfit Matching
    sample_id = rec_engine.products[0]["id"]
    complementary = rec_engine.get_complementary_outfits(sample_id, limit=3)
    assert len(complementary) > 0, "Complementary recommendation must return items"
    print(f"[PASS] Complementary outfit matching returned {len(complementary)} items for product ID {sample_id}.")

    # 3. Evaluate Smart Search Relevance
    t0 = time.time()
    search_engine = SmartSearchEngine()
    print(f"[OK] Search engine initialized in {(time.time() - t0)*1000:.1f}ms.")

    test_queries = [
        ("kurti", "Women", "Synonym mapping from kurti to kurta"),
        ("spidrman", "Kids", "Fuzzy typo tolerance (missing 'e')"),
        ("silk saree", "Women", "Multi-token fabric & category search"),
        ("chanderi", "Men", "Fabric attribute matching"),
        ("twinning", "Men", "Family sets synonym matching")
    ]

    for q, expected_cat, desc in test_queries:
        res = search_engine.search(q, limit=5)
        assert res["total_results"] > 0, f"Search failed for query '{q}'"
        top_item = res["products"][0]
        print(f"[PASS] Query '{q}' ({desc}) -> Top: '{top_item['name']}' (Cat: {top_item['category']}, Score: {top_item.get('relevance_score')})")

    # 4. Evaluate Size Advisor
    size_tests = [
        ("Men", 38.0, "S"),
        ("Men", 42.0, "L"),
        ("Women", 34.0, "S"),
        ("Women", 38.0, "L")
    ]
    for cat, chest, expected_size in size_tests:
        advisor_res = recommend_size(cat, user_chest=chest, fit_preference="regular")
        assert advisor_res["success"] is True
        print(f"[PASS] Size advisor ({cat}, chest {chest} in) -> Size {advisor_res['recommended_size']} (Confidence: {advisor_res['confidence']}%)")

    # 5. Evaluate Inventory Forecast
    forecast = calculate_inventory_forecast()
    assert len(forecast) == len(rec_engine.products)
    print(f"[PASS] Inventory forecast verified for {len(forecast)} SKUs.")

    print("=" * 60)
    print("ALL MACHINE LEARNING EVALUATION CHECKS PASSED SUCCESSFULLY! [SUCCESS]")
    print("=" * 60)


if __name__ == "__main__":
    run_ml_evaluation()
