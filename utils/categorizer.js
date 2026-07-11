const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Auto-Categorization Engine powered by Google Gemini AI
 * Dynamically generates 3-5 highly accurate e-commerce tags based on title and description.
 */
async function categorizeProduct(title, description) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('[Categorizer] Missing GEMINI_API_KEY. Returning fallback tags.');
            return ["Uncategorized"];
        }

        // Use the official stable v1 SDK instead of the beta SDK
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // Clean HTML tags from the description so the AI only reads pure text
        const cleanDescription = description.replace(/<[^>]*>?/gm, '').substring(0, 1500);

        const prompt = `You are an expert e-commerce product tagger for a Shopify Pet Store.
I will give you a product title and description.
You must return a raw JSON object with two fields:
1. "tags": An array of exactly 4 to 6 highly relevant, professional category tags.
2. "category": A single, broad high-level store collection name (e.g., "Dog Kennels", "Cat Toys", "Pet Grooming", "Aquarium Supplies").

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
