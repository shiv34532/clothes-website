// Demo data used for rich fallback & testing when running in local development environments.
// This file is client-side only and does NOT modify any server or DB data.
(function(){
  window.demoProducts = [
    {
      id: 12,
      name: "Peacock Blue Silk Anarkali Gown",
      category: "Women",
      subcategory: "Ethnic",
      price: 2999,
      discount_price: 2199,
      stock: 22,
      description: "Floor-length peacock blue silk anarkali with flared kalis, golden thread work on the yoke, and a sheer organza dupatta. Handcrafted for festive celebrations and family weddings.",
      size_variants: "S,M,L,XL",
      image_urls: JSON.stringify([
        "images/products/Product_19/front.png",
        "images/products/Product_19/top.png",
        "images/products/Product_19/bottom.png"
      ]),
      rating: 4.9,
      video_url: "/videos/gemini_generated_video_39a5ecd2.mp4",
      fabric: "Silk",
      color: "Blue, Emerald, Maroon",
      style: "Ethnic",
      gender: "Women",
      return_window_days: 7,
      color_variants: [
        {
          id: 12,
          product_id: 12,
          color_name: "Blue",
          color_code: "#2563eb",
          sku: "LTL-12-BLU",
          price: 2999,
          discount_price: 2199,
          stock: 22,
          size_variants: "S,M,L,XL",
          sizes_stock: { "S": 5, "M": 8, "L": 6, "XL": 3 },
          image_urls: [
            "images/products/Product_19/front.png",
            "images/products/Product_19/top.png",
            "images/products/Product_19/bottom.png"
          ],
          is_default: 1
        },
        {
          id: 112,
          product_id: 12,
          color_name: "Emerald",
          color_code: "#16a34a",
          sku: "LTL-12-EME",
          price: 2999,
          discount_price: 2199,
          stock: 15,
          size_variants: "S,M,L,XL",
          sizes_stock: { "S": 3, "M": 5, "L": 4, "XL": 3 },
          image_urls: [
            "images/products/Green_Floral_Womens_Kurta/front.png",
            "images/products/Green_Floral_Womens_Kurta/model_pose.png",
            "images/products/Green_Floral_Womens_Kurta/back.png"
          ],
          is_default: 0
        },
        {
          id: 212,
          product_id: 12,
          color_name: "Maroon",
          color_code: "#800020",
          sku: "LTL-12-MAR",
          price: 3199,
          discount_price: 2399,
          stock: 10,
          size_variants: "S,M,L,XL",
          sizes_stock: { "S": 2, "M": 4, "L": 3, "XL": 1 },
          image_urls: [
            "images/products/Product_18/front.png",
            "images/products/Product_18/top.png"
          ],
          is_default: 0
        }
      ],
      variants: [
        {
          id: 12,
          product_id: 12,
          color_name: "Blue",
          color_code: "#2563eb",
          sku: "LTL-12-BLU",
          price: 2999,
          discount_price: 2199,
          stock: 22,
          size_variants: "S,M,L,XL",
          sizes_stock: { "S": 5, "M": 8, "L": 6, "XL": 3 },
          image_urls: [
            "images/products/Product_19/front.png",
            "images/products/Product_19/top.png",
            "images/products/Product_19/bottom.png"
          ],
          is_default: 1
        },
        {
          id: 112,
          product_id: 12,
          color_name: "Emerald",
          color_code: "#16a34a",
          sku: "LTL-12-EME",
          price: 2999,
          discount_price: 2199,
          stock: 15,
          size_variants: "S,M,L,XL",
          sizes_stock: { "S": 3, "M": 5, "L": 4, "XL": 3 },
          image_urls: [
            "images/products/Green_Floral_Womens_Kurta/front.png",
            "images/products/Green_Floral_Womens_Kurta/model_pose.png",
            "images/products/Green_Floral_Womens_Kurta/back.png"
          ],
          is_default: 0
        },
        {
          id: 212,
          product_id: 12,
          color_name: "Maroon",
          color_code: "#800020",
          sku: "LTL-12-MAR",
          price: 3199,
          discount_price: 2399,
          stock: 10,
          size_variants: "S,M,L,XL",
          sizes_stock: { "S": 2, "M": 4, "L": 3, "XL": 1 },
          image_urls: [
            "images/products/Product_18/front.png",
            "images/products/Product_18/top.png"
          ],
          is_default: 0
        }
      ]
    },
    {
      id: 1001,
      name: 'Family Matching Kurta Set (Demo)',
      category: 'Women',
      subcategory: 'Ethnic',
      image_urls: JSON.stringify(['images/products/Product_11/1.jpg']),
      price: 1299,
      discount_price: 899,
      rating: 4.6,
      stock: 12,
      color: 'saffron,indigo',
      size_variants: 'S,M,L,XL',
      video_url: '/videos/gemini_generated_video_55fc5f1d.mp4'
    },
    {
      id: 1002,
      name: 'Baby Suite Demo - Soft Cotton',
      category: 'Kids',
      subcategory: 'Western',
      image_urls: JSON.stringify(['images/products/Beige_Rabbit_Kids_Set/1.jpg']),
      price: 499,
      discount_price: 345,
      rating: 5.0,
      stock: 8,
      color: 'pink,white',
      size_variants: '0-3,3-6,6-12',
      video_url: ''
    },
    {
      id: 1003,
      name: 'Green Floral Womens Kurta (Demo)',
      category: 'Women',
      subcategory: 'Ethnic',
      image_urls: JSON.stringify(['images/products/Green_Floral_Womens_Kurta/1.jpg']),
      price: 1599,
      discount_price: null,
      rating: 4.2,
      stock: 5,
      color: 'green,white',
      size_variants: 'S,M,L',
      video_url: ''
    }
  ];

  window.demoPromotions = [
    {
      id: 'demo-promo-1',
      title: 'Festival Twin Sets',
      subtitle: 'Up to 30% off on family twinning outfits',
      media_url: '/videos/gemini_generated_video_39a5ecd2.mp4',
      bg_color: 'linear-gradient(135deg,#f97316 0%, #fb7185 100%)',
      link_url: '/products?style=Ethnic'
    },
    {
      id: 'demo-promo-2',
      title: 'New Arrivals: Little to Large',
      subtitle: 'Comfort-first collections for every generation',
      media_url: 'images/hero_ethnic.png',
      bg_color: 'linear-gradient(135deg,#06b6d4 0%, #3b82f6 100%)',
      link_url: '/products'
    }
  ];

  window.demoHomepageSettings = {
    hero_title: 'Family Fashion - Little to Large',
    hero_subtitle: 'Handpicked Indian collections for your entire family',
    media_type: 'video',
    media_url: '/videos/gemini_generated_video_39a5ecd2.mp4'
  };
})();
