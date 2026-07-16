/**
 * duplicate_scanner.js
 * 
 * Uses the AI-generated Core Signature to find exact duplicate products.
 */

async function checkForDuplicate(core_signature, incomingProductId) {
    if (!core_signature || core_signature.length < 3) return null;

    let shopUrl = process.env.SHOPIFY_STORE_DOMAIN || '';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    shopUrl = shopUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');

    if (!shopUrl || !accessToken) return null;

    // Clean the signature to ensure consistent matching
    const cleanSignature = core_signature.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
    const searchTag = `Signature:${cleanSignature}`;

    // Query Shopify for any product containing this exact Signature tag
    const graphqlEndpoint = `https://${shopUrl}/admin/api/2026-07/graphql.json`;
    const graphqlQuery = `
        query searchDuplicates($query: String!) {
            products(first: 5, query: $query) {
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
                // Shopify GraphQL query syntax for tag: tag:"Signature:folding car dog stairs"
                variables: { query: `tag:"${searchTag}"` }
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

            // Verify the tag actually exists exactly (just in case GraphQL fuzzy matched)
            const tags = existingNode.tags || [];
            if (tags.includes(searchTag)) {
                console.log(`[DuplicateScanner] 🚨 Duplicate Found via AI Signature: "${cleanSignature}"`);
                console.log(`[DuplicateScanner] Matches existing product ID: ${existingIdNum}`);
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
