// Demo data used only when the API returns no products/promotions.
// This file is client-side only and does NOT modify any server or DB data.
(function(){
  window.demoProducts = [
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
      video_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
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
      video_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
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
      media_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      bg_color: 'linear-gradient(135deg,#f97316 0%, #fb7185 100%)',
      link_url: 'products.html?style=Ethnic'
    },
    {
      id: 'demo-promo-2',
      title: 'New Arrivals: Little to Large',
      subtitle: 'Comfort-first collections for every generation',
      media_url: 'images/hero_ethnic.png',
      bg_color: 'linear-gradient(135deg,#06b6d4 0%, #3b82f6 100%)',
      link_url: 'products.html'
    }
  ];

  window.demoHomepageSettings = {
    hero_title: 'Summer Vibes - Little to Large (Demo)',
    hero_subtitle: 'Handpicked family collections for your next trip',
    media_type: 'video',
    media_url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
  };
})();
