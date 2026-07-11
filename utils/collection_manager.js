

/**
 * Manages Shopify Custom Collections and assigns products to them.
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

    const baseUrl = `https://${cleanShopUrl}/admin/api/2024-01`;

    try {
        // Step 1: Check if the custom collection already exists
        let collectionId = null;
        
        console.log(`[CollectionManager] Checking if collection "${categoryName}" exists...`);
        const searchResponse = await fetch(`${baseUrl}/custom_collections.json?title=${encodeURIComponent(categoryName)}`, {
            method: 'GET',
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json'
            }
        });

        if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            if (searchData.custom_collections && searchData.custom_collections.length > 0) {
                collectionId = searchData.custom_collections[0].id;
                console.log(`[CollectionManager] Collection found! ID: ${collectionId}`);
            }
        }

        // Step 2: If it doesn't exist, create it
        if (!collectionId) {
            console.log(`[CollectionManager] Collection "${categoryName}" does not exist. Creating it...`);
            const createResponse = await fetch(`${baseUrl}/custom_collections.json`, {
                method: 'POST',
                headers: {
                    'X-Shopify-Access-Token': accessToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    custom_collection: {
                        title: categoryName
                    }
                })
            });

            if (createResponse.ok) {
                const createData = await createResponse.json();
                collectionId = createData.custom_collection.id;
                console.log(`[CollectionManager] Collection created successfully! ID: ${collectionId}`);
            } else {
                console.error(`[CollectionManager] Failed to create collection:`, await createResponse.text());
                return;
            }
        }

        // Step 3: Assign the product to the collection using a Collect
        console.log(`[CollectionManager] Assigning product ${productId} to collection ${collectionId}...`);
        
        // First check if a Collect already exists to prevent duplicates
        const collectSearchResponse = await fetch(`${baseUrl}/collects.json?product_id=${productId}&collection_id=${collectionId}`, {
            method: 'GET',
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json'
            }
        });
        
        if (collectSearchResponse.ok) {
            const collectData = await collectSearchResponse.json();
            if (collectData.collects && collectData.collects.length > 0) {
                console.log(`[CollectionManager] Product is already assigned to this collection.`);
                return;
            }
        }

        // Create the Collect
        const collectResponse = await fetch(`${baseUrl}/collects.json`, {
            method: 'POST',
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                collect: {
                    product_id: productId,
                    collection_id: collectionId
                }
            })
        });

        if (collectResponse.ok) {
            console.log(`[CollectionManager] ✅ Successfully assigned product to collection "${categoryName}"!`);
        } else {
            console.error(`[CollectionManager] Failed to assign product:`, await collectResponse.text());
        }

    } catch (error) {
        console.error('[CollectionManager] Error:', error.message);
    }
}

module.exports = { assignProductToCollection };
