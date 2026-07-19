const MEGA_MENU_CATEGORIES = [
    "Dog Jackets", "Dog Hoodies", "Dog Shirts", "Dog Dresses", "Dog Sweaters", "Dog Sportswear", "Dog Raincoats", "Holiday Apparel",
    "Chew Toys", "Puzzle & Smart Toys", "Balls & Fetch Toys", "Rope & Tug Toys",
    "Collars (Luxury, Tactical, Spike, GPS)", "Leashes (Standard, Hands-Free, LED)", "Harnesses (No-Pull, Tactical, Service)", "Dog ID Tags", "Dog Tactical Gear", "Dog Glasses", "Boots & Paw Protection",
    "Training Pads", "Clickers & Reward Tools", "Agility Kits", "Electronic Training Devices",
    "Orthopedic Beds", "Calming Beds", "Heated & Cooling Beds", "Luxury Sofas", "Convertible Loungers", "Indoor/Outdoor Loungers",
    "Brushes & Combs", "Shampoos & Conditioners", "Dental Care", "Flea/Tick/Worm Prevention", "Supplements (Joint, Digestive, Skin & Coat)",
    "Furniture-Style Crates", "Metal & Plastic Kennels", "Insulated Outdoor Houses", "Expandable Playpens",
    "Carriers & Backpacks", "Cooling Vests", "Seat Belts & Car Safety", "Portable Feeding Gear",
    "Cat Jackets", "Cat Hoodies", "Cat Dresses", "Cat Shirts",
    "Cat Laser Toys", "Cat Feather Toys", "Cat Interactive Toys",
    "Cat Brushes", "Cat Shampoo", "Cat Collars", "Cat Harnesses",
    "Cat Dry Food", "Cat Wet Food", "Cat Treats",
    "Cat Trees", "Cat Beds", "Cat Wall Beds",
    "Cat Carriers", "Cat Backpacks",
    "Pet Parent Hoodies", "Pet Parent T-Shirts", "Matching Pet + Owner Sets", "Seasonal Apparel",
    "Pet-Themed Decor", "Pet-Safe Cleaning Products", "Couch Covers", "Anti-Slip Rugs",
    "Baseball Caps", "Beanies", "Matching Pet + Owner Hats",
    "Treat Bags", "Walking Bags", "Owner Backpacks",
    "Custom Pet Name Necklaces", "Paw Print Jewelry", "Photo-Engraved Jewelry", "Memorial Jewelry",
    "Safety Equipment", "Custom Pet Portraits", "Photo Frames", "Paw Print Kits", "Keepsake Boxes",
    "Street Hoodies", "Graphic Shirts", "Tactical Vests", "Street Jackets",
    "Big Spike Collars", "Heavy Chains", "Thick Metal Leashes", "Tactical Harnesses",
    "Sunglasses", "Hats", "Bandanas", "LED Night Gear",
    "Muscular-Dog Inspired Gear", "Photo-Ready Street Sets", "Urban Dog Fashion Bundles",
    "Major Dog Food Brands", "Major Cat Food Brands", 
    "Grain-Free", "Limited Ingredient", "Hypoallergenic", "Sensitive Stomach", "Weight Management", "Senior Formulas",
    "High-Protein", "Working Dog Formulas", "Active Lifestyle Blends",
    "Organic", "Human-Grade", "Freeze-Dried Raw", "Air-Dried"
];

// Mapping of our Mega Menu Categories to Shopify's modern TaxonomyCategory GIDs
const CATEGORY_TAXONOMY_MAP = {
    // Dog Apparel -> Pet Apparel (ap-2-6)
    "Dog Jackets": "gid://shopify/TaxonomyCategory/ap-2-6",
    "Dog Jackets": "gid://shopify/TaxonomyCategory/ap-2-6",
    "Dog Hoodies": "gid://shopify/TaxonomyCategory/ap-2-6",
    "Dog Shirts": "gid://shopify/TaxonomyCategory/ap-2-6",
    "Dog Dresses": "gid://shopify/TaxonomyCategory/ap-2-6",
    "Dog Sweaters": "gid://shopify/TaxonomyCategory/ap-2-6",
    "Dog Sportswear": "gid://shopify/TaxonomyCategory/ap-2-6",
    "Dog Raincoats": "gid://shopify/TaxonomyCategory/ap-2-6",
    "Holiday Apparel": "gid://shopify/TaxonomyCategory/ap-2-6",
    "Cooling Vests": "gid://shopify/TaxonomyCategory/ap-2-6",
    "Boots & Paw Protection": "gid://shopify/TaxonomyCategory/ap-2-6",

    // Dog Toys -> Pet Toys (ap-2-40) or Dog Toys (ap-2-3-8)
    "Chew Toys": "gid://shopify/TaxonomyCategory/ap-2-3-8",
    "Puzzle & Smart Toys": "gid://shopify/TaxonomyCategory/ap-2-3-8",
    "Balls & Fetch Toys": "gid://shopify/TaxonomyCategory/ap-2-3-8",
    "Rope & Tug Toys": "gid://shopify/TaxonomyCategory/ap-2-3-8",

    // Dog Collars, Harnesses & Leashes -> Pet Collars & Harnesses (ap-2-17) or Pet Leashes (ap-2-29)
    "Collars (Luxury, Tactical, Spike, GPS)": "gid://shopify/TaxonomyCategory/ap-2-17",
    "Leashes (Standard, Hands-Free, LED)": "gid://shopify/TaxonomyCategory/ap-2-29",
    "Harnesses (No-Pull, Tactical, Service)": "gid://shopify/TaxonomyCategory/ap-2-17",
    "Dog ID Tags": "gid://shopify/TaxonomyCategory/ap-2-10", // Pet Bells & Charms / tags
    "Dog Tactical Gear": "gid://shopify/TaxonomyCategory/ap-2-17",
    "Dog Glasses": "gid://shopify/TaxonomyCategory/ap-2-6", // Pet Apparel
    "Big Spike Collars": "gid://shopify/TaxonomyCategory/ap-2-17",
    "Heavy Chains": "gid://shopify/TaxonomyCategory/ap-2-29",
    "Thick Metal Leashes": "gid://shopify/TaxonomyCategory/ap-2-29",
    "Tactical Harnesses": "gid://shopify/TaxonomyCategory/ap-2-17",

    // Dog Training -> Pet Training Aids (ap-2-41)
    "Training Pads": "gid://shopify/TaxonomyCategory/ap-2-41-3",
    "Clickers & Reward Tools": "gid://shopify/TaxonomyCategory/ap-2-41-1",
    "Agility Kits": "gid://shopify/TaxonomyCategory/ap-2-5", // Pet Agility Equipment
    "Electronic Training Devices": "gid://shopify/TaxonomyCategory/ap-2-41",

    // Dog Beds -> Pet Beds (ap-2-9) or Dog Beds (ap-2-3-2)
    "Orthopedic Beds": "gid://shopify/TaxonomyCategory/ap-2-3-2",
    "Calming Beds": "gid://shopify/TaxonomyCategory/ap-2-3-2",
    "Heated & Cooling Beds": "gid://shopify/TaxonomyCategory/ap-2-3-2",
    "Luxury Sofas": "gid://shopify/TaxonomyCategory/ap-2-3-2",
    "Convertible Loungers": "gid://shopify/TaxonomyCategory/ap-2-3-2",
    "Indoor/Outdoor Loungers": "gid://shopify/TaxonomyCategory/ap-2-3-2",

    // Grooming & Health -> Pet Grooming Supplies (ap-2-26) or Pet Vitamins & Supplements (ap-2-42)
    "Brushes & Combs": "gid://shopify/TaxonomyCategory/ap-2-26-1",
    "Shampoos & Conditioners": "gid://shopify/TaxonomyCategory/ap-2-26-7",
    "Dental Care": "gid://shopify/TaxonomyCategory/ap-2-36",
    "Flea/Tick/Worm Prevention": "gid://shopify/TaxonomyCategory/ap-2-23",
    "Supplements (Joint, Digestive, Skin & Coat)": "gid://shopify/TaxonomyCategory/ap-2-42",

    // Crates & Kennels -> Pet Carriers & Crates (ap-2-16)
    "Furniture-Style Crates": "gid://shopify/TaxonomyCategory/ap-2-16",
    "Metal & Plastic Kennels": "gid://shopify/TaxonomyCategory/ap-2-16",
    "Insulated Outdoor Houses": "gid://shopify/TaxonomyCategory/ap-2-3-6-5", // Portable/Outdoor Dog Kennels
    "Expandable Playpens": "gid://shopify/TaxonomyCategory/ap-2-18", // Pet Containment

    // Travel & Safety -> Pet Carriers & Crates (ap-2-16) or Pet Travel Accessories
    "Carriers & Backpacks": "gid://shopify/TaxonomyCategory/ap-2-16",
    "Seat Belts & Car Safety": "gid://shopify/TaxonomyCategory/ap-2-17", // Harnesses
    "Portable Feeding Gear": "gid://shopify/TaxonomyCategory/ap-2-14", // Pet Bowls & Feeders

    // Cat Apparel -> Pet Apparel (ap-2-6)
    "Cat Jackets": "gid://shopify/TaxonomyCategory/ap-2-6",
    "Cat Hoodies": "gid://shopify/TaxonomyCategory/ap-2-6",
    "Cat Dresses": "gid://shopify/TaxonomyCategory/ap-2-6",
    "Cat Shirts": "gid://shopify/TaxonomyCategory/ap-2-6",

    // Cat Toys -> Cat Toys (ap-2-2-5)
    "Cat Laser Toys": "gid://shopify/TaxonomyCategory/ap-2-2-5",
    "Cat Feather Toys": "gid://shopify/TaxonomyCategory/ap-2-2-5",
    "Cat Interactive Toys": "gid://shopify/TaxonomyCategory/ap-2-2-5",

    // Cat Grooming & Accessories -> Grooming / Collars & Harnesses
    "Cat Brushes": "gid://shopify/TaxonomyCategory/ap-2-26-1",
    "Cat Shampoo": "gid://shopify/TaxonomyCategory/ap-2-26-7",
    "Cat Collars": "gid://shopify/TaxonomyCategory/ap-2-17",
    "Cat Harnesses": "gid://shopify/TaxonomyCategory/ap-2-17",

    // Cat Food -> Cat Food (ap-2-2-1) or Cat Treats (ap-2-2-6)
    "Cat Dry Food": "gid://shopify/TaxonomyCategory/ap-2-2-1",
    "Cat Wet Food": "gid://shopify/TaxonomyCategory/ap-2-2-1",
    "Cat Treats": "gid://shopify/TaxonomyCategory/ap-2-2-6",

    // Cat Beds & Furniture -> Cat Furniture (ap-2-2-2)
    "Cat Trees": "gid://shopify/TaxonomyCategory/ap-2-2-2-5",
    "Cat Beds": "gid://shopify/TaxonomyCategory/ap-2-2-2-6", // Window beds
    "Cat Wall Beds": "gid://shopify/TaxonomyCategory/ap-2-2-2-6",

    // Cat Travel -> Pet Carriers & Crates (ap-2-16)
    "Cat Carriers": "gid://shopify/TaxonomyCategory/ap-2-16",
    "Cat Backpacks": "gid://shopify/TaxonomyCategory/ap-2-16",

    // Owner Apparel & Accessories -> Clothing (aa-1-6) or Jewelry (aa-1-5) or Bags (aa-1-1)
    "Pet Parent Hoodies": "gid://shopify/TaxonomyCategory/aa-1-6",
    "Pet Parent T-Shirts": "gid://shopify/TaxonomyCategory/aa-1-6",
    "Matching Pet + Owner Sets": "gid://shopify/TaxonomyCategory/aa-1-6",
    "Seasonal Apparel": "gid://shopify/TaxonomyCategory/aa-1-6",
    "Baseball Caps": "gid://shopify/TaxonomyCategory/aa-1-6",
    "Beanies": "gid://shopify/TaxonomyCategory/aa-1-6",
    "Matching Pet + Owner Hats": "gid://shopify/TaxonomyCategory/aa-1-6",
    "Treat Bags": "gid://shopify/TaxonomyCategory/aa-1-1",
    "Walking Bags": "gid://shopify/TaxonomyCategory/aa-1-1",
    "Owner Backpacks": "gid://shopify/TaxonomyCategory/aa-1-1",
    "Custom Pet Name Necklaces": "gid://shopify/TaxonomyCategory/aa-1-5",
    "Paw Print Jewelry": "gid://shopify/TaxonomyCategory/aa-1-5",
    "Photo-Engraved Jewelry": "gid://shopify/TaxonomyCategory/aa-1-5",
    "Memorial Jewelry": "gid://shopify/TaxonomyCategory/aa-1-5",

    // Home Decor & Cleaners -> Home & Garden
    "Pet-Themed Decor": "gid://shopify/TaxonomyCategory/hg",
    "Pet-Safe Cleaning Products": "gid://shopify/TaxonomyCategory/hg-10-6-11-12", // Pet Odor & Stain Cleaners
    "Couch Covers": "gid://shopify/TaxonomyCategory/hg",
    "Anti-Slip Rugs": "gid://shopify/TaxonomyCategory/hg",

    // Dog/Cat Food Brands & Formulas -> Dog Food (ap-2-3-1) / Cat Food (ap-2-2-1)
    "Major Dog Food Brands": "gid://shopify/TaxonomyCategory/ap-2-3-1",
    "Major Cat Food Brands": "gid://shopify/TaxonomyCategory/ap-2-2-1",
    "Grain-Free": "gid://shopify/TaxonomyCategory/ap-2-3-1",
    "Limited Ingredient": "gid://shopify/TaxonomyCategory/ap-2-3-1",
    "Hypoallergenic": "gid://shopify/TaxonomyCategory/ap-2-3-1",
    "Sensitive Stomach": "gid://shopify/TaxonomyCategory/ap-2-3-1",
    "Weight Management": "gid://shopify/TaxonomyCategory/ap-2-3-1",
    "Senior Formulas": "gid://shopify/TaxonomyCategory/ap-2-3-1",
    "High-Protein": "gid://shopify/TaxonomyCategory/ap-2-3-1",
    "Working Dog Formulas": "gid://shopify/TaxonomyCategory/ap-2-3-1",
    "Active Lifestyle Blends": "gid://shopify/TaxonomyCategory/ap-2-3-1",
    "Organic": "gid://shopify/TaxonomyCategory/ap-2-3-1",
    "Human-Grade": "gid://shopify/TaxonomyCategory/ap-2-3-1",
    "Freeze-Dried Raw": "gid://shopify/TaxonomyCategory/ap-2-3-1",
    "Air-Dried": "gid://shopify/TaxonomyCategory/ap-2-3-1",

    // Default Fallbacks
    "Safety Equipment": "gid://shopify/TaxonomyCategory/ap-2-6-11", // Pet Safety Vests
    "Custom Pet Portraits": "gid://shopify/TaxonomyCategory/hg",
    "Photo Frames": "gid://shopify/TaxonomyCategory/hg",
    "Paw Print Kits": "gid://shopify/TaxonomyCategory/ap",
    "Keepsake Boxes": "gid://shopify/TaxonomyCategory/hg"
};

module.exports = { MEGA_MENU_CATEGORIES, CATEGORY_TAXONOMY_MAP };
