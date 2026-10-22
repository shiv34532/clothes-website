"""
Inventory and Demand Forecasting Baseline for Little to Large.
Calculates stock run-rate, days of inventory remaining (DOI),
reorder thresholds, and 30-day festive demand velocity.
"""

from typing import List, Dict, Any, Optional
from ml.data_loader import load_products_from_db


def calculate_inventory_forecast(db_path: Optional[str] = None) -> List[Dict[str, Any]]:
    products = load_products_from_db(db_path)
    forecast_results = []

    for p in products:
        stock = int(p.get("stock") or 0)
        rating = float(p.get("rating") or 4.5)
        price = float(p.get("discount_price") or p.get("price") or 999.0)
        subcategory = p.get("subcategory") or ""
        category = p.get("category") or ""

        # Estimate daily demand velocity based on historical aggregate popularity signals
        base_daily_sales = 0.8
        if rating >= 4.8:
            base_daily_sales *= 1.8
        elif rating >= 4.5:
            base_daily_sales *= 1.3

        # Festive / Family sets multiplier
        if subcategory in ["Ethnic", "Family Sets", "Wedding"]:
            base_daily_sales *= 1.5

        # Price elastic adjustment
        if price < 1000:
            base_daily_sales *= 1.4
        elif price > 3000:
            base_daily_sales *= 0.7

        estimated_daily_demand = round(base_daily_sales, 2)
        days_of_inventory = round(stock / max(estimated_daily_demand, 0.1), 1)

        # 30-day festival forecast
        festive_surge_multiplier = 2.2  # Expected Diwali/Navratri demand spike
        predicted_30_day_demand = round(estimated_daily_demand * 30 * festive_surge_multiplier)

        # Re-order point (Lead time 14 days + safety stock)
        lead_time_days = 14
        safety_stock = round(estimated_daily_demand * 7)
        reorder_point = round((estimated_daily_demand * lead_time_days) + safety_stock)

        # Status
        if stock <= reorder_point:
            status = "Reorder Urgently"
            badge = "danger"
        elif days_of_inventory < 25:
            status = "Low Stock"
            badge = "warning"
        elif days_of_inventory > 90:
            status = "Overstocked"
            badge = "info"
        else:
            status = "Healthy"
            badge = "success"

        forecast_results.append({
            "product_id": p["id"],
            "name": p["name"],
            "category": category,
            "current_stock": stock,
            "estimated_daily_demand": estimated_daily_demand,
            "days_of_inventory": days_of_inventory,
            "predicted_30_day_demand": predicted_30_day_demand,
            "reorder_point": reorder_point,
            "recommended_reorder_qty": max(0, predicted_30_day_demand - stock),
            "status": status,
            "status_badge": badge
        })

    return forecast_results


if __name__ == "__main__":
    results = calculate_inventory_forecast()
    print(f"Generated forecast for {len(results)} products.")
    for r in results[:3]:
        print(f" - {r['name']}: Stock {r['current_stock']} | Daily Demand: {r['estimated_daily_demand']} | Status: {r['status']}")
