const { GoogleGenAI } = require('@google/genai');
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

        // Use the official new @google/genai SDK to fully support Enterprise API keys
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const modelName = 'gemini-3.5-flash';

        // Extract and preserve all image, video, and iframe tags from the original description
        const mediaRegex = /<(img|video|iframe)[^>]*>/gi;
        const extractedMedia = description.match(mediaRegex) || [];
        const mediaHtml = extractedMedia.join('\n<br>\n');

        // Clean HTML tags from the description so the AI only reads pure text for context
        const cleanDescription = description.replace(/<[^>]*>?/gm, '').substring(0, 1500);

        // MEGA_MENU_CATEGORIES imported from categories.js

         const prompt = `You are an expert e-commerce product copywriter and tagger for a premium Shopify Pet Store.
I will give you a product title and a raw description.
You must return a raw JSON object with exactly these 6 fields:
1. "core_signature": Extract a highly specific 3-to-6 word signature representing the core physical object. You MUST include distinguishing features like emitter count, size, weight, material, or color if they define the product as a unique variation. Do not strip these out! (e.g., '4-emitter ultrasonic bark deterrent', 'blue silicone grooming glove').
2. "tags": An array of exactly 4 to 6 highly relevant, professional category tags. Include a top-level animal tag. Do NOT use hashtags.
3. "category": EXACTLY ONE category selected from the Allowed Mega Menu Categories list below. You must NOT invent a new category. Pick the absolute closest match.
4. "seo_title": A clean, catchy, premium, and SEO-friendly product name. Remove any spammy dropship words.
5. "seo_description": A highly organized, premium, and professional sales description formatted in clean HTML. You MUST divide the content using exactly these standard <h2> sections if applicable to the product type:
   - <h2>Overview</h2>: A brief, high-level introductory paragraph capturing the product's main purpose.
   - <h2>Key Benefits</h2>: An HTML bulleted list (<ul> and <li>) highlighting core advantages, starting with bolded key terms.
   - <h2>Who It's For</h2>: A short paragraph describing the target audience (dog owners, active trainers, etc.).
   - <h2>How It Works</h2>: A paragraph explaining the operational use of the product.
   - <h2>Specs</h2>: An HTML bulleted list extracting key specifications (Weight, Dimensions, Material, Power, Colors, etc.). CRITICAL: Always list dimensions with US Imperial first and Metric second (e.g., 5.1" x 1.0" x 1.6" / 13.0 x 2.6 x 4.0 cm).
   - <h2>Suggested Use</h2>: An HTML bulleted list detailing exactly when and how to apply the item.
   - <h2>Safety Notes</h2> (or <h2>Care Instructions</h2>): An HTML bulleted list of warnings, restrictions, or care rules.
   * CRITICAL Rules:
     - Under no circumstances include any <img> or media tags in this description (images are handled separately in the media gallery).
     - Keep tags valid and output only clean HTML headers, lists, and paragraphs.
6. "metafields": An array of objects extracting key product specifications. You must ONLY use the following exact keys if applicable, do not invent new keys: "disclosures", "keywords", "safety", "care", "features", "breed_fit", "size", "color", "material". Format: [{"key": "material", "value": "Plush"}].
   - CRITICAL Size Rule: In the "size" metafield, you MUST always output both US Imperial and Metric dimensions together, listing the US Imperial value first (e.g., '23.6" / 60 cm', '9" / 22.8 cm'). Convert units if only one is provided by the supplier.

Allowed Mega Menu Categories:
${JSON.stringify(MEGA_MENU_CATEGORIES)}

Rules:
- Return ONLY the raw JSON object. Do not wrap it in markdown code blocks. Do not add any other text.

Product Title: ${title}
Product Description: ${cleanDescription}
`;

        // Auto-retry helper for 503 (demand spikes) and 429 (quota limits) errors from Google
        let response = null;
        for (let i = 0; i < 5; i++) {
            try {
                response = await ai.models.generateContent({
                    model: modelName,
                    contents: prompt
                });
                break; // Success!
            } catch (err) {
                const isRetryable = err.message && (err.message.includes('503') || err.message.includes('429') || err.message.includes('quota') || err.message.includes('limit'));
                if (isRetryable && i < 4) {
                    console.log(`[Categorizer] Gemini AI Busy (Code 503/429). Retrying attempt ${i+2}/5 in 3 seconds...`);
                    await new Promise(res => setTimeout(res, 3000));
                } else {
                    throw err; // Out of retries or non-retryable error
                }
            }
        }

        const text = response.text || '{}';
        
        // Strip markdown code blocks just in case the AI wraps it
        const cleanJsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        try {
            const data = JSON.parse(cleanJsonString);
            const core_signature = data.core_signature || title;
            const tags = data.tags && Array.isArray(data.tags) ? data.tags : [];
            const category = data.category || "Requires Manual Review";
            const seo_title = data.seo_title || title;
            const metafields = data.metafields && Array.isArray(data.metafields) ? data.metafields : [];
            
            // Append the extracted media back to the bottom of the AI's clean HTML description
            let seo_description = data.seo_description || cleanDescription;
            if (mediaHtml.length > 0) {
                seo_description += `\n<br>\n<div class="product-media-gallery">\n${mediaHtml}\n</div>`;
            }

            return { core_signature, tags, category, seo_title, seo_description, metafields };
        } catch (parseError) {
            console.error('[Categorizer] Failed to parse AI JSON:', cleanJsonString);
            return { core_signature: title, tags: ["Uncategorized"], category: "Requires Manual Review", seo_title: title, seo_description: description, metafields: [] };
        }

    } catch (error) {
        console.error('[Categorizer] Gemini AI Error:', error.message);
        return { core_signature: title, tags: ["Uncategorized"], category: "Requires Manual Review", seo_title: title, seo_description: description, metafields: [] }; // Safe fallback
    }
}

module.exports = { categorizeProduct };
