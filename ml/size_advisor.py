"""
Explainable Size and Fit Advisor for Indian Family Fashion.
Computes size recommendations based on garment measurement matrices,
user body measurements, and fit preference (slim, regular, relaxed).
"""

from typing import Dict, Any, Optional

# Verified Indian Garment Measurement Standard Size Charts (Dimensions in Inches)
INDIAN_SIZE_CHARTS = {
    "Women": {
        "XS": {"bust": 32.0, "waist": 26.0, "hip": 36.0, "length": 42.0},
        "S":  {"bust": 34.0, "waist": 28.0, "hip": 38.0, "length": 43.0},
        "M":  {"bust": 36.0, "waist": 30.0, "hip": 40.0, "length": 44.0},
        "L":  {"bust": 38.0, "waist": 32.0, "hip": 42.0, "length": 44.5},
        "XL": {"bust": 40.0, "waist": 34.0, "hip": 44.0, "length": 45.0},
        "XXL":{"bust": 42.0, "waist": 36.0, "hip": 46.0, "length": 45.5}
    },
    "Men": {
        "S":  {"chest": 38.0, "waist": 32.0, "shoulder": 17.5, "length": 40.0},
        "M":  {"chest": 40.0, "waist": 34.0, "shoulder": 18.0, "length": 41.0},
        "L":  {"chest": 42.0, "waist": 36.0, "shoulder": 18.5, "length": 42.0},
        "XL": {"chest": 44.0, "waist": 38.0, "shoulder": 19.0, "length": 43.0},
        "XXL":{"chest": 46.0, "waist": 40.0, "shoulder": 19.5, "length": 44.0}
    },
    "Kids": {
        "0-6M":  {"height_cm": 65, "chest": 18.0, "waist": 18.5, "age_months": 6},
        "6-12M": {"height_cm": 75, "chest": 19.5, "waist": 19.5, "age_months": 12},
        "12-18M":{"height_cm": 83, "chest": 20.5, "waist": 20.0, "age_months": 18},
        "2T":    {"height_cm": 90, "chest": 21.5, "waist": 20.5, "age_years": 2},
        "3T":    {"height_cm": 98, "chest": 22.5, "waist": 21.0, "age_years": 3},
        "4T":    {"height_cm": 105, "chest": 23.5, "waist": 21.5, "age_years": 4},
        "5T":    {"height_cm": 112, "chest": 24.5, "waist": 22.0, "age_years": 5},
        "6T":    {"height_cm": 118, "chest": 25.5, "waist": 22.5, "age_years": 6}
    }
}


def recommend_size(
    category: str,
    user_chest: Optional[float] = None,
    user_waist: Optional[float] = None,
    user_height_cm: Optional[float] = None,
    user_age_years: Optional[float] = None,
    fit_preference: str = "regular"  # "slim", "regular", "relaxed"
) -> Dict[str, Any]:
    """
    Computes explainable size recommendation.
    Fit preference adjusts garment ease:
    - slim: +1.0 inch ease
    - regular: +2.5 inches ease (standard for Indian ethnic wear)
    - relaxed: +4.0 inches ease
    """
    category_normalized = category.title() if category else "Women"
    chart = INDIAN_SIZE_CHARTS.get(category_normalized)

    if not chart:
        return {
            "success": False,
            "message": f"Standard size chart for '{category}' not found.",
            "recommended_size": "M",
            "confidence": 50,
            "reason": "Defaulting to medium size as fallback."
        }

    ease_allowance = 2.5
    if fit_preference == "slim":
        ease_allowance = 1.0
    elif fit_preference == "relaxed":
        ease_allowance = 4.0

    # For Kids sizing:
    if category_normalized == "Kids":
        best_size = "3T"
        min_diff = 999.0
        reason = "Matched by standard toddler developmental age."

        if user_age_years is not None:
            # Match closest age
            for size, data in chart.items():
                size_age = data.get("age_years", (data.get("age_months", 12) / 12.0))
                diff = abs(size_age - user_age_years)
                if diff < min_diff:
                    min_diff = diff
                    best_size = size
            reason = f"Based on child's age ({user_age_years} yrs) with room for growth."
        elif user_height_cm is not None:
            for size, data in chart.items():
                diff = abs(data["height_cm"] - user_height_cm)
                if diff < min_diff:
                    min_diff = diff
                    best_size = size
            reason = f"Based on child's height ({user_height_cm} cm)."
        elif user_chest is not None:
            target = user_chest + ease_allowance
            for size, data in chart.items():
                diff = abs(data["chest"] - target)
                if diff < min_diff:
                    min_diff = diff
                    best_size = size
            reason = f"Based on child's chest measurement ({user_chest} in) with {ease_allowance} in ease."

        return {
            "success": True,
            "category": "Kids",
            "recommended_size": best_size,
            "confidence": 92 if min_diff <= 1.5 else 80,
            "fit_preference": fit_preference,
            "ease_allowance": ease_allowance,
            "reason": reason,
            "chart_available": list(chart.keys())
        }

    # For Adult Men and Women sizing:
    primary_metric = "chest" if category_normalized == "Men" else "bust"
    target_metric_val = user_chest

    if target_metric_val is None and user_waist is not None:
        target_metric_val = user_waist + 4.0  # Estimate chest from waist
        primary_metric = "waist_inferred"

    if target_metric_val is None:
        return {
            "success": False,
            "message": f"Please provide your {primary_metric} measurement for accurate sizing.",
            "recommended_size": "M",
            "confidence": 55,
            "reason": "Standard Indian medium size recommendation without personalized measurements."
        }

    target_garment_dimension = target_metric_val + ease_allowance

    best_size = "M"
    min_diff = 999.0
    garment_spec = chart["M"]

    for size, specs in chart.items():
        spec_chest = specs.get("chest") or specs.get("bust", 36.0)
        diff = abs(spec_chest - target_garment_dimension)
        if diff < min_diff:
            min_diff = diff
            best_size = size
            garment_spec = specs

    spec_val = garment_spec.get("chest") or garment_spec.get("bust")
    confidence = max(65, int(98 - (min_diff * 8)))

    return {
        "success": True,
        "category": category_normalized,
        "recommended_size": best_size,
        "confidence": confidence,
        "fit_preference": fit_preference,
        "ease_allowance_inches": ease_allowance,
        "garment_dimension_inches": spec_val,
        "user_measurement_inches": target_metric_val,
        "reason": f"Size {best_size} ({spec_val}\" {primary_metric}) provides optimal {fit_preference} fit for your {target_metric_val}\" measurement with {ease_allowance}\" festive comfort allowance."
    }


if __name__ == "__main__":
    print("Testing Size Advisor...")
    res_men = recommend_size("Men", user_chest=40.0, fit_preference="relaxed")
    print("Men (40 in, relaxed):", res_men["recommended_size"], "-", res_men["reason"])

    res_women = recommend_size("Women", user_chest=34.0, fit_preference="regular")
    print("Women (34 in, regular):", res_women["recommended_size"], "-", res_women["reason"])

    res_kids = recommend_size("Kids", user_age_years=3.5)
    print("Kids (3.5 yrs):", res_kids["recommended_size"], "-", res_kids["reason"])
