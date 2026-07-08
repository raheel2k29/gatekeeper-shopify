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
    
    // Fallback: Check Shopify Events API for true author
    try {
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
                if (author.includes('cj')) return 'CJ Dropshipping';
                if (author.includes('dsers')) return 'DSers';
                if (author.includes('wholesale2b')) return 'Wholesale2B';
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

    return 'Manual Entry / Unknown Source';
}

module.exports = {
    identifySupplier
};
