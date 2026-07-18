const { GoogleGenAI } = require('@google/genai');

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
                        description
                        metafields(identifiers: [
                            {namespace: "custom", key: "size"},
                            {namespace: "custom", key: "color"},
                            {namespace: "custom", key: "material"}
                        ]) {
                            key
                            value
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
        
        let highestSimilarity = 0;
        let bestCandidate = null;

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
                    continue; 
                }

                // Compare the two AI signatures
                const similarity = diceCoefficient(cleanSignature, targetSignature);
                
                // 1. Text match is highly identical - Duplicate confirmed (Fast & Free)
                if (similarity > 0.80) {
                    console.log(`[DuplicateScanner] 🚨 Duplicate Found via Text Similarity: ${(similarity * 100).toFixed(1)}%`);
                    return existingIdNum;
                }

                // Keep track of the single highest match in the doubt zone (similarity > 0.35)
                if (similarity > 0.35 && similarity > highestSimilarity) {
                    highestSimilarity = similarity;
                    bestCandidate = existingNode;
                }
            }
        }

        // Helper to normalize dimensions from size strings into a comparable centimeter list
        const parseDimensionsToCm = (str) => {
            if (!str) return [];
            const clean = str.toLowerCase();
            const numberRegex = /(\d+(?:\.\d+)?)/g;
            const numbers = clean.match(numberRegex) || [];
            
            // Check if imperial units are present
            const isImperial = clean.includes('inch') || clean.includes('in') || clean.includes('"') || clean.includes('lbs');
            
            return numbers.map(num => {
                const val = parseFloat(num);
                // Convert inches to cm
                return isImperial ? Math.round(val * 2.54) : Math.round(val);
            });
        };

        // 2. Doubt Zone Check: Verify matches using pure JS code comparing custom namespace metafield values
        if (bestCandidate && highestSimilarity > 0.35) {
            const existingIdNum = bestCandidate.id.split('/').pop();

            // Extract the incoming values (which are being processed in index.js right now)
            const incomingMetafields = product.metafields || [];
            const incomingSize = (incomingMetafields.find(m => m.key === 'size')?.value || '').toLowerCase().trim();
            const incomingColor = (incomingMetafields.find(m => m.key === 'color')?.value || '').toLowerCase().trim();
            const incomingMaterial = (incomingMetafields.find(m => m.key === 'material')?.value || '').toLowerCase().trim();

            // Extract the existing values returned by Shopify GraphQL
            const existingMetafields = bestCandidate.metafields || [];
            const existingSize = (existingMetafields.find(m => m.key === 'size')?.value || '').toLowerCase().trim();
            const existingColor = (existingMetafields.find(m => m.key === 'color')?.value || '').toLowerCase().trim();
            const existingMaterial = (existingMetafields.find(m => m.key === 'material')?.value || '').toLowerCase().trim();

            console.log(`[DuplicateScanner] 🔍 Doubt Zone match (${(highestSimilarity * 100).toFixed(1)}%). Performing $0 Pure Metafield Code Matcher...`);
            console.log(`[DuplicateScanner] Incoming Specs: Size="${incomingSize}" | Color="${incomingColor}" | Material="${incomingMaterial}"`);
            console.log(`[DuplicateScanner] Existing Specs: Size="${existingSize}" | Color="${existingColor}" | Material="${existingMaterial}"`);

            // Check if we have enough matching specs to verify. If they are completely blank, fall back to safe uniqueness.
            if (incomingSize || incomingColor || incomingMaterial) {
                
                // Compare size dimensions (normalized to cm to handle metric vs imperial units)
                const inDims = parseDimensionsToCm(incomingSize);
                const exDims = parseDimensionsToCm(existingSize);
                const sizeMatch = inDims.length > 0 && exDims.length > 0 && inDims.sort().join(',') === exDims.sort().join(',');

                // Compare color and material tags
                const colorMatch = incomingColor && existingColor && (incomingColor.includes(existingColor) || existingColor.includes(incomingColor));
                const materialMatch = incomingMaterial && existingMaterial && (incomingMaterial.includes(existingMaterial) || existingMaterial.includes(incomingMaterial));

                // If ALL present specifications match, it's a confirmed duplicate!
                let isDuplicate = false;
                
                if (incomingSize && existingSize) {
                    // Size is the strongest physical constraint
                    if (sizeMatch && (colorMatch || materialMatch)) {
                        isDuplicate = true;
                    }
                } else if (colorMatch && materialMatch) {
                    // Fallback if size is missing but color and material match
                    isDuplicate = true;
                }

                if (isDuplicate) {
                    console.log(`[DuplicateScanner] 🚨 Duplicate confirmed by Pure Metafield Code Matcher!`);
                    return existingIdNum;
                } else {
                    console.log(`[DuplicateScanner] 🟢 Unique product variation confirmed (metafields did not match).`);
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
