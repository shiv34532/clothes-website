"""
Product Recommendation Engine for Little to Large.
Features:
1. Content-based TF-IDF + Cosine Similarity matching over product metadata.
2. Complementary Outfit Matching (e.g., Kurta <-> Mojaris, Mom Saree <-> Daughter Kurti).
3. Popularity Fallback (Rating & Stock availability score) for cold-start.
Supports scikit-learn with pure-Python cosine fallback.
"""

import math
from typing import List, Dict, Any, Optional
from collections import Counter
from ml.data_loader import load_products_from_db

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


class PurePythonTfidf:
    """Zero-dependency fallback TF-IDF vectorizer and cosine similarity."""

    def __init__(self):
        self.vocabulary: Dict[str, int] = {}
        self.idf: Dict[str, float] = {}

    def fit_transform(self, corpus: List[str]) -> List[Dict[int, float]]:
        doc_count = len(corpus)
        doc_tokens = [c.lower().split() for c in corpus]

        # Build vocabulary & document frequency
        df = Counter()
        for tokens in doc_tokens:
            unique_tokens = set(tokens)
            for t in unique_tokens:
                df[t] += 1

        self.vocabulary = {term: idx for idx, term in enumerate(sorted(df.keys()))}
        self.idf = {term: math.log((1 + doc_count) / (1 + freq)) + 1.0 for term, freq in df.items()}

        vectors = []
        for tokens in doc_tokens:
            tf = Counter(tokens)
            total = len(tokens) or 1
            vec = {}
            norm_sq = 0.0
            for term, count in tf.items():
                if term in self.vocabulary:
                    term_idx = self.vocabulary[term]
                    weight = (count / total) * self.idf[term]
                    vec[term_idx] = weight
                    norm_sq += weight * weight
            # L2 normalize
            norm = math.sqrt(norm_sq) or 1.0
            for term_idx in vec:
                vec[term_idx] /= norm
            vectors.append(vec)
        return vectors

    @staticmethod
    def cosine_sim(vec1: Dict[int, float], vec2: Dict[int, float]) -> float:
        # Dot product of sparse normalized vectors
        if len(vec1) > len(vec2):
            vec1, vec2 = vec2, vec1
        dot = sum(val * vec2.get(idx, 0.0) for idx, val in vec1.items())
        return max(0.0, min(1.0, dot))


class RecommendationEngine:

    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path
        self.products: List[Dict[str, Any]] = []
        self.product_lookup: Dict[int, Dict[str, Any]] = {}
        self.similarity_matrix = None
        self.pure_vectors = None
        self.pure_engine = None
        self.reload_catalog()

    def reload_catalog(self):
        """Loads or re-indexes products from the database."""
        self.products = load_products_from_db(self.db_path)
        self.product_lookup = {p["id"]: p for p in self.products}

        if not self.products:
            return

        corpus = [p.get("feature_text", "") for p in self.products]

        if SKLEARN_AVAILABLE:
            try:
                vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
                tfidf_matrix = vectorizer.fit_transform(corpus)
                self.similarity_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)
            except Exception:
                self.similarity_matrix = None

        if self.similarity_matrix is None:
            # Fallback to pure Python engine
            self.pure_engine = PurePythonTfidf()
            self.pure_vectors = self.pure_engine.fit_transform(corpus)

    def get_similar_products(self, product_id: int, limit: int = 4) -> List[Dict[str, Any]]:
        """
        Finds content-similar products using TF-IDF and metadata similarity.
        """
        if not self.products:
            self.reload_catalog()

        target_idx = None
        for idx, p in enumerate(self.products):
            if p["id"] == product_id:
                target_idx = idx
                break

        if target_idx is None:
            # If product ID not found, return popular fallback
            return self.get_popular_fallback(limit)

        scores = []
        if self.similarity_matrix is not None:
            row = self.similarity_matrix[target_idx]
            for idx, score in enumerate(row):
                if idx != target_idx:
                    scores.append((idx, float(score)))
        elif self.pure_vectors is not None and self.pure_engine is not None:
            target_vec = self.pure_vectors[target_idx]
            for idx, vec in enumerate(self.pure_vectors):
                if idx != target_idx:
                    score = self.pure_engine.cosine_sim(target_vec, vec)
                    scores.append((idx, score))

        # Sort by similarity score descending, then by rating
        scores.sort(key=lambda x: (x[1], self.products[x[0]].get("rating", 0)), reverse=True)

        results = []
        for idx, score in scores[:limit]:
            item = dict(self.products[idx])
            item["similarity_score"] = round(score, 3)
            results.append(item)

        # Fallback if catalog is tiny
        if len(results) < limit:
            fallback = self.get_popular_fallback(limit - len(results), exclude_ids={product_id} | {r["id"] for r in results})
            results.extend(fallback)

        return results

    def get_complementary_outfits(self, product_id: int, limit: int = 3) -> List[Dict[str, Any]]:
        """
        Recommends outfits from complementary categories:
        - Men's Kurta -> Footwear (Mojaris), Boys' matching ethnic, or Accessories
        - Women's Kurta/Saree -> Footwear/Accessories, Men's matching festive Kurta
        - Kids' Set -> Sibling sets or Family twin sets
        """
        target = self.product_lookup.get(product_id)
        if not target:
            return self.get_popular_fallback(limit)

        cat = target.get("category", "")
        style = target.get("style", "")
        color = target.get("color", "")

        candidates = []
        for p in self.products:
            if p["id"] == product_id:
                continue

            # Rule 1: Footwear / Accessories complementary
            if cat in ["Men", "Women"] and p.get("category") == "Accessories":
                candidates.append((p, 0.95))
            # Rule 2: Cross-gender matching for family festive events
            elif cat == "Men" and p.get("category") == "Women" and p.get("style") == "Ethnic":
                # Matching color/festive theme
                color_bonus = 0.2 if p.get("color") == color else 0.0
                candidates.append((p, 0.80 + color_bonus))
            elif cat == "Women" and p.get("category") == "Men" and p.get("style") == "Ethnic":
                color_bonus = 0.2 if p.get("color") == color else 0.0
                candidates.append((p, 0.80 + color_bonus))
            # Rule 3: Kids matching sets
            elif cat == "Kids" and p.get("subcategory") == "Family Sets":
                candidates.append((p, 0.90))
            elif p.get("subcategory") == "Family Sets":
                candidates.append((p, 0.85))

        candidates.sort(key=lambda x: (x[1], x[0].get("rating", 0)), reverse=True)
        results = [dict(c[0]) for c in candidates[:limit]]

        if len(results) < limit:
            exclude = {product_id} | {r["id"] for r in results}
            results.extend(self.get_popular_fallback(limit - len(results), exclude_ids=exclude))

        return results

    def get_popular_fallback(self, limit: int = 4, exclude_ids: Optional[set] = None) -> List[Dict[str, Any]]:
        """
        Popularity baseline: High ratings + stock availability.
        """
        exclude = exclude_ids or set()
        valid = [p for p in self.products if p["id"] not in exclude and p.get("stock", 0) > 0]
        # Rank by rating descending
        valid.sort(key=lambda x: (x.get("rating", 0), x.get("stock", 0)), reverse=True)
        return [dict(p) for p in valid[:limit]]


if __name__ == "__main__":
    engine = RecommendationEngine()
    print(f"Initialized engine with {len(engine.products)} items.")
    if engine.products:
        first_id = engine.products[0]["id"]
        sims = engine.get_similar_products(first_id, limit=3)
        print(f"Recommendations for '{engine.products[0]['name']}':")
        for s in sims:
            print(f" - {s['name']} (Score: {s.get('similarity_score')})")
