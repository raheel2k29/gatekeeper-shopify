require('dotenv').config({ path: '../.env' });

const shopUrl = process.env.SHOPIFY_STORE_DOMAIN.replace(/^https?:\/\//, '').replace(/\/+$/, '');
const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
const graphqlUrl = `https://${shopUrl}/admin/api/2026-07/graphql.json`;

const headers = {
    'X-Shopify-Access-Token': accessToken,
    'Content-Type': 'application/json'
};

const sleep = ms => new Promise(res => setTimeout(res, ms));

async function runCleanup() {
    console.log('[Cleanup] Starting mass collection cleanup...');
    let hasNextPage = true;
    let endCursor = null;
    let totalDeleted = 0;

    while (hasNextPage) {
        console.log(`[Cleanup] Fetching a batch of 100 collections...`);
        const query = `
            query($cursor: String) {
                collections(first: 100, after: $cursor) {
                    edges {
                        node {
                            id
                            title
                        }
                    }
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                }
            }
        `;

        const res = await fetch(graphqlUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ query, variables: { cursor: endCursor } })
        });

        const json = await res.json();
        
        if (json.errors) {
            console.error('[Cleanup] GraphQL Error fetching collections:', json.errors);
            break;
        }

        const collections = json.data.collections.edges;
        hasNextPage = json.data.collections.pageInfo.hasNextPage;
        endCursor = json.data.collections.pageInfo.endCursor;

        for (const edge of collections) {
            const id = edge.node.id;
            const title = edge.node.title;

            // Delete ALL collections since we are moving purely to Automated Collections.
            console.log(`[Cleanup] Deleting Collection: ${title} (${id})`);
            
            const mutation = `
                mutation collectionDelete($input: CollectionDeleteInput!) {
                    collectionDelete(input: $input) {
                        deletedCollectionId
                        userErrors {
                            field
                            message
                        }
                    }
                }
            `;

            const delRes = await fetch(graphqlUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    query: mutation,
                    variables: { input: { id } }
                })
            });

            const delJson = await delRes.json();
            if (delJson.errors || delJson.data.collectionDelete.userErrors.length > 0) {
                console.error(`[Cleanup] Error deleting ${id}:`, delJson.errors || delJson.data.collectionDelete.userErrors);
            } else {
                totalDeleted++;
            }

            // Sleep to respect Shopify GraphQL rate limits (Cost: 10 points. Refill: 50/sec)
            await sleep(250);
        }
    }

    console.log(`\n[Cleanup] ✅ Successfully deleted ${totalDeleted} collections!`);
}

runCleanup();
