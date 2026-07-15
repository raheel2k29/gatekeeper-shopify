/**
 * standardizer.js
 * 
 * Takes the cleanly identified supplier name and uses the Shopify API
 * to forcefully overwrite the garbage Vendor data, inject standardized Tags, 
 * rewrite SEO titles/descriptions, and push metafields.
 */
async function standardizeProduct(product, supplierName, categories = [], productType = "Uncategorized", seoTitle = "", seoDescription = "", metafields = []) {
    let shopUrl = process.env.SHOPIFY_STORE_DOMAIN || '';
    const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;

    // Clean URL in case user added https:// or trailing slashes in Vercel env variables
    shopUrl = shopUrl.replace(/^https?:\/\//, '').replace(/\/+$/, '');

    if (!shopUrl || !accessToken) {
        console.error('[Standardizer] Missing Shopify API credentials in .env file.');
        return;
    }

    // Prepare the clean Vendor name
    let cleanVendor = product.vendor; // default to original
    if (supplierName !== 'Manual Entry / Unknown Source') {
        cleanVendor = supplierName;
    } else {
        console.log('[Standardizer] Unknown supplier, will only push category tags.');
    }
    
    // We are CLEARCUTTING the original supplier junk tags. We ONLY want the AI categories.
    let finalTagsArray = [...categories];
    
    // Add the Original Title as a hidden fingerprint tag for the Duplicate Catcher
    const rawTitleTag = `OriginalTitle:${product.title.replace(/,/g, '')}`;
    finalTagsArray.push(rawTitleTag);

    const cleanTags = Array.from(new Set(finalTagsArray)).join(', ');
    
    // INFINITE LOOP PROTECTION: Check if it's already updated
    if (product.vendor === cleanVendor && (product.tags || '') === cleanTags && (product.product_type || '') === productType) {
        console.log('[Standardizer] Product already standardized. Skipping update to prevent loop.');
        return;
    }
    


    // API Endpoint for updating the product
    const endpoint = `https://${shopUrl}/admin/api/2026-07/products/${product.id}.json`;

    try {
        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'X-Shopify-Access-Token': accessToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                product: {
                    id: product.id,
                    vendor: cleanVendor,
                    tags: cleanTags,
                    product_type: productType,
                    title: seoTitle || product.title,
                    body_html: seoDescription || product.body_html
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Shopify REST API error: ${response.status} - ${errorText}`);
        }

        console.log(`[Standardizer] Successfully updated Product ${product.id} via REST.`);

        // --- GRAPHQL METAFIELDS INJECTION ---
        if (metafields && metafields.length > 0) {
            const graphqlEndpoint = `https://${shopUrl}/admin/api/2026-07/graphql.json`;
            const productGid = `gid://shopify/Product/${product.id}`;

            const METAFIELD_DEFS = {
                material: { namespace: 'pns', type: 'single_line_text_field' },
                color: { namespace: 'pns', type: 'single_line_text_field' },
                size: { namespace: 'pns', type: 'single_line_text_field' },
                breed_fit: { namespace: 'pns', type: 'multi_line_text_field' },
                features: { namespace: 'pns', type: 'multi_line_text_field' },
                care: { namespace: 'pns', type: 'multi_line_text_field' },
                safety: { namespace: 'pns', type: 'multi_line_text_field' },
                keywords: { namespace: 'pns', type: 'multi_line_text_field' },
                disclosures: { namespace: 'pns', type: 'multi_line_text_field' }
            };

            const graphqlMetafields = metafields.map(field => {
                const def = METAFIELD_DEFS[field.key] || { namespace: 'custom', type: 'single_line_text_field' };
                return {
                    ownerId: productGid,
                    namespace: def.namespace,
                    key: field.key,
                    value: String(field.value),
                    type: def.type
                };
            });

            const graphqlQuery = `
                mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
                    metafieldsSet(metafields: $metafields) {
                        metafields {
                            id
                            key
                            value
                        }
                        userErrors {
                            field
                            message
                        }
                    }
                }
            `;

            const gqlResponse = await fetch(graphqlEndpoint, {
                method: 'POST',
                headers: {
                    'X-Shopify-Access-Token': accessToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: graphqlQuery,
                    variables: { metafields: graphqlMetafields }
                })
            });

            const gqlData = await gqlResponse.json();
            
            if (gqlData.errors) {
                console.error(`[Standardizer] GraphQL Error:`, JSON.stringify(gqlData.errors));
            } else if (gqlData.data?.metafieldsSet?.userErrors?.length > 0) {
                console.error(`[Standardizer] Metafields UserErrors:`, JSON.stringify(gqlData.data.metafieldsSet.userErrors));
            } else {
                console.log(`[Standardizer] Successfully injected ${metafields.length} Metafields via GraphQL.`);
            }
        }

    } catch (error) {
        console.error(`[Standardizer] Failed to update product ${product.id}:`, error.message);
    }
}

module.exports = {
    standardizeProduct
};
