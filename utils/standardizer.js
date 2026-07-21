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
    const cleanTags = Array.from(new Set(finalTagsArray)).join(', ');

    // Extract signature to be saved in the hidden metafield vault (fully hidden from UI/shoppers)
    let cleanSignature = "";
    if (coreSignature && coreSignature.length > 2) {
        cleanSignature = coreSignature.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
    }

    // The ultimate SEO cache to protect against dropship apps overwriting our data
    const seoCache = {
        title: seoTitle || product.title,
        body_html: seoDescription || product.body_html,
        tags: cleanTags,
        vendor: cleanVendor,
        product_type: productType,
        signature: cleanSignature
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
        // --- GRAPHQL CATEGORY TAXONOMY UPDATE ---
        const { CATEGORY_TAXONOMY_MAP } = require('./categories');
        const taxonomyGid = CATEGORY_TAXONOMY_MAP[productType];
        const graphqlEndpoint = `https://${shopUrl}/admin/api/2026-07/graphql.json`;
        const productGid = `gid://shopify/Product/${product.id}`;

        if (taxonomyGid) {
            console.log(`[Standardizer] Mapping Category "${productType}" to Taxonomy GID: ${taxonomyGid}`);
            const categoryQuery = `
                mutation productCategoryUpdate($input: ProductInput!) {
                    productUpdate(input: $input) {
                        product {
                            id
                            category {
                                id
                                fullName
                            }
                        }
                        userErrors {
                            field
                            message
                        }
                    }
                }
            `;

            try {
                const catResponse = await fetch(graphqlEndpoint, {
                    method: 'POST',
                    headers: {
                        'X-Shopify-Access-Token': accessToken,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: categoryQuery,
                        variables: {
                            input: {
                                id: productGid,
                                category: taxonomyGid
                            }
                        }
                    })
                });
                const catData = await catResponse.json();
                if (catData.errors) {
                    console.error(`[Standardizer] Category Update GraphQL Error:`, JSON.stringify(catData.errors));
                } else if (catData.data?.productUpdate?.userErrors?.length > 0) {
                    console.error(`[Standardizer] Category Update UserErrors:`, JSON.stringify(catData.data.productUpdate.userErrors));
                } else {
                    console.log(`[Standardizer] Successfully assigned native category to: ${catData.data.productUpdate.product.category.fullName}`);
                }
            } catch (err) {
                console.error(`[Standardizer] Failed to update category taxonomy:`, err.message);
            }
        }

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

            // --- HYBRID CATEGORY METAFELDS RESOLVER ---
            // Maps common textual values into Shopify's standard taxonomy metafields safely (excluding custom unmapped values to prevent validation errors)
            const TAXONOMY_VALUES_MAP = {
                // Animals (animal-type)
                "dog": "gid://shopify/TaxonomyValue/8225",
                "dogs": "gid://shopify/TaxonomyValue/8225",
                "cat": "gid://shopify/TaxonomyValue/8223",
                "cats": "gid://shopify/TaxonomyValue/8223",
                "bird": "gid://shopify/TaxonomyValue/16979",
                "birds": "gid://shopify/TaxonomyValue/16979",
                "rabbit": "gid://shopify/TaxonomyValue/7571",
                "rabbits": "gid://shopify/TaxonomyValue/7571",

                // Colors (color-pattern)
                "striped": "gid://shopify/TaxonomyValue/24477",
                "black": "gid://shopify/TaxonomyValue/1",
                "blue": "gid://shopify/TaxonomyValue/2",
                "brown": "gid://shopify/TaxonomyValue/17",
                "gold": "gid://shopify/TaxonomyValue/4",
                "gray": "gid://shopify/TaxonomyValue/6",
                "grey": "gid://shopify/TaxonomyValue/6",
                "green": "gid://shopify/TaxonomyValue/7",
                "orange": "gid://shopify/TaxonomyValue/9",
                "pink": "gid://shopify/TaxonomyValue/10",
                "purple": "gid://shopify/TaxonomyValue/12",
                "red": "gid://shopify/TaxonomyValue/13",
                "silver": "gid://shopify/TaxonomyValue/5",
                "white": "gid://shopify/TaxonomyValue/3",
                "yellow": "gid://shopify/TaxonomyValue/14",

                // Materials (material)
                "acrylic": "gid://shopify/TaxonomyValue/67",
                "aluminum": "gid://shopify/TaxonomyValue/1637",
                "bamboo": "gid://shopify/TaxonomyValue/22509",
                "brass": "gid://shopify/TaxonomyValue/656",
                "bronze": "gid://shopify/TaxonomyValue/16936",
                "canvas": "gid://shopify/TaxonomyValue/605",
                "cardboard": "gid://shopify/TaxonomyValue/773",
                "ceramic": "gid://shopify/TaxonomyValue/643",
                "clay": "gid://shopify/TaxonomyValue/879",
                "copper": "gid://shopify/TaxonomyValue/666",
                "cork": "gid://shopify/TaxonomyValue/596",
                "cotton": "gid://shopify/TaxonomyValue/40",
                "glass": "gid://shopify/TaxonomyValue/644",
                "hemp": "gid://shopify/TaxonomyValue/608",
                "iron": "gid://shopify/TaxonomyValue/613",
                "leather": "gid://shopify/TaxonomyValue/759",
                "linen": "gid://shopify/TaxonomyValue/614",
                "metal": "gid://shopify/TaxonomyValue/615",
                "nylon": "gid://shopify/TaxonomyValue/616",
                "paper": "gid://shopify/TaxonomyValue/775",
                "plastic": "gid://shopify/TaxonomyValue/617",
                "polyester": "gid://shopify/TaxonomyValue/618",
                "rubber": "gid://shopify/TaxonomyValue/764",
                "silicone": "gid://shopify/TaxonomyValue/809",
                "silk": "gid://shopify/TaxonomyValue/22531",
                "steel": "gid://shopify/TaxonomyValue/620",
                "wood": "gid://shopify/TaxonomyValue/625",
                "wool": "gid://shopify/TaxonomyValue/51"
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

            // Parse color, material, and breed fit/animal types to dynamically populate Shopify standard fields
            const colorField = metafields.find(f => f.key === 'color');
            if (colorField && colorField.value) {
                const cleanVal = String(colorField.value).toLowerCase().trim();
                const matchedGid = TAXONOMY_VALUES_MAP[cleanVal];
                if (matchedGid) {
                    graphqlMetafields.push({
                        ownerId: productGid,
                        namespace: 'shopify',
                        key: 'color-pattern',
                        value: JSON.stringify([matchedGid]),
                        type: 'list.metaobject_reference'
                    });
                }
            }

            const materialField = metafields.find(f => f.key === 'material');
            if (materialField && materialField.value) {
                const cleanVal = String(materialField.value).toLowerCase().trim();
                const matchedGid = TAXONOMY_VALUES_MAP[cleanVal];
                if (matchedGid) {
                    graphqlMetafields.push({
                        ownerId: productGid,
                        namespace: 'shopify',
                        key: 'material',
                        value: JSON.stringify([matchedGid]),
                        type: 'list.metaobject_reference'
                    });
                }
            }

            // Always default standard animal type to Dogs since this is a dog/pet gear store
            graphqlMetafields.push({
                ownerId: productGid,
                namespace: 'shopify',
                key: 'animal-type',
                value: JSON.stringify(["gid://shopify/TaxonomyValue/8225"]), // Dogs
                type: 'list.metaobject_reference'
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
                console.log(`[Standardizer] Successfully injected ${graphqlMetafields.length} Metafields (including Category Metafields) via GraphQL.`);
            }
        }

    } catch (error) {
        console.error(`[Standardizer] Failed to update product ${product.id}:`, error.message);
    }
}

module.exports = {
    standardizeProduct
};
