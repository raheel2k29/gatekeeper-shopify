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
    
    const cleanTags = Array.from(new Set(finalTagsArray)).join(', ');
    
    // INFINITE LOOP PROTECTION: Check if it's already updated
    if (product.vendor === cleanVendor && (product.tags || '') === cleanTags && (product.product_type || '') === productType) {
        console.log('[Standardizer] Product already standardized. Skipping update to prevent loop.');
        return;
    }
    
    // Prepare Metafields Array
    const shopifyMetafields = metafields.map(field => ({
        namespace: "custom",
        key: field.key,
        value: String(field.value),
        type: "single_line_text_field"
    }));

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
                    body_html: seoDescription || product.body_html,
                    metafields: shopifyMetafields
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
        }

        console.log(`[Standardizer] Successfully cleaned Product ${product.id}. Vendor set to: "${cleanVendor}"`);
    } catch (error) {
        console.error(`[Standardizer] Failed to update product ${product.id}:`, error.message);
    }
}

module.exports = {
    standardizeProduct
};
