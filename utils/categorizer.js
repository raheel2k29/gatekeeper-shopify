/**
 * Auto-Categorization Engine
 * Maps incoming products to the client's master category system based on keywords.
 */

const categories = {
  // 🐶 DOGS
  dogApparel: { tags: ["DOGS", "Apparel"], keywords: ["dog jacket", "dog hoodie", "dog shirt", "dog dress", "dog sweater", "dog coat", "puppy clothes"] },
  dogGrooming: { tags: ["DOGS", "Grooming"], keywords: ["dog brush", "dog shampoo", "dog comb", "dog nail", "dog grooming", "dog deshedding"] },
  dogFood: { tags: ["DOGS", "Food"], keywords: ["dog food", "dog treat", "puppy food", "dog dry food", "dog wet food", "dog kibble", "dog chew"] },
  dogTravel: { tags: ["DOGS", "Travel"], keywords: ["dog carrier", "dog backpack", "dog travel", "dog car seat", "dog stroller"] },
  dogToys: { tags: ["DOGS", "Toys"], keywords: ["dog toy", "dog chew toy", "dog fetch", "dog interactive", "squeaky", "dog rope", "puppy toy"] },
  dogAccessories: { tags: ["DOGS", "Accessories"], keywords: ["dog collar", "dog harness", "dog leash", "dog bandana", "dog id tag"] },
  dogFurniture: { tags: ["DOGS", "Furniture"], keywords: ["dog sofa", "dog bed", "dog house", "dog crate", "dog mat", "dog lounger", "puppy bed"] },

  // 🐱 CATS
  catApparel: { tags: ["CATS", "Apparel"], keywords: ["cat jacket", "cat hoodie", "cat dress", "cat shirt", "cat sweater", "kitten clothes"] },
  catGrooming: { tags: ["CATS", "Grooming"], keywords: ["cat brush", "cat shampoo", "cat comb", "cat nail", "cat grooming", "cat deshedding"] },
  catFood: { tags: ["CATS", "Food"], keywords: ["cat food", "cat treat", "kitten food", "cat dry food", "cat wet food", "catnip treat"] },
  catTravel: { tags: ["CATS", "Travel"], keywords: ["cat carrier", "cat backpack", "cat travel", "cat stroller"] },
  catToys: { tags: ["CATS", "Toys"], keywords: ["cat toy", "cat laser", "cat feather", "cat interactive", "catnip", "kitten toy"] },
  catAccessories: { tags: ["CATS", "Accessories"], keywords: ["cat collar", "cat harness", "cat leash"] },
  catFurniture: { tags: ["CATS", "Furniture"], keywords: ["cat tree", "cat bed", "cat wall bed", "scratching post", "cat condo", "litter box"] },

  // 👤 OWNERS
  ownerApparel: { tags: ["OWNERS", "Clothing"], keywords: ["owner shirt", "owner hoodie", "owner hat", "dog mom", "cat mom", "dog dad", "cat dad"] },
  ownerJewelry: { tags: ["OWNERS", "Jewelry"], keywords: ["paw print necklace", "pet photo bracelet", "owner jewelry", "pet name necklace", "paw ring"] },
  ownerMatching: { tags: ["OWNERS", "Matching Sets"], keywords: ["matching pet", "owner set", "matching dog and owner", "matching collar and bracelet"] },

  // 🏙️ URBAN / STREET
  urbanTactical: { tags: ["URBAN/STREET", "Tactical Gear"], keywords: ["tactical harness", "tactical collar", "tactical leash", "military dog", "k9 harness"] },
  urbanOutdoor: { tags: ["URBAN/STREET", "Outdoor Gear"], keywords: ["outdoor dog gear", "hiking dog", "adventure backpack", "camping dog"] },
  urbanStreetwear: { tags: ["URBAN/STREET", "Streetwear"], keywords: ["streetwear pet", "urban pet", "hypebeast dog", "hypebeast cat"] },

  // 🍖 FOOD BRANDS
  foodBrands: { tags: ["FOOD BRANDS"], keywords: ["purina", "blue buffalo", "hill's science diet", "royal canin", "iams", "wellness", "orijen", "acana", "merrick", "taste of the wild", "pedigree"] }
};

/**
 * Categorizes a product by analyzing its title and description.
 * Returns an array of relevant tags.
 */
function categorizeProduct(title, description) {
  const textToSearch = `${title} ${description}`.toLowerCase();
  let generatedTags = new Set();

  // Search for specific category keywords
  for (const [key, categoryData] of Object.entries(categories)) {
    for (const keyword of categoryData.keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(textToSearch)) {
        categoryData.tags.forEach(tag => generatedTags.add(tag));
        break; // Stop searching this category if we already found a match
      }
    }
  }

  // Broad Fallbacks (If it didn't hit any specific accessories/food, but we know it's a dog/cat)
  if (/\bdog\b|\bpuppy\b|\bk9\b/i.test(textToSearch)) {
      generatedTags.add("DOGS");
  }
  if (/\bcat\b|\bkitten\b|\bfeline\b/i.test(textToSearch)) {
      generatedTags.add("CATS");
  }

  return Array.from(generatedTags);
}

module.exports = { categorizeProduct };
