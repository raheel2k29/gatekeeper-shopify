const { GoogleGenerativeAI } = require('@google/generative-ai');
const { MEGA_MENU_CATEGORIES } = require('./categories');

/**
 * Auto-Categorization Engine powered by Google Gemini AI
 * Dynamically generates 3-5 highly accurate e-commerce tags based on title and description.
 */
async function categorizeProduct(title, description) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('[Categorizer] Missing GEMINI_API_KEY. Returning fallback tags.');
            return { tags: ["Uncategorized"], category: "Uncategorized", seo_title: title, seo_description: description, metafields: [] };
        }

        // Use the official stable v1 SDK instead of the beta SDK
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        // Extract and preserve all image, video, and iframe tags from the original description
        const mediaRegex = /<(img|video|iframe)[^>]*>/gi;
        const extractedMedia = description.match(mediaRegex) || [];
        const mediaHtml = extractedMedia.join('\n<br>\n');

        // Clean HTML tags from the description so the AI only reads pure text for context
        const cleanDescription = description.replace(/<[^>]*>?/gm, '').substring(0, 1500);

        // MEGA_MENU_CATEGORIES imported from categories.js

        const prompt = `You are an expert e-commerce product copywriter and tagger for a premium Shopify Pet Store.
I will give you a product title and a raw description.
You must return a raw JSON object with exactly these 5 fields:
1. "tags": An array of exactly 4 to 6 highly relevant, professional category tags. Include a top-level animal tag. Do NOT use hashtags.
2. "category": EXACTLY ONE category selected from the Allowed Mega Menu Categories list below. You must NOT invent a new category. Pick the absolute closest match.
3. "seo_title": A clean, catchy, premium, and SEO-friendly product name. Remove any spammy dropship words.
4. "seo_description": A persuasive, professional sales description formatted in clean HTML (use <p>, <b>, <ul>, <li>). Do NOT include image tags.
5. "metafields": An array of objects extracting key product specifications. You must ONLY use the following exact keys if applicable, do not invent new keys: "disclosures", "keywords", "safety", "care", "features", "breed_fit", "size", "color", "material". Format: [{"key": "material", "value": "Plush"}].

Allowed Mega Menu Categories:
${JSON.stringify(MEGA_MENU_CATEGORIES)}

Rules:
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
            const category = data.category || "Requires Manual Review";
            const seo_title = data.seo_title || title;
            const metafields = data.metafields && Array.isArray(data.metafields) ? data.metafields : [];
            
            // Append the extracted media back to the bottom of the AI's clean HTML description
            let seo_description = data.seo_description || cleanDescription;
            if (mediaHtml.length > 0) {
                seo_description += `\n<br>\n<div class="product-media-gallery">\n${mediaHtml}\n</div>`;
            }

            return { tags, category, seo_title, seo_description, metafields };
        } catch (parseError) {
            console.error('[Categorizer] Failed to parse AI JSON:', cleanJsonString);
            return { tags: ["Uncategorized"], category: "Requires Manual Review", seo_title: title, seo_description: description, metafields: [] };
        }

    } catch (error) {
        console.error('[Categorizer] Gemini AI Error:', error.message);
        return { tags: ["Uncategorized"], category: "Requires Manual Review", seo_title: title, seo_description: description, metafields: [] }; // Safe fallback
    }
}

module.exports = { categorizeProduct };
