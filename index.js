require('dotenv').config();
const express = require('express');
const { identifySupplier } = require('./utils/identifier');
const { standardizeProduct } = require('./utils/standardizer');
const { categorizeProduct } = require('./utils/categorizer');

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
    
    // Dump payload for inspection
    const fs = require('fs');
    fs.writeFileSync(`last_payload_${product.id}.json`, JSON.stringify(product, null, 2));

    console.log(`\n[Gatekeeper] 🚀 Received new product: ${product.title} (ID: ${product.id})`);

    // Step 1: Authentic Identification
    const supplierName = await identifySupplier(
        product, 
        process.env.SHOPIFY_STORE_DOMAIN, 
        process.env.SHOPIFY_ACCESS_TOKEN
    );
    console.log(`[Gatekeeper] 🔍 Authentically identified source: ${supplierName}`);

    // Step 2: Categorization Engine
    const categories = categorizeProduct(product.title, product.body_html || "");
    console.log(`[Gatekeeper] 🏷️ Auto-Generated Tags: [${categories.join(', ')}]`);

    // Step 3: Data Standardization (Fix Vendor & Tags + Inject Categories)
    await standardizeProduct(product, supplierName, categories);
    
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
