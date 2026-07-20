/**
 * Identifies the dropshipping supplier from the product payload.
 * Pings Shopify Events API if the payload is hidden.
 */
async function identifySupplier(product, rawShopUrl, accessToken) {
    const shopUrl = (rawShopUrl || '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
    let fulfillmentService = null;

    if (product.variants && product.variants.length > 0) {
        fulfillmentService = product.variants[0].fulfillment_service;
    }

    if (fulfillmentService && fulfillmentService !== 'manual') {
        const service = fulfillmentService.toLowerCase();
        
        if (service.includes('zendrop')) return 'Zendrop';
        if (service.includes('cjdropshipping') || service.includes('cj')) return 'CJ Dropshipping';
        if (service.includes('dsers')) return 'DSers';
        if (service.includes('wholesale2b')) return 'Wholesale2B';
        if (service.includes('syncee')) return 'Syncee AI Dropship';
        if (service.includes('topdawg')) return 'TopDawg';
        if (service.includes('appscenic')) return 'AppScenic';
        if (service.includes('petdropshipper')) return 'PetDropshipper';
    }

    // New Fast Local Match: Check if the raw imported vendor matches any known dropship supplier name
    if (product.vendor) {
        const rawVendor = product.vendor.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (rawVendor.includes('zendrop')) return 'Zendrop';
        if (rawVendor.includes('cjdropshipping') || rawVendor.includes('cj')) return 'CJ Dropshipping';
        if (rawVendor.includes('dsers')) return 'DSers';
        if (rawVendor.includes('wholesale2b') || rawVendor.includes('wholesale')) return 'Wholesale2B';
        if (rawVendor.includes('syncee')) return 'Syncee AI Dropship';
        if (rawVendor.includes('topdawg')) return 'TopDawg';
        if (rawVendor.includes('appscenic')) return 'AppScenic';
        if (rawVendor.includes('petdropshipper')) return 'PetDropshipper';
    }
    
    // Fallback 1.5: Check SKU patterns (e.g., DSers/AliExpress uses '#' and ';' dividers in variant SKUs)
    if (product.variants && product.variants.length > 0) {
        const sku = product.variants[0].sku || '';
        if (sku.includes('#') || sku.includes(';')) {
            console.log('[Identifier] Detected DSers/AliExpress SKU pattern. Identifying as DSers.');
            return 'DSers';
        }
    }
    
    // Fallback 2: Check Shopify Events API for true author (Wait 1.5s to ensure Shopify event database synced)
    try {
        await new Promise(res => setTimeout(res, 1500));
        const response = await fetch(`https://${shopUrl}/admin/api/2026-07/products/${product.id}/events.json`, {
            method: 'GET',
            headers: { 'X-Shopify-Access-Token': accessToken }
        });
        const json = await response.json();
        
        console.log(`[Identifier] Fetched events for product ${product.id}. Event count: ${json.events ? json.events.length : 0}`);
        
        if (json.events && json.events.length > 0) {
            const createEvent = json.events.find(e => e.verb === 'create');
            if (createEvent && createEvent.author) {
                const author = createEvent.author.toLowerCase();
                console.log(`[Identifier] Found create event author: ${createEvent.author}`);
                
                if (author.includes('zendrop')) return 'Zendrop';
                if (author.includes('cj') || author.includes('cjdropshipping')) return 'CJ Dropshipping';
                if (author.includes('dsers')) return 'DSers';
                if (author.includes('wholesale2b') || author.includes('wholesale')) return 'Wholesale2B';
                if (author.includes('syncee')) return 'Syncee AI Dropship';
                if (author.includes('topdawg')) return 'TopDawg';
                if (author.includes('appscenic')) return 'AppScenic';
                if (author.includes('petdropshipper')) return 'PetDropshipper';
                
                // If it's a known app but not in the list, just return the app name directly!
                if (author !== 'shopify') {
                    return createEvent.author;
                }
            }
        }
    } catch (e) {
        console.error('[Identifier] Error fetching events API:', e);
    }

    // Fallback 3: Query product variants directly from Shopify to retrieve their actual fulfillment_service values
    try {
        console.log(`[Identifier] Running Fallback 3 (Variants Query) for product ${product.id}`);
        const response = await fetch(`https://${shopUrl}/admin/api/2026-07/products/${product.id}/variants.json`, {
            method: 'GET',
            headers: { 'X-Shopify-Access-Token': accessToken }
        });
        const json = await response.json();
        
        if (json.variants && json.variants.length > 0) {
            const service = (json.variants[0].fulfillment_service || '').toLowerCase();
            console.log(`[Identifier] Found variant fulfillment service on fallback: ${service}`);
            
            if (service && service !== 'manual') {
                if (service.includes('zendrop')) return 'Zendrop';
                if (service.includes('cjdropshipping') || service.includes('cj')) return 'CJ Dropshipping';
                if (service.includes('dsers')) return 'DSers';
                if (service.includes('wholesale2b')) return 'Wholesale2B';
                if (service.includes('syncee')) return 'Syncee AI Dropship';
                if (service.includes('topdawg')) return 'TopDawg';
                if (service.includes('appscenic')) return 'AppScenic';
                if (service.includes('petdropshipper')) return 'PetDropshipper';
            }
        }
    } catch (e) {
        console.error('[Identifier] Fallback 3 variants check failed:', e.message);
    }

    return 'Manual Entry / Unknown Source';
}

module.exports = {
    identifySupplier
};
