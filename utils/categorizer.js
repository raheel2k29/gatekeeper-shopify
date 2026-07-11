const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Auto-Categorization Engine powered by Google Gemini AI
 * Dynamically generates 3-5 highly accurate e-commerce tags based on title and description.
 */
async function categorizeProduct(title, description) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('[Categorizer] Missing GEMINI_API_KEY. Returning fallback tags.');
            return { tags: ["Uncategorized"], category: "Uncategorized" };
        }

        // Use the official stable v1 SDK instead of the beta SDK
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // Clean HTML tags from the description so the AI only reads pure text
        const cleanDescription = description.replace(/<[^>]*>?/gm, '').substring(0, 1500);

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

        const prompt = `You are an expert e-commerce product tagger for a Shopify Pet Store.
I will give you a product title and description.
You must return a raw JSON object with two fields:
1. "tags": An array of exactly 4 to 6 highly relevant, professional category tags.
2. "category": EXACTLY ONE category selected from the Allowed Mega Menu Categories list below. You must NOT invent a new category. Pick the absolute closest match.

Allowed Mega Menu Categories:
${JSON.stringify(MEGA_MENU_CATEGORIES)}

Rules:
- Always include a top-level animal tag in the tags array if applicable.
- Do NOT use hashtags.
- Return ONLY the raw JSON object. Do not wrap it in markdown code blocks. Do not add any other text.

Product Title: ${title}
Product Description: ${cleanDescription}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text() || '{}';
        
        // Strip markdown code blocks just in case the AI wraps it
        const cleanJsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const data = JSON.parse(cleanJsonString);
            const tags = data.tags && Array.isArray(data.tags) ? data.tags : [];
            const category = data.category || "Uncategorized";
            return { tags, category };
        } catch (parseError) {
            console.error('[Categorizer] Failed to parse AI JSON:', cleanJsonString);
            return { tags: ["Uncategorized"], category: "Uncategorized" };
        }

    } catch (error) {
        console.error('[Categorizer] Gemini AI Error:', error.message);
        return { tags: ["Uncategorized"], category: "Uncategorized" }; // Safe fallback
    }
}

module.exports = { categorizeProduct };
