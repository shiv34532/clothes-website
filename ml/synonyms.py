"""
Indian Fashion Terminology, Regional Synonyms, and Vocabulary Expansion.
Provides normalized token mappings for smart product search and relevance ranking.
"""

INDIAN_FASHION_SYNONYMS = {
    # Tops & Tunics
    "kurta": ["kurti", "tunic", "anarkali", "angrakha", "ethnic top"],
    "kurti": ["kurta", "tunic", "short kurta", "anarkali"],
    "anarkali": ["kurta", "flared gown", "ethnic dress", "kali"],
    "sherwani": ["indo-western", "bandhgala", "achkan", "royal kurta", "jodhpuri"],

    # Drapes & Bottoms
    "saree": ["sari", "drape", "handloom", "zari", "pallu"],
    "sari": ["saree", "drape", "handloom", "zari"],
    "lehenga": ["ghagra", "chaniya", "choli", "skirt", "lehenga choli"],
    "ghagra": ["lehenga", "chaniya choli", "ethnic skirt"],
    "dupatta": ["chunni", "stole", "odhani", "scarf"],
    "dhoti": ["pajama", "pyjama", "churidar", "salwar", "trousers"],
    "pyjama": ["pajama", "churidar", "dhoti", "pants"],
    "churidar": ["pyjama", "pajama", "leggings", "tapered pants"],

    # Footwear
    "mojari": ["jutti", "jooti", "ethnic footwear", "leather jutti", "nagra"],
    "jutti": ["mojari", "jooti", "nagras", "footwear"],

    # Fabrics & Craftsmanship
    "cotton": ["pure cotton", "slub cotton", "combed cotton", "breathable", "khadi"],
    "silk": ["chanderi", "art silk", "pure silk", "banarasi", "brocade", "tussar"],
    "chanderi": ["silk", "chanderi silk", "handloom", "sheer"],
    "chikankari": ["lucknowi", "embroidery", "hand embroidered", "thread work"],
    "zari": ["zardozi", "gold thread", "gota patti", "antique gold", "metallic"],
    "gota": ["gota patti", "gold lace", "border work", "zari"],

    # Family & Festive Themes
    "family": ["twinning", "family sets", "matching", "combo", "pair", "generations", "parivaar"],
    "twinning": ["family", "matching", "mother daughter", "father son", "twin set"],
    "festive": ["diwali", "navratri", "eid", "puja", "dhanteras", "raksha bandhan", "utsav", "ethnic", "celebration"],
    "diwali": ["festive", "ethnic", "dhanteras", "celebration", "festive sale", "gold"],
    "wedding": ["shaadi", "reception", "bridal", "groom", "sangeet", "mehendi", "haldi", "ceremony"],

    # Kids Wear
    "kids": ["children", "toddler", "baby", "infant", "boys", "girls", "junior"],
    "toddler": ["kids", "baby", "infant", "play set", "romper"]
}

def expand_query_tokens(query: str) -> list[str]:
    """
    Expands a search query with Indian fashion synonyms.
    """
    cleaned = query.lower().strip()
    words = cleaned.split()
    expanded = set(words)

    for word in words:
        # Exact word synonym lookup
        if word in INDIAN_FASHION_SYNONYMS:
            expanded.update(INDIAN_FASHION_SYNONYMS[word])
        # Stem / prefix matching
        for key, syns in INDIAN_FASHION_SYNONYMS.items():
            if word.startswith(key) or key.startswith(word):
                expanded.update(syns)
                expanded.add(key)

    return list(expanded)
