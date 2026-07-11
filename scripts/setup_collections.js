require('dotenv').config({ path: '../.env' });

const shopUrl = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, '').replace(/\/+$/, '');
const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
const graphqlUrl = `https://${shopUrl}/admin/api/2026-07/graphql.json`;

const headers = {
    'X-Shopify-Access-Token': accessToken,
    'Content-Type': 'application/json'
};

const MEGA_MENU_CATEGORIES = [
    "Dog Jackets", "Dog Hoodies", "Dog Shirts", "Dog Dresses", "Dog Sweaters", "Dog Sportswear", "Dog Raincoats", "Holiday Apparel",
    "Chew Toys", "Puzzle & Smart Toys", "Balls & Fetch Toys", "Rope & Tug Toys",
    "Collars (Luxury, Tactical, Spike, GPS)", "Leashes (Standard, Hands-Free, LED)", "Harnesses (No-Pull, Tactical, Service)", "Dog ID Tags", "Dog Tactical Gear", "Dog Glasses", "Boots & Paw Protection",
    "Training Pads", "Clickers & Reward Tools", "Agility Kits", "Electronic Training Devices",
    "Orthopedic Beds", "Calming Beds", "Heated & Cooling Beds", "Luxury Sofas", "Convertible Loungers", "Indoor/Outdoor Loungers",
    "Brushes & Combs", "Shampoos & Conditioners", "Dental Care", "Flea/Tick/Worm Prevention", "Supplements (Joint, Digestive, Skin & Coat)",
    "Furniture-Style Crates", "Metal & Plastic Kennels", "Insulated Outdoor Houses", "Expandable Playpens",
    "Carriers & Backpacks", "Cooling Vests", "Seat Belts & Car Safety", "Portable Feeding Gear",
    "Cat Jackets", "Cat Hoodies", "Cat Dresses", "Cat Shirts",
    "Cat Laser Toys", "Cat Feather Toys", "Cat Interactive Toys",
    "Cat Brushes", "Cat Shampoo", "Cat Collars", "Cat Harnesses",
    "Cat Dry Food", "Cat Wet Food", "Cat Treats",
    "Cat Trees", "Cat Beds", "Cat Wall Beds",
    "Cat Carriers", "Cat Backpacks",
    "Pet Parent Hoodies", "Pet Parent T-Shirts", "Matching Pet + Owner Sets", "Seasonal Apparel",
    "Pet-Themed Decor", "Pet-Safe Cleaning Products", "Couch Covers", "Anti-Slip Rugs",
    "Baseball Caps", "Beanies", "Matching Pet + Owner Hats",
    "Treat Bags", "Walking Bags", "Owner Backpacks",
    "Custom Pet Name Necklaces", "Paw Print Jewelry", "Photo-Engraved Jewelry", "Memorial Jewelry",
    "Safety Equipment", "Custom Pet Portraits", "Photo Frames", "Paw Print Kits", "Keepsake Boxes",
    "Street Hoodies", "Graphic Shirts", "Tactical Vests", "Street Jackets",
    "Big Spike Collars", "Heavy Chains", "Thick Metal Leashes", "Tactical Harnesses",
    "Sunglasses", "Hats", "Bandanas", "LED Night Gear",
    "Muscular-Dog Inspired Gear", "Photo-Ready Street Sets", "Urban Dog Fashion Bundles",
    "Major Dog Food Brands", "Major Cat Food Brands", 
    "Grain-Free", "Limited Ingredient", "Hypoallergenic", "Sensitive Stomach", "Weight Management", "Senior Formulas",
    "High-Protein", "Working Dog Formulas", "Active Lifestyle Blends",
    "Organic", "Human-Grade", "Freeze-Dried Raw", "Air-Dried"
];

const sleep = ms => new Promise(res => setTimeout(res, ms));

async function createAutomatedCollections() {
    console.log('[Setup] Starting Automated Collection setup for 94 Mega Menu categories...');
    let successCount = 0;

    for (const category of MEGA_MENU_CATEGORIES) {
        console.log(`[Setup] Creating Automated Collection: ${category}`);
        
        const mutation = `
            mutation collectionCreate($input: CollectionInput!) {
                collectionCreate(input: $input) {
                    collection {
                        id
                    }
                    userErrors {
                        field
                        message
                    }
                }
            }
        `;

        const variables = {
            input: {
                title: category,
                ruleSet: {
                    appliedDisjunctively: false, // Match ALL rules
                    rules: [
                        {
                            column: "TYPE",
                            relation: "EQUALS",
                            condition: category
                        }
                    ]
                }
            }
        };

        const res = await fetch(graphqlUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ query: mutation, variables })
        });

        const json = await res.json();
        
        if (json.errors || (json.data && json.data.collectionCreate && json.data.collectionCreate.userErrors.length > 0)) {
            console.error(`[Setup] Error creating ${category}:`, json.errors || json.data.collectionCreate.userErrors);
        } else {
            successCount++;
        }

        // Sleep to avoid rate limiting
        await sleep(250);
    }

    console.log(`\n[Setup] ✅ Successfully created ${successCount} Automated Collections!`);
    console.log(`[Setup] Remember to manually publish them to the Online Store channel in Shopify Admin if they are hidden.`);
}

createAutomatedCollections();
