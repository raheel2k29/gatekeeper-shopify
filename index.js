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

// Webhook endpoint for product creation
app.post('/webhook/products/create', async (req, res) => {
    // Processing begins (Vercel Serverless requires us to wait until finished before sending response)
    const product = req.body;
    
    if (!product || !product.id) {
        return;
    }
    
    // We are on a read-only filesystem in Vercel, so do not write payloads to disk
    // (You can view payloads in Vercel logs if needed)

    console.log(`\n[Gatekeeper] 🚀 Received new product: ${product.title} (ID: ${product.id})`);

    // EARLY EXIT: If the product already has a Product Type that matches one of our 
    // exact 114 Mega Menu Categories (or it failed and is awaiting manual review), 
    // it means Gatekeeper has already fully processed it.
    // This allows us to keep tags clean for visitors while preventing infinite API loops.
    if (product.product_type && (MEGA_MENU_CATEGORIES.includes(product.product_type) || product.product_type === 'Requires Manual Review')) {
        console.log(`[Gatekeeper] ⏭️ Product Type is already "${product.product_type}". Skipping API calls to save credits.`);
        return res.status(200).send('Already processed');
    }

    // Step 0: Duplicate Catcher
    const duplicateId = await checkForDuplicate(product);
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

    // Step 1: Authentic Identification
    const supplierName = await identifySupplier(
        product, 
        process.env.SHOPIFY_STORE_DOMAIN, 
        process.env.SHOPIFY_ACCESS_TOKEN
    );
    console.log(`[Gatekeeper] 🔍 Authentically identified source: ${supplierName}`);

    // Step 2: AI Categorization Engine
    const aiResult = await categorizeProduct(product.title, product.body_html || "");
    const { tags, category, seo_title, seo_description, metafields } = aiResult;

    console.log(`[Gatekeeper] 🧠 AI Categorization Complete: ${category} | Tags: ${tags.join(', ')}`);

    // 4. STANDARDIZE & CLEAN: Push the new supplier, tags, seo content, and metafields to Shopify
    await standardizeProduct(product, supplierName, tags, category, seo_title, seo_description, metafields);
    
    // Collection Assignment is now perfectly handled by Shopify Native Automated Collections
    // based on the Product Type we just injected above!
    
    console.log(`[Gatekeeper] ✅ Product processing complete.\n`);
    
    // Now that all async work is done, send the response so Vercel can close the function
    res.status(200).send('Webhook processed');
});

// Vercel Serverless Export
if (process.env.VERCEL) {
    module.exports = app;
} else {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`[Gatekeeper] Server is running and listening for webhooks on port ${port}`);
    });
}
