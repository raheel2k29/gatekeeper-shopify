/**
 * duplicate_scanner.js
 * 
 * Uses the AI-generated Core Signature and fuzzy matching to find exact duplicate products.
 */

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

async function checkForDuplicate(core_signature, incomingProductId) {
    if (!core_signature || core_signature.length < 3) return null;

    let shopUrl = process.env.SHOPIFY_STORE_DOMAIN || '';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    shopUrl = shopUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');

    if (!shopUrl || !accessToken) return null;

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
                
                // Compare the two AI signatures
                const similarity = diceCoefficient(cleanSignature, targetSignature);
                
                // Because AI signatures are highly stripped and specific (e.g. "silent dog training whistle")
                // an 80% match means they are definitively the same object.
                if (similarity > 0.80) {
                    console.log(`[DuplicateScanner] 🚨 Duplicate Found! Similarity: ${(similarity * 100).toFixed(1)}%`);
                    console.log(`[DuplicateScanner] Incoming Signature: "${cleanSignature}"`);
                    console.log(`[DuplicateScanner] Existing Signature: "${targetSignature}" (ID: ${existingIdNum})`);
                    return existingIdNum; // Duplicate found!
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
