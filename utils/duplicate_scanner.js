const { GoogleGenAI } = require('@google/genai');

// Downloads an image and converts it to Gemini's inlineData format
async function fetchImageBase64(url) {
    if (!url) return null;
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return {
            inlineData: {
                data: buffer.toString("base64"),
                mimeType: response.headers.get("content-type") || "image/jpeg"
            }
        };
    } catch (e) {
        console.error("[DuplicateScanner] Failed to fetch image:", url, e.message);
        return null;
    }
}

// Calculates the similarity between two strings (0.0 to 1.0)
function diceCoefficient(target, string) {
    if (target === string) return 1;
    if (target.length < 2 || string.length < 2) return 0;

    let targetBigrams = new Map();
    for (let i = 0; i < target.length - 1; i++) {
        const bigram = target.substring(i, i + 2).toLowerCase();
        const count = targetBigrams.has(bigram) ? targetBigrams.get(bigram) + 1 : 1;
        targetBigrams.set(bigram, count);
    }

    let intersectionSize = 0;
    for (let i = 0; i < string.length - 1; i++) {
        const bigram = string.substring(i, i + 2).toLowerCase();
        const count = targetBigrams.has(bigram) ? targetBigrams.get(bigram) : 0;
        if (count > 0) {
            targetBigrams.set(bigram, count - 1);
            intersectionSize++;
        }
    }

    return (2.0 * intersectionSize) / (target.length + string.length - 2);
}

// Cleans a title for word extraction
function getKeywords(title) {
    const cleanTitle = title.replace(/[^a-zA-Z0-9\s]/g, '');
    const words = cleanTitle.split(/\s+/).filter(w => w.length > 3);
    words.sort((a, b) => b.length - a.length);
    return words.slice(0, 3);
}

async function checkForDuplicate(core_signature, product) {
    const incomingProductId = product.id;
    if (!core_signature || core_signature.length < 3) return null;

    let shopUrl = process.env.SHOPIFY_STORE_DOMAIN || '';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    shopUrl = shopUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');

    if (!shopUrl || !accessToken || !process.env.GEMINI_API_KEY) return null;

    const cleanSignature = core_signature.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
    const keywords = getKeywords(cleanSignature);
    if (keywords.length === 0) return null;

    // Search Shopify using the most prominent keywords in the AI signature
    const searchQuery = keywords.join(' OR ');

    const graphqlEndpoint = `https://${shopUrl}/admin/api/2026-07/graphql.json`;
    const graphqlQuery = `
        query searchDuplicates($query: String!) {
            products(first: 10, query: $query) {
                edges {
                    node {
                        id
                        tags
                        title
                        featuredImage {
                            url
                        }
                    }
                }
            }
        }
    `;

    try {
        const response = await fetch(graphqlEndpoint, {
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: graphqlQuery,
                variables: { query: searchQuery }
            })
        });

        const data = await response.json();
        
        if (data.errors) {
            console.error(`[DuplicateScanner] GraphQL Error:`, JSON.stringify(data.errors));
            return null;
        }

        const edges = data.data?.products?.edges || [];
        
        for (const edge of edges) {
            const existingNode = edge.node;
            const existingIdNum = existingNode.id.split('/').pop(); 
            
            // Skip the product we are currently evaluating!
            if (String(existingIdNum) === String(incomingProductId)) {
                continue;
            }

            // Find the AI signature tag
            const tags = existingNode.tags || [];
            const sigTag = tags.find(t => t.startsWith('Signature:'));
            
            if (sigTag) {
                const targetSignature = sigTag.replace('Signature:', '').trim();
                
                // Strict Number Check: If the sizes/numbers don't perfectly match (e.g. 67 vs 71), it's a different product!
                const sourceNumbers = (cleanSignature.match(/\d+/g) || []).sort().join(',');
                const targetNumbers = (targetSignature.match(/\d+/g) || []).sort().join(',');

                if (sourceNumbers !== targetNumbers) {
                    console.log(`[DuplicateScanner] Skipping due to number mismatch: ${sourceNumbers} vs ${targetNumbers}`);
                    continue; 
                }

                // Compare the two AI signatures
                const similarity = diceCoefficient(cleanSignature, targetSignature);
                
                // 1. Text match is highly identical - Duplicate confirmed (Fast & Free)
                if (similarity > 0.80) {
                    console.log(`[DuplicateScanner] 🚨 Duplicate Found via Text Similarity: ${(similarity * 100).toFixed(1)}%`);
                    return existingIdNum;
                }

                // 2. Doubt Zone: Similarity is high enough to be suspicious (e.g. 35%-80%), trigger Vision AI to compare images
                if (similarity > 0.35) {
                    const existingImageUrl = existingNode.featuredImage?.url;
                    const incomingImageUrl = product.image?.src || (product.images && product.images[0]?.src);

                    if (incomingImageUrl && existingImageUrl) {
                        console.log(`[DuplicateScanner] 👁️ Suspicious match inside Doubt Zone (${(similarity * 100).toFixed(1)}%). Triggering Vision AI to compare images...`);
                        
                        const img1 = await fetchImageBase64(incomingImageUrl);
                        const img2 = await fetchImageBase64(existingImageUrl);

                        if (img1 && img2) {
                            try {
                                const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                                const response = await ai.models.generateContent({
                                    model: 'gemini-3.5-flash',
                                    contents: [
                                        "You are an expert e-commerce duplicate detection system. Look at these two images. Are they selling the exact same physical wholesale item? Ignore model context, dog posture, or minor variant differences (like size or color), but pay attention to structural difference. If they are the same physical item, reply with ONLY the word: DUPLICATE. If they are structurally different items, reply with ONLY the word: UNIQUE.",
                                        "Image A:",
                                        img1,
                                        "Image B:",
                                        img2
                                    ]
                                });

                                const decision = (response.text || '').trim().toUpperCase();
                                console.log(`[DuplicateScanner] 🧠 Vision AI Judge Decision: ${decision}`);

                                if (decision === 'DUPLICATE') {
                                    console.log(`[DuplicateScanner] 🚨 Duplicate confirmed by Vision AI!`);
                                    return existingIdNum;
                                }
                            } catch (aiError) {
                                console.error('[DuplicateScanner] Vision AI Judge failed:', aiError.message);
                            }
                        }
                    }
                }
            }
        }

    } catch (error) {
        console.error(`[DuplicateScanner] Failed to run search:`, error.message);
    }

    return null; // No duplicate found
}

module.exports = {
    checkForDuplicate
};
