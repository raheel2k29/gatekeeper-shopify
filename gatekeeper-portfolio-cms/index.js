document.addEventListener('DOMContentLoaded', () => {
    // Navigation Logic
    const navLinks = document.querySelectorAll('.nav-links li');
    const sections = document.querySelectorAll('.view-section');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Update active section
            const targetId = link.getAttribute('data-target');
            sections.forEach(sec => {
                if(sec.id === targetId) {
                    sec.classList.add('active');
                } else {
                    sec.classList.remove('active');
                }
            });
        });
    });

    // Mock Catalog Data
    const mockProducts = [
        {
            id: 'prod_1',
            title: 'Premium Leather Winter Jacket Men',
            supplier: 'DSers AliExpress',
            rawDesc: '**HOT SALE** Best quality leather jacket! Buy now before sold out!!! Size: M, L, XL, XXL. Color: Black, Brown. Material: PU Leather. Shipping 15-30 days.',
            aiDesc: 'Elevate your winter wardrobe with this premium faux leather jacket. Designed for warmth and style, it features a tailored fit perfect for layering.',
            tags: ['Outerwear', 'Mens', 'Winter'],
            metafields: ['Material: PU Leather', 'Color: Black, Brown']
        },
        {
            id: 'prod_2',
            title: 'Wireless Bluetooth Earbuds 5.0 Waterproof',
            supplier: 'Zendrop',
            rawDesc: 'Cheap wireless earbuds bluetooth 5.0 touch control IPX7 waterproof. Good sound bass. For iPhone Android.',
            aiDesc: 'Experience crystal-clear audio with these Bluetooth 5.0 wireless earbuds. Featuring touch controls and IPX7 water resistance, they are your perfect workout companion.',
            tags: ['Electronics', 'Audio', 'Accessories'],
            metafields: ['Connectivity: Bluetooth 5.0', 'Waterproof: IPX7']
        },
        {
            id: 'prod_3',
            title: 'Home Decor Ceramic Vase Modern Minimalist',
            supplier: 'CJ Dropshipping',
            rawDesc: 'beautiful ceramic vase for living room decoration white black modern simple style high quality free shipping.',
            aiDesc: 'Add a touch of modern minimalism to your living space with this elegant ceramic vase. Its sleek silhouette and matte finish complement any interior decor.',
            tags: ['Home & Decor', 'Accents'],
            metafields: ['Material: Ceramic', 'Style: Minimalist']
        }
    ];

    const productListEl = document.getElementById('product-list');
    const productDetailsEl = document.getElementById('product-details');

    function renderProductList() {
        productListEl.innerHTML = '';
        mockProducts.forEach(product => {
            const item = document.createElement('div');
            item.className = 'product-item';
            item.innerHTML = `
                <h4>${product.title}</h4>
                <p>${product.supplier}</p>
            `;
            item.addEventListener('click', () => {
                document.querySelectorAll('.product-item').forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                renderProductDetails(product);
            });
            productListEl.appendChild(item);
        });
    }

    function renderProductDetails(product) {
        productDetailsEl.innerHTML = `
            <div class="details-content">
                <div class="details-header">
                    <h2>${product.title}</h2>
                    <span class="supplier-badge">${product.supplier}</span>
                </div>
                <div class="comparison-grid">
                    <div class="comparison-col">
                        <h3>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2L2 22h20L12 2z"/>
                            </svg>
                            Raw Supplier Data
                        </h3>
                        <div class="raw-box">${product.rawDesc}</div>
                    </div>
                    <div class="comparison-col">
                        <h3>
                            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--accent-emerald)" stroke-width="2">
                                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
                                <polyline points="22 4 12 14.01 9 11.01"/>
                            </svg>
                            AI Optimized Result
                        </h3>
                        <div class="ai-box">
                            <p>${product.aiDesc}</p>
                        </div>
                        <div class="metafields-box">
                            <h4>Generated Tags</h4>
                            <div style="margin: 0.5rem 0 1rem;">
                                ${product.tags.map(t => `<span class="metafield-pill">${t}</span>`).join('')}
                            </div>
                            <h4>PNS Metafields</h4>
                            <div style="margin-top: 0.5rem;">
                                ${product.metafields.map(m => `<span class="metafield-pill" style="background: var(--accent-cyan-dim); color: var(--accent-cyan);">${m}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderProductList();

    // Webhook Simulator Logic
    const simForm = document.getElementById('simulator-form');
    const terminalOutput = document.getElementById('terminal-output');
    const btnSubmit = simForm.querySelector('button[type="submit"]');
    
    // Stats elements
    const statSkus = document.getElementById('stat-skus');
    const statSavings = document.getElementById('stat-savings');

    function addLogLine(text, type = 'info') {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        const line = document.createElement('div');
        line.className = 'log-line';
        line.innerHTML = `<span class="time">[${time}]</span> <span class="${type}">${text}</span>`;
        terminalOutput.appendChild(line);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    simForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const supplier = document.getElementById('sim-supplier').value;
        const title = document.getElementById('sim-title').value;

        btnSubmit.disabled = true;
        btnSubmit.innerHTML = 'Processing...';

        terminalOutput.innerHTML = '';
        addLogLine(`Received webhook payload from ${supplier}...`, 'info');

        setTimeout(() => {
            addLogLine(`Authentication successful. Validating payload signature.`, 'info');
        }, 600);

        setTimeout(() => {
            addLogLine(`Duplicate Scanner running: Dice coefficient comparison against cache.`, 'warning');
        }, 1400);

        setTimeout(() => {
            addLogLine(`No duplicates found. Forwarding to AI Copywriting engine...`, 'info');
        }, 2200);

        setTimeout(() => {
            addLogLine(`Generating optimized title and description...`, 'info');
        }, 3000);

        setTimeout(() => {
            addLogLine(`Mapping Metafield layout (PNS Namespace color/material/size mapped).`, 'info');
        }, 4000);

        setTimeout(() => {
            addLogLine(`Taxonomy matching: Leaf node taxonomy categories selected.`, 'info');
        }, 4800);

        setTimeout(() => {
            addLogLine(`Success! Product "${title}" saved to dashboard database.`, 'success');
            
            // Update stats
            let currentSkus = parseInt(statSkus.innerText.replace(/,/g, ''));
            statSkus.innerText = (currentSkus + 1).toLocaleString();
            
            let currentSavings = parseInt(statSavings.innerText.replace(/[\$,]/g, ''));
            statSavings.innerText = '$' + (currentSavings + 15).toLocaleString();

            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                Process Product
            `;

            // Optionally add to catalog mock
            const newProduct = {
                id: 'prod_' + Date.now(),
                title: title,
                supplier: supplier,
                rawDesc: document.getElementById('sim-desc').value,
                aiDesc: 'AI Generated Description based on raw input. Optimized for high conversion and readability.',
                tags: ['New Arrival', 'Automated'],
                metafields: ['Status: Active', 'Sync: Complete']
            };
            mockProducts.unshift(newProduct);
            renderProductList();

        }, 5800);
    });

});
