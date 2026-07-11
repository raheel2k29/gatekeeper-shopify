require('dotenv').config();
const express = require('express');
const { identifySupplier } = require('./utils/identifier');
const { standardizeProduct } = require('./utils/standardizer');
const { categorizeProduct } = require('./utils/categorizer');
const { assignProductToCollection } = require('./utils/collection_manager');

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

    // Step 1: Authentic Identification
    const supplierName = await identifySupplier(
        product, 
        process.env.SHOPIFY_STORE_DOMAIN, 
        process.env.SHOPIFY_ACCESS_TOKEN
    );
    console.log(`[Gatekeeper] 🔍 Authentically identified source: ${supplierName}`);

    // Step 2: AI Categorization Engine
    const aiResult = await categorizeProduct(product.title, product.body_html || "");
    const tags = aiResult.tags || [];
    const category = aiResult.category || "Uncategorized";
    
    console.log(`[Gatekeeper] 🏷️ AI-Generated Tags: [${tags.join(', ')}]`);
    console.log(`[Gatekeeper] 📂 AI-Generated Category: ${category}`);

    // Step 3: Data Standardization (Fix Vendor & Tags)
    await standardizeProduct(product, supplierName, tags);
    
    // Step 4: Collection Assignment
    await assignProductToCollection(
        product.id,
        category,
        process.env.SHOPIFY_STORE_DOMAIN,
        process.env.SHOPIFY_ACCESS_TOKEN
    );
    
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
