"""
Smart Product Search and Multi-Signal Relevance Ranking Engine.
Incorporates Indian fashion synonym expansion, typo-tolerant fuzzy matching,
attribute-aware scoring, and autocomplete suggestion generation.
"""

from typing import List, Dict, Any, Optional, Tuple
from ml.data_loader import load_products_from_db
from ml.synonyms import expand_query_tokens, INDIAN_FASHION_SYNONYMS


def levenshtein_distance(s1: str, s2: str) -> int:
    """Computes Levenshtein edit distance between two strings."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]


class SmartSearchEngine:

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path
        self.products: List[Dict[str, Any]] = []
        self.reload_catalog()

    def reload_catalog(self):
        self.products = load_products_from_db(self.db_path)

    def search(self, query: str, limit: int = 12) -> Dict[str, Any]:
        """
        Executes smart search with synonym expansion, fuzzy matching, and multi-signal ranking.
        """
        if not self.products:
            self.reload_catalog()

        raw_query = (query or "").strip().lower()
        if not raw_query:
            return {
                "query": query,
                "total_results": len(self.products),
                "products": [dict(p) for p in self.products[:limit]],
                "suggestions": self.get_popular_suggestions()
            }

        # 1. Expand tokens with Indian fashion synonyms
        query_tokens = raw_query.split()
        expanded_tokens = expand_query_tokens(raw_query)

        scored_products: List[Tuple[Dict[str, Any], float]] = []

        for p in self.products:
            score = 0.0
            name = (p.get("name") or "").lower()
            category = (p.get("category") or "").lower()
            subcategory = (p.get("subcategory") or "").lower()
            fabric = (p.get("fabric") or "").lower()
            color = (p.get("color") or "").lower()
            style = (p.get("style") or "").lower()
            desc = (p.get("description") or "").lower()
            stock = p.get("stock", 0)
            rating = p.get("rating", 0.0)

            # Signal 1: Exact phrase match
            if raw_query in name:
                score += 15.0
            elif raw_query in category or raw_query in subcategory:
                score += 10.0
            elif raw_query in desc:
                score += 5.0

            # Signal 2: Token match across fields
            for token in query_tokens:
                if token in name:
                    score += 8.0
                elif token in subcategory or token in category:
                    score += 6.0
                elif token in fabric or token in color or token in style:
                    score += 5.0
                elif token in desc:
                    score += 2.0
                else:
                    # Fuzzy typo tolerance (allowed 1 edit for len >= 4, 2 edits for len >= 7)
                    for word in name.split() + subcategory.split() + fabric.split() + color.split():
                        if abs(len(token) - len(word)) <= 2:
                            dist = levenshtein_distance(token, word)
                            if dist == 1 and len(token) >= 4:
                                score += 4.0
                                break
                            elif dist == 2 and len(token) >= 7:
                                score += 2.5
                                break

            # Signal 3: Expanded Indian fashion synonyms match
            for syn in expanded_tokens:
                if syn not in query_tokens:
                    if syn in name:
                        score += 5.0
                    elif syn in category or syn in subcategory:
                        score += 4.0
                    elif syn in fabric or syn in style:
                        score += 3.5

            # Signal 4: Availability and Quality Signals
            if stock > 0:
                score += 1.5  # In-stock items prioritized
            else:
                score -= 5.0  # Out of stock demoted

            # Quality rating boost (0.0 to 1.0)
            score += float(rating) * 0.2

            if score > 0.5:
                item = dict(p)
                item["relevance_score"] = round(score, 2)
                scored_products.append((item, score))

        # Sort products by score descending
        scored_products.sort(key=lambda x: x[1], reverse=True)
        results = [sp[0] for sp in scored_products[:limit]]

        zero_results = len(results) == 0
        suggestions = []
        if zero_results:
            # Helpful zero-results suggestions: festive & popular fallback
            fallback_items = sorted(
                [p for p in self.products if p.get("stock", 0) > 0],
                key=lambda x: x.get("rating", 0),
                reverse=True
            )[:4]
            results = [dict(f) for f in fallback_items]
            suggestions = ["Kurtas", "Silk Saree", "Kids Play Set", "Family Sets", "Festive Wear"]

        return {
            "query": query,
            "total_results": len(scored_products),
            "zero_results": zero_results,
            "products": results,
            "suggestions": suggestions or self.get_query_suggestions(raw_query)
        }

    def get_query_suggestions(self, prefix: str, max_suggestions: int = 5) -> List[str]:
        """Provides autocomplete suggestions based on product titles and categories."""
        if not prefix:
            return self.get_popular_suggestions()

        candidates = set()
        p_clean = prefix.lower()
        for p in self.products:
            name = p.get("name", "")
            cat = p.get("category", "")
            subcat = p.get("subcategory", "")
            for candidate in [name, f"{cat} Clothing", f"{subcat} Outfits", p.get("fabric", "")]:
                if candidate and candidate.lower().startswith(p_clean):
                    candidates.add(candidate)
                elif candidate and p_clean in candidate.lower():
                    candidates.add(candidate)

        # Check fashion synonyms
        for key in INDIAN_FASHION_SYNONYMS:
            if key.startswith(p_clean):
                candidates.add(key.title())

        return sorted(list(candidates))[:max_suggestions]

    def get_popular_suggestions(self) -> List[str]:
        return ["Men's Festive Kurta", "Pure Silk Saree", "Kids Cotton Sets", "Family Matching Sets", "Anarkali Kurta"]


if __name__ == "__main__":
    searcher = SmartSearchEngine()
    print("Testing Smart Search Engine...")

    # Test 1: Synonym expansion ("kurti" should match Kurta)
    res1 = searcher.search("kurti")
    print(f"Query 'kurti': Found {res1['total_results']} products.")
    for p in res1['products'][:2]:
        print(f" - {p['name']} (Score: {p.get('relevance_score')})")

    # Test 2: Typo tolerance ("spidrman" should match Spiderman)
    res2 = searcher.search("spidrman")
    print(f"\nQuery 'spidrman' (typo): Found {res2['total_results']} products.")
    for p in res2['products'][:2]:
        print(f" - {p['name']} (Score: {p.get('relevance_score')})")
