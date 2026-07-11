/**
 * collection_manager.js
 * Manages Shopify Collections and assigns products using the modern GraphQL Admin API.
 */
async function assignProductToCollection(productId, categoryName, shopUrl, accessToken) {
    if (!categoryName || categoryName === "Uncategorized") {
        console.log('[CollectionManager] Category is Uncategorized. Skipping collection assignment.');
        return;
    }

    const cleanShopUrl = (shopUrl || '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (!cleanShopUrl || !accessToken) {
        console.error('[CollectionManager] Missing Shopify API credentials.');
        return;
    }

    const graphqlUrl = `https://${cleanShopUrl}/admin/api/2026-07/graphql.json`;
    const headers = {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
    };

    try {
        // Step 1: Search for the collection
        console.log(`[CollectionManager] Checking if collection "${categoryName}" exists via GraphQL...`);
        let collectionId = null;

        const searchQuery = `
            query($query: String!) {
                collections(first: 1, query: $query) {
                    edges {
                        node {
                            id
                        }
                    }
                }
            }
        `;

        const searchRes = await fetch(graphqlUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                query: searchQuery,
                variables: { query: `title:'${categoryName}'` }
            })
        });

        const searchJson = await searchRes.json();
        const collections = searchJson?.data?.collections?.edges || [];

        if (collections.length > 0) {
            collectionId = collections[0].node.id;
            console.log(`[CollectionManager] Collection found! ID: ${collectionId}`);
        }

        // Step 2: Create collection if it doesn't exist
        if (!collectionId) {
            console.log(`[CollectionManager] Collection "${categoryName}" does not exist. Creating it...`);
            const createMutation = `
                mutation collectionCreate($input: CollectionInput!) {
                    collectionCreate(input: $input) {
                        collection {
                            id
                        }
                        userErrors {
                            field
                            message
                        }
                    }
                }
            `;

            const createRes = await fetch(graphqlUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    query: createMutation,
                    variables: { input: { title: categoryName } }
                })
            });

            const createJson = await createRes.json();
            const createPayload = createJson?.data?.collectionCreate;

            if (createPayload?.userErrors?.length > 0) {
                console.error(`[CollectionManager] Failed to create collection:`, createPayload.userErrors);
                return;
            }

            collectionId = createPayload?.collection?.id;
            console.log(`[CollectionManager] Collection created successfully! ID: ${collectionId}`);
        }

        // Step 3: Assign product to collection
        if (!collectionId) return;

        console.log(`[CollectionManager] Assigning product ${productId} to collection ${collectionId}...`);
        
        // Ensure product ID is in Global ID format
        const globalProductId = productId.toString().includes('gid://') 
            ? productId 
            : `gid://shopify/Product/${productId}`;

        const addMutation = `
            mutation collectionAddProducts($id: ID!, $productIds: [ID!]!) {
                collectionAddProducts(id: $id, productIds: $productIds) {
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        const addRes = await fetch(graphqlUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                query: addMutation,
                variables: {
                    id: collectionId,
                    productIds: [globalProductId]
                }
            })
        });

        const addJson = await addRes.json();
        const addErrors = addJson?.data?.collectionAddProducts?.userErrors || [];

        if (addErrors.length > 0) {
            console.error(`[CollectionManager] Failed to assign product:`, addErrors);
        } else {
            console.log(`[CollectionManager] ✅ Successfully assigned product to collection "${categoryName}"!`);
        }

    } catch (error) {
        console.error('[CollectionManager] Error:', error.message);
    }
}

module.exports = { assignProductToCollection };
