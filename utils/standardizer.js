/**
 * standardizer.js
 * 
 * Takes the cleanly identified supplier name and uses the Shopify API
 * to forcefully overwrite the garbage Vendor data, inject standardized Tags, 
 * rewrite SEO titles/descriptions, and push metafields.
 */
async function standardizeProduct(product, supplierName, categories = [], productType = "Uncategorized", seoTitle = "", seoDescription = "", metafields = [], coreSignature = "") {
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
    
    // Add the AI Fingerprint as a hidden tag for the Duplicate Catcher
    if (coreSignature && coreSignature.length > 2) {
        const cleanSignature = coreSignature.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
        finalTagsArray.push(`Signature:${cleanSignature}`);
    }

    const cleanTags = Array.from(new Set(finalTagsArray)).join(', ');

    // The ultimate SEO cache to protect against dropship apps overwriting our data
    const seoCache = {
        title: seoTitle || product.title,
        body_html: seoDescription || product.body_html,
        tags: cleanTags,
        vendor: cleanVendor,
        product_type: productType
    };

    // INFINITE LOOP PROTECTION: Check if it's already updated
    if (product.vendor === cleanVendor && (product.tags || '') === cleanTags && (product.product_type || '') === productType) {
        console.log('[Standardizer] Product already standardized. Skipping update to prevent loop.');
        return;
    }
    
    try {
        console.log(`[Standardizer] Pushing clean tags, SEO content, and injecting ${metafields.length + 1} metafields to Shopify for Product ${product.id}...`);
        
        // Prepare the base payload
        const payload = {
            product: {
                id: product.id,
                vendor: cleanVendor,
                tags: cleanTags,
                product_type: productType,
                title: seoTitle || product.title,
                body_html: seoDescription || product.body_html,
                metafields: [
                    {
                        namespace: 'gatekeeper',
                        key: 'seo_cache',
                        value: JSON.stringify(seoCache),
                        type: 'multi_line_text_field'
                    }
                ]
            }
        };

        // Add UI metafields with proper Shopify schema to prevent 422 API errors
        if (metafields && Array.isArray(metafields)) {
            const formattedMetafields = metafields.map(m => ({
                namespace: 'custom',
                key: m.key || 'unknown',
                value: String(m.value || ''),
                type: 'single_line_text_field'
            }));
            payload.product.metafields.push(...formattedMetafields);
        }

        const response = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2026-07/products/${product.id}.json`, {
            method: 'PUT',
            headers: {
                'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }); if (!response.ok) {
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
