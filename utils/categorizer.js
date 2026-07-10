const { GoogleGenAI } = require('@google/genai');

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

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `You are an expert e-commerce product tagger for a Shopify Pet Store.
I will give you a product title and description.
You must return exactly 3 to 5 highly relevant, professional category tags for the product.
Rules:
1. Always include a top-level animal tag if applicable (e.g., "DOGS", "CATS", "BIRDS").
2. Include specific niches (e.g. "Grooming", "Medical", "Apparel", "Toys").
3. Do NOT use hashtags.
4. Return ONLY a comma-separated list of tags. Do not write any other text.

Product Title: ${title}
Product Description: ${description.substring(0, 1000)} // Truncate description to save tokens
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: prompt,
        });

        const text = response.text || '';
        const tags = text.split(',').map(t => t.trim().replace(/^['"]|['"]$/g, '')).filter(t => t.length > 0);
        return tags.length > 0 ? tags : ["Uncategorized"];

    } catch (error) {
        console.error('[Categorizer] Gemini AI Error:', error.message);
        return ["Uncategorized"]; // Safe fallback
    }
}

module.exports = { categorizeProduct };
