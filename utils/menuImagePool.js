/** Verified Unsplash URLs (HEAD 200). AI often invents invalid photo IDs. */
const MENU_IMAGE_POOL = {
  Pizza: [
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400&auto=format&fit=crop",
  ],
  Burger: [
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&auto=format&fit=crop",
  ],
  Dessert: [
    "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&auto=format&fit=crop",
  ],
  Drinks: [
    "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1546173159-315724a31696?w=400&auto=format&fit=crop",
  ],
};

function poolForCategory(category) {
  return MENU_IMAGE_POOL[category] || MENU_IMAGE_POOL.Pizza;
}

function pickMenuImage(category, usedUrls = new Set()) {
  const pool = poolForCategory(category);
  const unused = pool.find((url) => !usedUrls.has(url));
  if (unused) return unused;
  return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = { MENU_IMAGE_POOL, pickMenuImage, poolForCategory };
