/**
 * duplicate_scanner.js
 * 
 * Uses a Fuzzy Text Match (Dice Coefficient) to compare incoming products
 * against the 'OriginalTitle' fingerprints hidden in existing products.
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
    // Sort by length descending, pick top 3
    words.sort((a, b) => b.length - a.length);
    return words.slice(0, 3);
}

/**
 * Searches the store for a duplicate product
 * Returns the duplicate's ID if found, otherwise null.
 */
async function checkForDuplicate(incomingProduct) {
    let shopUrl = process.env.SHOPIFY_STORE_DOMAIN || '';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    shopUrl = shopUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');

    if (!shopUrl || !accessToken) return null;

    const keywords = getKeywords(incomingProduct.title);
    if (keywords.length === 0) return null; // Title too short to search reliably

    // Build query: "keyword1 OR keyword2 OR keyword3"
    const searchQuery = keywords.join(' OR ');

    const graphqlEndpoint = `https://${shopUrl}/admin/api/2026-07/graphql.json`;
    const graphqlQuery = `
        query searchDuplicates($query: String!) {
            products(first: 20, query: $query) {
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
            const existingIdNum = existingNode.id.split('/').pop(); // "gid://shopify/Product/123" -> "123"
            
            // Skip the product we are currently evaluating!
            if (String(existingIdNum) === String(incomingProduct.id)) {
                continue;
            }

            // Find the OriginalTitle fingerprint in the tags
            const tags = existingNode.tags || [];
            const originalTitleTag = tags.find(t => t.startsWith('OriginalTitle:'));
            
            let targetTitle = '';
            if (originalTitleTag) {
                targetTitle = originalTitleTag.replace('OriginalTitle:', '').trim();
            } else {
                // Fallback for older products before we implemented this
                targetTitle = existingNode.title || '';
            }

            // Calculate similarity between the incoming title and the target fingerprint
            const similarity = diceCoefficient(incomingProduct.title.toLowerCase(), targetTitle.toLowerCase());
            
            if (similarity > 0.85) {
                console.log(`[DuplicateScanner] 🚨 Duplicate Found! Similarity: ${(similarity * 100).toFixed(1)}%`);
                console.log(`[DuplicateScanner] Incoming: "${incomingProduct.title}"`);
                console.log(`[DuplicateScanner] Existing: "${targetTitle}" (ID: ${existingIdNum})`);
                return existingIdNum; // Duplicate found!
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
