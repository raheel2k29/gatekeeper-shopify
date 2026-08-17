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

    const mockDuplicates = [
        {
            id: 'dup_1',
            title: 'Waterproof Electric Dog Training Collar',
            supplier: 'AliExpress',
            rawDesc: 'NEW 2023 Waterproof dog collar electric shock training... 100% QUALITY',
            isDuplicate: true,
            matchedSku: 'Dog Collar Premium - 2022 Edition',
            similarity: 92
        }
    ];

    let currentCatalogTab = 'imported';

    const productListEl = document.getElementById('product-list');
    const productDetailsEl = document.getElementById('product-details');

    function renderProductList() {
        productListEl.innerHTML = '';
        
        const listToRender = currentCatalogTab === 'imported' ? mockProducts : mockDuplicates;
        
        document.getElementById('count-imported').innerText = mockProducts.length;
        document.getElementById('count-duplicates').innerText = mockDuplicates.length;

        if (listToRender.length === 0) {
            productListEl.innerHTML = '<div class="empty-state" style="padding:1rem;">No items found.</div>';
            return;
        }

        listToRender.forEach(product => {
            const item = document.createElement('div');
            item.className = 'product-item';
            item.innerHTML = `
                <h4>${product.isDuplicate ? '<span style="color:#ff5f56; margin-right:4px;">[DUP]</span>' : ''}${product.title}</h4>
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

    // Catalog Tabs Logic
    const catalogTabBtns = document.querySelectorAll('.catalog-tab-btn');
    catalogTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            catalogTabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCatalogTab = btn.getAttribute('data-catalog-tab');
            productDetailsEl.innerHTML = '<div class="empty-state">Select a product to view details</div>';
            renderProductList();
        });
    });

    function renderProductDetails(product) {
        if (product.isDuplicate) {
            productDetailsEl.innerHTML = `
                <div class="details-content">
                    <div class="details-header">
                        <h2 style="color:#ff5f56;">${product.title}</h2>
                        <span class="supplier-badge">${product.supplier}</span>
                    </div>
                    <div style="background-color:rgba(255,95,86,0.1); border-left:4px solid #ff5f56; padding:1rem; border-radius:4px; margin-bottom:1.5rem;">
                        <strong style="color:#ff5f56; display:block; margin-bottom:0.5rem;">🛑 DUPLICATE DETECTED</strong>
                        <p style="margin:0; font-size:0.9rem; color:var(--text-main);">This product matches <strong>${product.matchedSku}</strong> (Similarity: ${product.similarity}%). Automatically moved to Drafts and tagged as Duplicate.</p>
                    </div>
                    <div class="tabs-container">
                        <div class="tabs-header">
                            <button class="tab-btn active" data-tab="tab-raw">Raw Payload (Incoming)</button>
                        </div>
                        <div class="tab-content">
                            <div class="tab-pane active" id="tab-raw">
                                <div class="raw-box">${product.rawDesc}</div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

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

    // Auto-Pilot Simulator Logic
    const feedGrid = document.getElementById('pending-feed-grid');
    const terminalOutput = document.getElementById('terminal-output');
    const autopilotSwitch = document.getElementById('autopilot-switch');
    
    // Stats elements
    const statSkus = document.getElementById('stat-skus');
    const statSavings = document.getElementById('stat-savings');
    const statDuplicates = document.getElementById('stat-duplicates');

    let isProcessing = false;
    let autoPilotInterval = null;

    let pendingProducts = [
        {
            id: 'pend_1',
            supplier: 'DSers AliExpress',
            title: 'Waterproof Electric Dog Training Collar',
            rawDesc: 'NEW 2023 Waterproof dog collar electric shock training... 100% QUALITY',
            tags: ['SHOCK', 'TRAINING', 'CHEAP']
        },
        {
            id: 'pend_2',
            supplier: 'Zendrop',
            title: 'Orthopedic Pet Bed Calming Sofa',
            rawDesc: 'Super soft plush dog bed cat bed orthopedic deep sleep winter warm...',
            tags: ['WARM', 'CALMING', 'SOFA']
        },
        {
            id: 'pend_3',
            supplier: 'CJ Dropshipping',
            title: 'Cat Laser Toy Interactive Chase',
            rawDesc: 'Automatic cat toy laser smart interactive pet toy usb charging...',
            tags: ['SMART', 'LASER', 'USB']
        },
        {
            id: 'pend_4',
            supplier: 'AutoDS',
            title: 'Adjustable Posture Corrector',
            rawDesc: 'Back posture corrector shoulder lumbar brace spine support belt...',
            tags: ['BACK', 'CORRECTOR', 'BELT']
        }
    ];

    function renderFeed() {
        if (!feedGrid) return;
        feedGrid.innerHTML = '';
        if (pendingProducts.length === 0) {
            feedGrid.innerHTML = '<div class="empty-feed">Queue Empty - Waiting for Payloads...</div>';
            return;
        }
        
        pendingProducts.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'feed-card';
            card.id = prod.id;
            card.innerHTML = `
                <div class="feed-card-header">
                    <span class="status-pulse ${prod.isInjected ? 'injected-badge' : ''}">${prod.isInjected ? '[INJECTED FROM BTN]' : '[PENDING INGESTION]'}</span>
                    <span class="supplier-name">${prod.supplier}</span>
                </div>
                <div class="feed-card-body">
                    <h4 class="raw-title">${prod.title}</h4>
                    <p class="raw-preview">${prod.rawDesc}</p>
                    <div class="spam-tags">
                        ${prod.tags.map(t => `<span class="spam-tag">${t}</span>`).join('')}
                    </div>
                </div>
                <div class="feed-card-footer">
                    <button class="btn btn-secondary btn-sm trigger-btn" data-id="${prod.id}">Trigger Automation</button>
                </div>
            `;
            feedGrid.appendChild(card);
        });

        // Add manual trigger listeners
        feedGrid.querySelectorAll('.trigger-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                if (!isProcessing) {
                    processProductFromQueue(id);
                }
            });
        });
    }

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

    function processProductFromQueue(id) {
        if (isProcessing) return;
        
        const index = pendingProducts.findIndex(p => p.id === id);
        if (index === -1) return;
        
        const prod = pendingProducts[index];
        isProcessing = true;
        
        // Visual indicator on card
        const cardEl = document.getElementById(prod.id);
        if (cardEl) {
            cardEl.classList.add('processing');
            const pulse = cardEl.querySelector('.status-pulse');
            if(pulse) {
                pulse.innerText = '[INGESTING...]';
                pulse.style.color = 'var(--accent-cyan)';
            }
        }

        terminalOutput.innerHTML = '';
        setStep(1);
        addLogLine(`Received webhook payload from ${prod.supplier}...`, 'info');

        setTimeout(() => {
            addLogLine(`Authentication successful. Validating payload signature.`, 'info');
        }, 600);

        if (prod.id === 'pend_1' || prod.title.toLowerCase().includes('duplicate')) {
            setTimeout(() => {
                setStep(2);
                addLogLine(`[DuplicateScanner] 🚨 Duplicate caught! Matching Product ID: 10405132927276. Moving to Drafts.`, 'warning');
                
                // Update stats
                let currentDups = parseInt(statDuplicates.innerText.replace(/,/g, ''));
                animateValue(statDuplicates, currentDups, currentDups + 1, 1000);

                // Add to mockDuplicates
                const newDup = {
                    id: 'dup_' + Date.now(),
                    title: prod.title,
                    supplier: prod.supplier,
                    rawDesc: prod.rawDesc,
                    isDuplicate: true,
                    matchedSku: 'Existing Product 10405132927276',
                    similarity: 98
                };
                mockDuplicates.unshift(newDup);

                // Remove from pending
                pendingProducts.splice(index, 1);
                
                // Re-render
                renderFeed();
                renderProductList();
                
                isProcessing = false;
                
                // Visual reset pipeline
                setTimeout(() => setStep(0), 2000);
            }, 1400);
            return;
        }

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
            addLogLine(`Success! Product "${prod.title}" saved to dashboard database.`, 'success');
            
            // Update stats
            let currentSkus = parseInt(statSkus.innerText.replace(/,/g, ''));
            animateValue(statSkus, currentSkus, currentSkus + 1, 1000);
            
            let currentSavings = parseInt(statSavings.innerText.replace(/[\$,]/g, ''));
            animateValue(statSavings, currentSavings, currentSavings + 15, 1000, '$');

            // Remove from pending
            pendingProducts.splice(index, 1);
            
            // Add to catalog mock
            const newProduct = {
                id: 'prod_' + Date.now(),
                title: prod.title + ' (Optimized)',
                supplier: prod.supplier,
                rawDesc: prod.rawDesc,
                aiDesc: 'AI Generated Description based on raw input. Optimized for high conversion and readability.',
                tags: ['New Arrival', 'Automated'],
                metafields: ['Status: Active', 'Sync: Complete']
            };
            mockProducts.unshift(newProduct);
            
            // Re-render
            renderFeed();
            renderProductList();
            
            isProcessing = false;
            
            // Visual reset pipeline
            setTimeout(() => setStep(0), 2000);
        }, 5800);
    }

    function checkAutoPilot() {
        if (autopilotSwitch && autopilotSwitch.checked && !isProcessing && pendingProducts.length > 0) {
            processProductFromQueue(pendingProducts[0].id);
        }
    }

    // Initialize
    renderFeed();
    
    // Auto-pilot toggle listener
    if (autopilotSwitch) {
        autopilotSwitch.addEventListener('change', (e) => {
            const container = document.querySelector('.radar-container');
            if (e.target.checked) {
                container.classList.add('active');
            } else {
                container.classList.remove('active');
            }
        });
        
        // Start radar active by default
        document.querySelector('.radar-container').classList.add('active');
    }

    // Supplier Tags Logic
    const tags = document.querySelectorAll('.tag');
    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            // Toggle active visual state
            tags.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');

            // Inject mock webhook
            const supplierName = tag.innerText;
            const newProduct = {
                id: 'pend_inj_' + Date.now() + Math.floor(Math.random() * 1000),
                supplier: supplierName,
                title: `Mock Webhook Product (${supplierName})`,
                rawDesc: `Dynamically injected testing payload for ${supplierName}. Contains simulated raw HTML data.`,
                tags: ['INJECTED', 'MOCK', 'TEST'],
                isInjected: true
            };

            pendingProducts.unshift(newProduct);
            renderFeed();
            
            // Optional: reset active state after a short delay so it behaves like a button click
            setTimeout(() => {
                tag.classList.remove('active');
            }, 600);
        });
    });

    // Auto-pilot loop
    setInterval(checkAutoPilot, 2000);

});
