require('dotenv').config();
const express = require('express');
const { identifySupplier } = require('./utils/identifier');
const { standardizeProduct } = require('./utils/standardizer');
const { categorizeProduct } = require('./utils/categorizer');
const { MEGA_MENU_CATEGORIES } = require('./utils/categories');
const { checkForDuplicate } = require('./utils/duplicate_scanner');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// In-Memory Thread Lock Cache to drop parallel webhooks for the same product
const activeLocks = new Set();

// Throttling Queue: Ensures different products are processed sequentially with a delay, avoiding Quota Limit Exhaustion
let queuePromise = Promise.resolve();
const delay = (ms) => new Promise(res => setTimeout(res, ms));

// Webhook endpoint for product creation
app.post('/webhook/products/create', async (req, res) => {
    // Processing begins (Vercel Serverless requires us to wait until finished before sending response)
    const product = req.body;
    
    if (!product || !product.id) {
        return res.status(400).send('Invalid payload');
    }
    
    const productIdStr = String(product.id);

    // If this product is already being processed by another active webhook thread, drop it!
    if (activeLocks.has(productIdStr)) {
        console.log(`[Gatekeeper] 🛑 Webhook Lock Active for Product ID: ${productIdStr}. Dropping concurrent request to prevent credit waste.`);
        return res.status(200).send('Concurrent request locked out');
    }

    // Set lock
    activeLocks.add(productIdStr);

    // Helper to release the lock cleanly
    const releaseLock = () => {
        activeLocks.delete(productIdStr);
        console.log(`[Gatekeeper] 🔓 Lock released for Product ID: ${productIdStr}`);
    };

    console.log(`\n[Gatekeeper] 🚀 Received new product: ${product.title} (ID: ${product.id}). Queueing...`);

    // Chain to our sequential throttling queue
    queuePromise = queuePromise.then(async () => {
        try {
            // Introduce a 5-second buffer delay to keep under the GCP enterprise requests-per-minute quota limits
            await delay(5000);
            await processProduct(product, res);
        } catch (queueErr) {
            console.error('[Gatekeeper] Error in queue execution:', queueErr);
            if (!res.headersSent) {
                res.status(500).send('Queue processing failed');
            }
        } finally {
            releaseLock();
        }
    });
});

async function processProduct(product, res) {
    try {
        // EARLY EXIT: If the product already has a Product Type that matches one of our 
        // exact 114 Mega Menu Categories (or it failed and is awaiting manual review), 
        // it means Gatekeeper has already fully processed it.
        // This allows us to keep tags clean for visitors while preventing infinite API loops.
        if (product.product_type && (MEGA_MENU_CATEGORIES.includes(product.product_type) || product.product_type === 'Requires Manual Review')) {
            console.log(`[Gatekeeper] ⏭️ Product Type is already "${product.product_type}". Skipping API calls to save credits.`);
            return res.status(200).send('Already processed');
        }

        // Step 0: Filter out products that have already been processed to prevent infinite loops!
        // NEW UNKILLABLE SEO BODYGUARD LOGIC
        try {
            const metafieldsRes = await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2026-07/products/${product.id}/metafields.json`, {
                headers: { 'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN }
            });
            const metafieldsData = await metafieldsRes.json();
            
            if (metafieldsData && metafieldsData.metafields) {
                const cacheMetafield = metafieldsData.metafields.find(m => m.namespace === 'gatekeeper' && m.key === 'seo_cache');
                
                if (cacheMetafield) {
                    const cache = JSON.parse(cacheMetafield.value);
                    
                    // Compare critical SEO fields (sorting tags to prevent Shopify alphabetical ordering loops)
                    const titleMatches = product.title === cache.title;
                    const sortTags = (t) => (t || '').split(',').map(s=>s.trim()).sort().join(',');
                    const tagsMatch = sortTags(product.tags) === sortTags(cache.tags);
                    
                    if (titleMatches && tagsMatch) {
                        console.log('[Gatekeeper] 🛡️ Product matches Metafield Vault. Already fully optimized. Exiting.');
                        return res.status(200).send('Matches Vault');
                    } else {
                        console.log('[Gatekeeper] 🚨 Supplier overwrite detected! Bypassing AI and restoring from Metafield Vault!');
                        
                        // Restore from cache directly!
                        await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2026-07/products/${product.id}.json`, {
                            method: 'PUT',
                            headers: {
                                'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                product: {
                                    id: product.id,
                                    title: cache.title,
                                    body_html: cache.body_html,
                                    tags: cache.tags,
                                    vendor: cache.vendor,
                                    product_type: cache.product_type
                                }
                            })
                        });
                        
                        console.log('[Gatekeeper] 🛡️ Vault restoration complete.');
                        return res.status(200).send('Restored from Vault');
                    }
                }
            }
        } catch (e) {
            console.error('[Gatekeeper] Error checking metafield cache:', e);
        }

        // Fallback: If no cache exists, but we see the Signature tag, we still exit
        if (product.tags && (product.tags.includes('Signature:') || product.tags.includes('Duplicate'))) {
            console.log('[Gatekeeper] Product already processed (Signature/Duplicate tag found but no cache). Exiting.');
            return res.status(200).send('Already processed');
        }

        // Step 1: Authentic Identification
        const supplierName = await identifySupplier(
            product, 
            process.env.SHOPIFY_STORE_DOMAIN, 
            process.env.SHOPIFY_ACCESS_TOKEN
        );
        console.log(`[Gatekeeper] 🔍 Authentically identified source: ${supplierName}`);

        // Step 2: AI Categorization Engine (Using standard gemini-1.5-flash as the fallback)
        const aiResult = await categorizeProduct(product.title, product.body_html || "");
        const { core_signature, tags, category, seo_title, seo_description, metafields } = aiResult;

        console.log(`[Gatekeeper] 🧠 AI Categorization Complete: ${category} | Tags: ${tags.join(', ')}`);

        // Step 2.5: AI Signature Duplicate Catcher
        const duplicateId = await checkForDuplicate(core_signature, { ...product, metafields });
        if (duplicateId) {
            console.log(`[Gatekeeper] 🛑 Duplicate caught! Tagging as Duplicate and hiding in Drafts. Matches Product ID: ${duplicateId}`);
            try {
                // Push draft status and tag to Shopify
                await fetch(`https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/2026-07/products/${product.id}.json`, {
                    method: 'PUT',
                    headers: {
                        'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        product: {
                            id: product.id,
                            status: "draft",
                            tags: (product.tags ? product.tags + ", " : "") + "Duplicate"
                        }
                    })
                });
                console.log(`[Gatekeeper] ✅ Duplicate successfully hidden. Exiting.`);
            } catch (e) {
                console.error(`[Gatekeeper] Error hiding duplicate:`, e);
            }
            return res.status(200).send('Duplicate caught');
        }

        // 4. STANDARDIZE & CLEAN: Push the new supplier, tags, seo content, and metafields to Shopify
        await standardizeProduct(product, supplierName, tags, category, seo_title, seo_description, metafields, core_signature);
        
        console.log(`[Gatekeeper] ✅ Product processing complete.\n`);
        
        // Send the response
        res.status(200).send('Webhook processed');
    } catch (err) {
        console.error('[Gatekeeper] Error standardizing product:', err.message);
        if (!res.headersSent) {
            res.status(500).send('Error processing product');
        }
    }
}

// Vercel Serverless Export
if (process.env.VERCEL) {
    module.exports = app;
} else {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`[Gatekeeper] Server is running and listening for webhooks on port ${port}`);
    });
}
