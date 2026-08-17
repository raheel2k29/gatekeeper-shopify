document.addEventListener('DOMContentLoaded', () => {
    // Live Metrics Simulator
    const cpuEl = document.getElementById('metric-cpu');
    const latencyEl = document.getElementById('metric-latency');
    const tokensEl = document.getElementById('metric-tokens');

    setInterval(() => {
        if(cpuEl) cpuEl.innerText = Math.floor(Math.random() * 20 + 5) + '%';
        if(latencyEl) latencyEl.innerText = Math.floor(Math.random() * 50 + 20) + 'ms';
        if(tokensEl) tokensEl.innerText = Math.floor(Math.random() * 300 + 700) + ' t/s';
    }, 1000);

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
                <div class="tabs-container">
                    <div class="tabs-header">
                        <button class="tab-btn active" data-tab="tab-before">Before (Supplier Data)</button>
                        <button class="tab-btn" data-tab="tab-render">After (Visual Render)</button>
                        <button class="tab-btn" data-tab="tab-source">After (HTML Source)</button>
                    </div>
                    <div class="tab-content">
                        <div class="tab-pane active" id="tab-before">
                            <div class="raw-box">${product.rawDesc}</div>
                        </div>
                        <div class="tab-pane" id="tab-render">
                            <div class="rendered-card">
                                <h3>Overview</h3>
                                <p>${product.aiDesc}</p>
                                <h3>Key Specs</h3>
                                <div class="metafields-box">
                                    ${product.metafields.map(m => `<span class="metafield-pill" style="background: var(--accent-cyan-dim); color: var(--accent-cyan);">${m}</span>`).join('')}
                                </div>
                                <h3 style="margin-top:1rem;">Generated Tags</h3>
                                <div>
                                    ${product.tags.map(t => `<span class="metafield-pill">${t}</span>`).join('')}
                                </div>
                            </div>
                        </div>
                        <div class="tab-pane" id="tab-source">
                            <div class="source-code">&lt;div class="product-description"&gt;
    &lt;h2&gt;Overview&lt;/h2&gt;
    &lt;p&gt;${product.aiDesc}&lt;/p&gt;
    
    &lt;h2&gt;Key Specs&lt;/h2&gt;
    &lt;ul&gt;
${product.metafields.map(m => `        &lt;li&gt;${m}&lt;/li&gt;`).join('\n')}
    &lt;/ul&gt;
&lt;/div&gt;</div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Tab logic
        const tabBtns = productDetailsEl.querySelectorAll('.tab-btn');
        const tabPanes = productDetailsEl.querySelectorAll('.tab-pane');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                productDetailsEl.querySelector('#' + btn.getAttribute('data-tab')).classList.add('active');
            });
        });
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

    function animateValue(obj, start, end, duration, prefix = '', suffix = '') {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = prefix + Math.floor(progress * (end - start) + start).toLocaleString() + suffix;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    function setStep(stepNum) {
        document.querySelectorAll('.pipeline-step').forEach((el, idx) => {
            if (idx + 1 < stepNum) {
                el.classList.remove('active');
                el.classList.add('completed');
            } else if (idx + 1 === stepNum) {
                el.classList.add('active');
                el.classList.remove('completed');
            } else {
                el.classList.remove('active', 'completed');
            }
        });
        document.querySelectorAll('.pipeline-connector').forEach((el, idx) => {
            if (idx + 1 < stepNum) el.classList.add('active');
            else el.classList.remove('active');
        });
    }

    simForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const supplier = document.getElementById('sim-supplier').value;
        const title = document.getElementById('sim-title').value;

        btnSubmit.disabled = true;
        btnSubmit.innerHTML = 'Processing...';

        terminalOutput.innerHTML = '';
        setStep(1);
        addLogLine(`Received webhook payload from ${supplier}...`, 'info');

        setTimeout(() => {
            addLogLine(`Authentication successful. Validating payload signature.`, 'info');
        }, 600);

        setTimeout(() => {
            setStep(2);
            addLogLine(`Duplicate Scanner running: Dice coefficient comparison against cache.`, 'warning');
        }, 1400);

        setTimeout(() => {
            setStep(3);
            addLogLine(`No duplicates found. Forwarding to AI Copywriting engine...`, 'info');
        }, 2200);

        setTimeout(() => {
            addLogLine(`Generating optimized title and description...`, 'info');
        }, 3000);

        setTimeout(() => {
            setStep(4);
            addLogLine(`Mapping Metafield layout (PNS Namespace color/material/size mapped).`, 'info');
        }, 4000);

        setTimeout(() => {
            setStep(5);
            addLogLine(`Taxonomy matching: Leaf node taxonomy categories selected.`, 'info');
        }, 4800);

        setTimeout(() => {
            setStep(6); // complete all
            addLogLine(`Success! Product "${title}" saved to dashboard database.`, 'success');
            
            // Update stats
            let currentSkus = parseInt(statSkus.innerText.replace(/,/g, ''));
            animateValue(statSkus, currentSkus, currentSkus + 1, 1000);
            
            let currentSavings = parseInt(statSavings.innerText.replace(/[\$,]/g, ''));
            animateValue(statSavings, currentSavings, currentSavings + 15, 1000, '$');

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
