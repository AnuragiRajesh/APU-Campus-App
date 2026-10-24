/* ══════════════════════════════════════════
   APU STUDENT HUB — app.js
   Vanilla JS: Food Menu, Shuttle, Calendar
   ══════════════════════════════════════════ */

'use strict';

const PROXY_API_URL = '/api/jsonbin';
const JSONBIN_IDS = {
  foodComments: '6adcec7fffd5d1605388b879',
  cabShare: '6adcec93ac6210605a4f08ac',
};

async function readJsonBin(binId, fallback) {
  // Pass the target Bin ID as a clean URL query parameter
  const url = `${PROXY_API_URL}?binId=${encodeURIComponent(binId)}`;
  const response = await fetchJsonBin(url, { cache: 'no-store' }, 'read');
  const payload = await response.json();
  return payload.record ?? fallback;
}

async function writeJsonBin(binId, record) {
  const url = `${PROXY_API_URL}?binId=${encodeURIComponent(binId)}`;
  const response = await fetchJsonBin(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  }, 'write');
  return response.json();
}

async function fetchJsonBin(url, options, operation) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Could not reach Vercel API proxy. ${detail}`
    );
  }

  if (!response.ok) {
    const body = await response.text();
    let detail = body;
    try {
      const parsed = JSON.parse(body);
      detail = parsed.error || parsed.message || body;
    } catch {
      // Fallback to raw string text
    }
    throw new Error(`JSONBin ${operation} failed (${response.status})${detail ? `: ${detail}` : '.'}`);
  }
  return response;
}

async function updateJsonBin(binId, fallback, update) {
  const record = await readJsonBin(binId, fallback);
  const changed = update(record);
  if (changed) await writeJsonBin(binId, record);
  return record;
}

function setSyncStatus(elementId, message, isError = false) {
  const element = document.getElementById(elementId);
  element.textContent = message;
  element.classList.toggle('hidden', !message);
  element.classList.toggle('text-red-500', isError);
  element.classList.toggle('text-gray-400', !isError);
}

// ─────────────────────────────────────────
// 1. DATA
// ─────────────────────────────────────────

const MEAL_TIMINGS = {
  breakfast: '7:00 AM – 9:30 AM',
  lunch:     '12:00 PM – 2:20 PM',
  snack:     '4:30 PM – 6:15 PM',
  dinner:    '7:00 PM – 9:30 PM',
};

// Meal windows for comments: [startH, startM, endH, endM]
// Comments open at start, deleted 2h after end

// Weekly menu: menuData[dayIndex][mealType] = array of dishes
// ── Real Oota menu keyed by date (YYYY-MM-DD) ────────────────────
// Source: Official APU Oota Menu Oct 12–25 2026
// Row order in spreadsheet: Breakfast → Lunch → Snack (Hi-Tea) → Dinner
const menuByDate = {

  // ════ WEEK 1: Oct 12–18 2026 ════

  '2026-10-12': { // Monday
    breakfast: [
      { emoji: '🫓', name: 'Pesarattu Dosa',        desc: 'Crispy green moong dosa (2+1)',          diet: 'veg' },
      { emoji: '🌾', name: 'Daliya Upma',            desc: 'Broken wheat upma',                      diet: 'veg' },
      { emoji: '🥣', name: 'Sambar',                 desc: 'Classic sambar',                         diet: 'veg' },
      { emoji: '🥥', name: 'Coconut Chutney',        desc: 'Fresh ground coconut chutney',           diet: 'vegan' },
      { emoji: '🍞', name: 'Bread + Butter / Jam',   desc: '2 slices',                               diet: 'veg' },
      { emoji: '🍉', name: 'Watermelon Juice',       desc: 'Fresh watermelon juice (150 ml)',        diet: 'vegan' },
      { emoji: '☕', name: 'Tea / Coffee / Milk',    desc: '110 ml',                                 diet: 'veg' },
    ],
    lunch: [
      { emoji: '🥕', name: 'Carrot Beans Palya',     desc: 'Dry stir-fry of carrot & beans',        diet: 'vegan' },
      { emoji: '🥔', name: 'Kashmiri Dum Aloo',      desc: 'Potatoes in rich Kashmiri gravy',        diet: 'veg' },
      { emoji: '🍛', name: 'Dal Tiranga',             desc: 'Three-colour layered dal',               diet: 'veg' },
      { emoji: '🥁', name: 'Drumstick & Small Onion Sambar', desc: 'Classic sambar',                diet: 'veg' },
      { emoji: '🍚', name: 'Plain Rice',              desc: '300 gm steamed rice',                   diet: 'vegan' },
      { emoji: '🥗', name: 'Salad',                   desc: 'Fresh salad (40 gm)',                    diet: 'vegan' },
      { emoji: '🥛', name: 'Curd',                    desc: '80 ml curd',                            diet: 'veg' },
      { emoji: '🫓', name: 'Chapathi',                desc: '2 chapathis',                            diet: 'veg' },
      { emoji: '🥜', name: 'Frymus',                  desc: 'Fried frymus papad',                    diet: 'veg' },
      { emoji: '🌶', name: 'Pickle',                  desc: 'Side pickle',                            diet: 'vegan' },
    ],
    snack: [
      { emoji: '🥟', name: 'Kachori',                desc: 'Fried pastry',                            diet: 'veg' },
      { emoji: '🍯', name: 'Sweet Chutney',           desc: 'Dipping chutney',                        diet: 'vegan' },
      { emoji: '☕', name: 'Tea / Coffee / Milk',    desc: '110 ml',                                 diet: 'veg' },
    ],
    dinner: [
      { emoji: '🥦', name: 'Chow Chow Channa Palya', desc: 'Dry chayote & chickpea stir-fry',       diet: 'vegan' },
      { emoji: '🍜', name: 'Moong Dal Fry',           desc: 'Tempered yellow moong dal',              diet: 'veg' },
      { emoji: '🍋', name: 'Puli Rasam',              desc: 'Tangy tamarind rasam',                   diet: 'vegan' },
      { emoji: '🍚', name: 'Plain Rice',              desc: '300 gm steamed rice',                   diet: 'vegan' },
      { emoji: '🌿', name: 'Veg & Corn Baked Spinach Au Gratin', desc: 'Live counter special',      diet: 'veg' },
      { emoji: '🍛', name: 'Rajma Pulao',             desc: 'Kidney bean flavoured rice',             diet: 'vegan' },
      { emoji: '🫓', name: 'Plain Chapathi',          desc: '2 chapathis',                            diet: 'veg' },
      { emoji: '🥜', name: 'Fryums',                  desc: 'Side fryums',                            diet: 'veg' },
      { emoji: '🍋', name: 'Lemon Pickle',            desc: 'Side pickle',                            diet: 'vegan' },
      { emoji: '🧆', name: 'Palak Kofta Curry',       desc: 'Paneer kofta in spinach gravy',         diet: 'veg' },
      { emoji: '🥚', name: 'Egg Kurma Natti Style',   desc: 'Country-style egg kurma',               diet: 'nonveg' },
    ],
  },

  '2026-10-13': { // Tuesday
    breakfast: [
      { emoji: '🍲', name: 'Bisibele Bhath',          desc: 'One-pot rice, lentil & veggie dish',    diet: 'veg' },
      { emoji: '🫔', name: 'Dhokla',                  desc: 'Steamed fermented chickpea cake',        diet: 'veg' },
      { emoji: '🥥', name: 'Coconut Chutney',         desc: 'Fresh ground coconut chutney',          diet: 'vegan' },
      { emoji: '🍞', name: 'Bread + Butter / Jam',    desc: '2 slices',                               diet: 'veg' },
      { emoji: '🥣', name: 'Karaboondi',              desc: 'Spiced boondi',                          diet: 'veg' },
      { emoji: '☕', name: 'Tea / Coffee / Milk',     desc: '110 ml',                                 diet: 'veg' },
      { emoji: '🥚', name: 'Boiled Egg / Sprouts',    desc: 'Choice of egg or fresh sprouts',        diet: 'nonveg' },
    ],
    lunch: [
      { emoji: '🎃', name: 'Pumpkin Channa Dry',      desc: 'Pumpkin & chickpea dry sabzi',           diet: 'vegan' },
      { emoji: '🌽', name: 'Veg & Corn Makhanwala',   desc: 'Creamy tomato-butter gravy',             diet: 'veg' },
      { emoji: '💚', name: 'Green Moong Dal',          desc: 'Light whole green moong dal',            diet: 'vegan' },
      { emoji: '🧄', name: 'Garlic Rasam',             desc: 'Thin peppery garlic rasam',             diet: 'vegan' },
      { emoji: '🍚', name: 'Plain Rice',               desc: '300 gm steamed rice',                   diet: 'vegan' },
      { emoji: '🥗', name: 'Salad',                    desc: 'Fresh salad',                            diet: 'vegan' },
      { emoji: '🥛', name: 'Curd',                     desc: '80 ml curd',                            diet: 'veg' },
      { emoji: '🫓', name: 'Chapathi',                 desc: '2 chapathis',                            diet: 'veg' },
      { emoji: '🥜', name: 'Frymus',                   desc: 'Fried frymus papad',                    diet: 'veg' },
      { emoji: '🌶', name: 'Pickle',                   desc: 'Side pickle',                            diet: 'vegan' },
      { emoji: '🧁', name: 'Butterscotch Pastry',     desc: 'Sweet dessert',                          diet: 'veg' },
    ],
    snack: [
      { emoji: '🍛', name: 'Pav Bhaji',               desc: 'Spiced mash with buttered bun',          diet: 'veg' },
      { emoji: '🧅', name: 'Chopped Onion & Lemon',   desc: 'Garnish on side',                        diet: 'vegan' },
      { emoji: '☕', name: 'Tea / Coffee / Milk',     desc: '110 ml',                                 diet: 'veg' },
    ],
    dinner: [
      { emoji: '🍛', name: 'Chole Masala',             desc: 'Punjabi-style chickpea curry',          diet: 'vegan' },
      { emoji: '🍲', name: 'Punjabi Dal Tadka',        desc: 'Tempered yellow dal',                   diet: 'veg' },
      { emoji: '🥬', name: 'Veg Sambar',               desc: 'Mixed vegetable sambar',                diet: 'vegan' },
      { emoji: '🍚', name: 'Plain Rice',               desc: '300 gm steamed rice',                   diet: 'vegan' },
      { emoji: '🫓', name: 'Bhatura',                  desc: 'Fluffy deep-fried bread — live',        diet: 'veg' },
      { emoji: '🍛', name: 'Ghee Rice',                desc: 'Fragrant ghee-tossed basmati',           diet: 'veg' },
      { emoji: '🥛', name: 'Veg Raita',                desc: 'Yogurt with vegetables',                diet: 'veg' },
      { emoji: '🥜', name: 'Fryums',                   desc: 'Side fryums',                           diet: 'veg' },
      { emoji: '🌶', name: 'Mix Pickle',               desc: 'Side pickle',                            diet: 'vegan' },
    ],
  },

  '2026-10-14': { // Wednesday
    breakfast: [
      { emoji: '🫓', name: 'Idly Vada',               desc: '2 idlies + 1 medu vada',                diet: 'veg' },
      { emoji: '🌾', name: 'Ragi Porridge',            desc: 'Finger millet porridge',                diet: 'vegan' },
      { emoji: '🥣', name: 'Sambar',                   desc: 'Classic sambar',                        diet: 'veg' },
      { emoji: '🥥', name: 'Coconut Chutney',          desc: 'Fresh ground coconut chutney',          diet: 'vegan' },
      { emoji: '🍞', name: 'Bread + Butter / Jam',     desc: '2 slices',                               diet: 'veg' },
      { emoji: '☕', name: 'Tea / Coffee / Milk',      desc: '110 ml',                                 diet: 'veg' },
    ],
    lunch: [
      { emoji: '🥬', name: 'Vegetable Kur Kure',       desc: 'Crispy crunchy veg fry',                diet: 'vegan' },
      { emoji: '🌿', name: 'Soppu Moong Kootu Curry',  desc: 'Greens & moong dal kootu',               diet: 'vegan' },
      { emoji: '🎃', name: 'Kaddu Ka Dalcha',           desc: 'Pumpkin lentil curry',                  diet: 'veg' },
      { emoji: '🧅', name: 'Radish Small Onion Sambar', desc: 'Tangy radish sambar',                   diet: 'veg' },
      { emoji: '🍚', name: 'Plain Rice',                desc: '300 gm steamed rice',                   diet: 'vegan' },
      { emoji: '🥗', name: 'Salad',                     desc: 'Fresh salad',                           diet: 'vegan' },
      { emoji: '🥛', name: 'Curd',                      desc: '80 ml curd',                            diet: 'veg' },
      { emoji: '🫓', name: 'Chapathi',                  desc: '2 chapathis',                           diet: 'veg' },
      { emoji: '🫘', name: 'Papad',                     desc: 'Crispy papad',                          diet: 'veg' },
      { emoji: '🌶', name: 'Pickle',                    desc: 'Side pickle',                           diet: 'vegan' },
    ],
    snack: [
      { emoji: '🫓', name: 'Masala Poori',              desc: 'Spiced deep-fried poori',               diet: 'veg' },
      { emoji: '☕', name: 'Tea / Coffee / Milk',       desc: '110 ml',                                diet: 'veg' },
      { emoji: '🍊', name: 'Cut Fruit',                 desc: 'Seasonal fresh cut fruit',              diet: 'vegan' },
    ],
    dinner: [
      { emoji: '🥔', name: 'Aloo Jeera',                desc: 'Cumin-tossed potato',                   diet: 'vegan' },
      { emoji: '🍲', name: 'Dal Bukhara',               desc: 'Rich slow-cooked black dal',            diet: 'veg' },
      { emoji: '🧄', name: 'Garlic Rasam',              desc: 'Thin peppery garlic rasam',             diet: 'vegan' },
      { emoji: '🍚', name: 'Plain Rice',                desc: '300 gm steamed rice',                   diet: 'vegan' },
      { emoji: '🌿', name: 'Palak Chapathi',            desc: 'Spinach-infused chapathi',              diet: 'veg' },
      { emoji: '🍛', name: 'Veg Pulao',                 desc: 'Light vegetable pulao',                 diet: 'vegan' },
      { emoji: '🥜', name: 'Fryums',                    desc: 'Side fryums',                           diet: 'veg' },
      { emoji: '🍋', name: 'Lemon Pickle',              desc: 'Side pickle',                           diet: 'vegan' },
      { emoji: '🥩', name: 'Coriander Chicken',         desc: 'Non-veg special — Wednesday',          diet: 'nonveg' },
      { emoji: '🧆', name: 'Kadai Paneer',              desc: 'Paneer in spiced kadai gravy',          diet: 'veg' },
    ],
  },

  '2026-10-15': { // Thursday
    breakfast: [
      { emoji: '🥔', name: 'Aloo Paratha',              desc: 'Stuffed potato flatbread',              diet: 'veg' },
      { emoji: '🍛', name: 'Ghee Pongal',               desc: 'Soft rice & moong dal pongal',         diet: 'veg' },
      { emoji: '🥥', name: 'Coconut Chutney',           desc: 'Fresh ground coconut chutney',         diet: 'vegan' },
      { emoji: '🍞', name: 'Bread + Butter / Jam',      desc: '2 slices',                              diet: 'veg' },
      { emoji: '🌿', name: 'Sundal',                    desc: 'Boiled sundal (cereals)',               diet: 'vegan' },
      { emoji: '☕', name: 'Tea / Coffee / Milk',       desc: '110 ml',                               diet: 'veg' },
      { emoji: '🥚', name: 'Boiled Egg / Banana',       desc: 'Choice of egg or banana',              diet: 'nonveg' },
    ],
    lunch: [
      { emoji: '🌶', name: 'Aloo Soya Chilli Dry',      desc: 'Spicy potato & soya stir-fry',         diet: 'veg' },
      { emoji: '🍆', name: 'Ennai Kathirikai',           desc: 'Oil-roasted stuffed brinjal',          diet: 'vegan' },
      { emoji: '🧈', name: 'Dal Makhani',                desc: 'Creamy black dal with butter',         diet: 'veg' },
      { emoji: '🧄', name: 'Garlic Rasam',               desc: 'Thin peppery garlic rasam',            diet: 'vegan' },
      { emoji: '🍚', name: 'Plain Rice',                 desc: '300 gm steamed rice',                  diet: 'vegan' },
      { emoji: '🥗', name: 'Salad',                      desc: 'Fresh salad',                          diet: 'vegan' },
      { emoji: '🥛', name: 'Curd',                       desc: '80 ml curd',                           diet: 'veg' },
      { emoji: '🫓', name: 'Chapathi',                   desc: '2 chapathis',                          diet: 'veg' },
      { emoji: '🥜', name: 'Frymus',                     desc: 'Fried frymus papad',                   diet: 'veg' },
      { emoji: '🌶', name: 'Pickle',                     desc: 'Side pickle',                          diet: 'vegan' },
      { emoji: '🍮', name: 'Gulab Jamoon',               desc: 'Milk-solid dumplings in syrup',        diet: 'veg' },
    ],
    snack: [
      { emoji: '🥗', name: 'Cucumber Corn & Sprout Chaat', desc: 'Light healthy chaat',               diet: 'vegan' },
      { emoji: '☕', name: 'Tea / Coffee / Milk',        desc: '110 ml',                               diet: 'veg' },
    ],
    dinner: [
      { emoji: '🥬', name: 'Veg Jalfrezi',               desc: 'Stir-fried mixed vegetables',          diet: 'vegan' },
      { emoji: '🍛', name: 'Dal Amritar',                desc: 'Punjabi-style dal',                    diet: 'veg' },
      { emoji: '🍅', name: 'Tamil Nadu Sambar',          desc: 'Traditional TN-style sambar',          diet: 'vegan' },
      { emoji: '🍚', name: 'Plain Rice',                 desc: '300 gm steamed rice',                  diet: 'vegan' },
      { emoji: '🌶', name: 'Chilli Bhaji',               desc: 'Green chilli fritters — live',         diet: 'veg' },
      { emoji: '🍅', name: 'Tomato Gojju Rice',          desc: 'Karnataka-style tomato rice',          diet: 'vegan' },
      { emoji: '🫓', name: 'Tawa Paratha',               desc: 'Griddle-fried layered paratha',        diet: 'veg' },
      { emoji: '🥜', name: 'Buttermilk',                 desc: 'Chilled buttermilk',                   diet: 'veg' },
      { emoji: '🍋', name: 'Fryums (Pickle side)',       desc: 'Side fryums & pickle',                 diet: 'veg' },
    ],
  },

  '2026-10-16': { // Friday
    breakfast: [
      { emoji: '🥞', name: 'Veg Uthappam',              desc: 'Thick rice pancake with toppings',      diet: 'veg' },
      { emoji: '🍡', name: 'Sabudhana Khichdi',         desc: 'Sago pearls with peanuts & spices',     diet: 'veg' },
      { emoji: '🥣', name: 'Sambar',                    desc: 'Classic sambar',                        diet: 'veg' },
      { emoji: '🔴', name: 'Red Chutney',               desc: 'Spicy tomato-chilli chutney',           diet: 'vegan' },
      { emoji: '🍞', name: 'Bread + Butter / Jam',      desc: '2 slices',                              diet: 'veg' },
      { emoji: '🍌', name: 'Banana',                    desc: 'Fresh banana (cereals)',                diet: 'vegan' },
      { emoji: '☕', name: 'Tea / Coffee / Milk',       desc: '110 ml',                               diet: 'veg' },
      { emoji: '🥚', name: 'Boiled Egg / Boiled Channa', desc: 'Choice of egg or boiled channa',      diet: 'nonveg' },
    ],
    lunch: [
      { emoji: '🧆', name: 'Pindi Chole (Brown)',        desc: 'Dry-roasted brown chole',               diet: 'vegan' },
      { emoji: '🥦', name: 'Vegetable Kurma',            desc: 'Mixed veg in coconut-nut gravy',        diet: 'veg' },
      { emoji: '🌿', name: 'Dal Palak',                  desc: 'Spinach lentil dal',                   diet: 'veg' },
      { emoji: '🥬', name: 'Mix Veg Sambar',             desc: 'Mixed vegetable sambar',               diet: 'veg' },
      { emoji: '🍚', name: 'Plain Rice',                 desc: '300 gm steamed rice',                  diet: 'vegan' },
      { emoji: '🥗', name: 'Salad',                      desc: 'Fresh salad',                          diet: 'vegan' },
      { emoji: '🥛', name: 'Curd',                       desc: '80 ml curd',                           diet: 'veg' },
      { emoji: '🫓', name: 'Chapathi',                   desc: '2 chapathis',                          diet: 'veg' },
      { emoji: '🫘', name: 'Papad',                      desc: 'Crispy papad',                         diet: 'veg' },
      { emoji: '🌶', name: 'Pickle',                     desc: 'Side pickle',                          diet: 'vegan' },
      { emoji: '🍮', name: 'Moong Dal Payasam',          desc: 'Sweet lentil kheer',                   diet: 'veg' },
    ],
    snack: [
      { emoji: '🥮', name: 'Methi Mathri',               desc: 'Fenugreek-flavoured crispy snack',     diet: 'veg' },
      { emoji: '☕', name: 'Tea / Coffee / Milk',        desc: '110 ml',                               diet: 'veg' },
    ],
    dinner: [
      { emoji: '🫑', name: 'Aloo Capsicum Mutter Dry',   desc: 'Potato, capsicum & pea stir-fry',      diet: 'vegan' },
      { emoji: '🟡', name: 'Dal Tadka',                   desc: 'Tempered yellow dal',                  diet: 'veg' },
      { emoji: '🌿', name: 'Mint Rasam',                  desc: 'Refreshing mint rasam',                diet: 'vegan' },
      { emoji: '🍚', name: 'Plain Rice',                  desc: '300 gm steamed rice',                  diet: 'vegan' },
      { emoji: '🥢', name: 'Chinese Bhel',                desc: 'Indo-Chinese crispy bhel — live',      diet: 'veg' },
      { emoji: '🍛', name: 'Veg Schezwan Fried Rice',    desc: 'Spicy Schezwan-style fried rice',      diet: 'veg' },
      { emoji: '🫓', name: 'Plain Chapathi',              desc: '2 chapathis',                          diet: 'veg' },
      { emoji: '🥜', name: 'Fryums',                      desc: 'Side fryums',                          diet: 'veg' },
      { emoji: '🍋', name: 'Lemon Pickle',                desc: 'Side pickle',                          diet: 'vegan' },
    ],
  },

  '2026-10-17': { // Saturday
    breakfast: [
      { emoji: '🍩', name: 'Poori',                      desc: 'Deep-fried fluffy bread',               diet: 'veg' },
      { emoji: '🍲', name: 'Dal Kitchidi',                desc: 'Rice & lentil one-pot dish',            diet: 'veg' },
      { emoji: '🥔', name: 'Aloo Bhajji',                desc: 'Crispy potato fritters',                diet: 'veg' },
      { emoji: '🥥', name: 'Coconut Chutney',            desc: 'Fresh ground coconut chutney',          diet: 'vegan' },
      { emoji: '🍞', name: 'Bread + Butter / Jam',       desc: '2 slices',                              diet: 'veg' },
      { emoji: '🌱', name: 'Sprout',                     desc: 'Fresh sprouts (cereals)',               diet: 'vegan' },
      { emoji: '☕', name: 'Tea / Coffee / Milk',        desc: '110 ml',                               diet: 'veg' },
      { emoji: '🥚', name: 'Boiled Egg / Sprouts',       desc: 'Choice of egg or sprouts',             diet: 'nonveg' },
      { emoji: '🍦', name: 'Vanilla Milkshake',          desc: 'Chilled vanilla milkshake (150 ml)',   diet: 'veg' },
    ],
    lunch: [
      { emoji: '🌿', name: 'Veg Kurchan Dry',            desc: 'Mixed veg dry kurchan-style',           diet: 'vegan' },
      { emoji: '🫘', name: 'Rajma Masala',               desc: 'Punjabi red kidney bean curry',         diet: 'vegan' },
      { emoji: '🍅', name: 'Tomato Pappu',               desc: 'Andhra tomato dal',                     diet: 'veg' },
      { emoji: '🌾', name: 'Dal Rasam',                  desc: 'Light lentil-based rasam',              diet: 'vegan' },
      { emoji: '🍚', name: 'Plain Rice',                 desc: '300 gm steamed rice',                   diet: 'vegan' },
      { emoji: '🥗', name: 'Salad',                      desc: 'Fresh salad',                           diet: 'vegan' },
      { emoji: '🥛', name: 'Curd',                       desc: '80 ml curd',                            diet: 'veg' },
      { emoji: '🫓', name: 'Chapathi',                   desc: '2 chapathis',                           diet: 'veg' },
      { emoji: '🥜', name: 'Frymus',                     desc: 'Fried frymus papad',                    diet: 'veg' },
      { emoji: '🌶', name: 'Pickle',                     desc: 'Side pickle',                           diet: 'vegan' },
    ],
    snack: [
      { emoji: '🍰', name: 'Fruit Cake',                 desc: 'Freshly baked fruit cake',              diet: 'veg' },
      { emoji: '☕', name: 'Tea / Coffee',               desc: '110 ml',                               diet: 'veg' },
      { emoji: '🍊', name: 'Cut Fruits',                 desc: 'Seasonal fresh cut fruit',             diet: 'vegan' },
    ],
    dinner: [
      { emoji: '🌿', name: 'Tendli White Channa Dry',   desc: 'Ivy gourd & white chickpea stir-fry',   diet: 'vegan' },
      { emoji: '🍲', name: 'Dal Kolhapuri',              desc: 'Spicy Kolhapuri-style dal',             diet: 'veg' },
      { emoji: '🧄', name: 'Garlic Rasam',               desc: 'Thin peppery garlic rasam',             diet: 'vegan' },
      { emoji: '🍚', name: 'Plain Rice',                 desc: '300 gm steamed rice',                   diet: 'vegan' },
      { emoji: '🥘', name: 'Paneer Do Pyaza',            desc: 'Paneer with double onion — live',       diet: 'veg' },
      { emoji: '🍛', name: 'Kashmiri Pulao',             desc: 'Aromatic rice with dry fruits',         diet: 'veg' },
      { emoji: '🫓', name: 'Methi Chapathi',             desc: 'Fenugreek-flavoured chapathi',          diet: 'veg' },
      { emoji: '🥜', name: 'Fryums',                     desc: 'Side fryums',                           diet: 'veg' },
      { emoji: '🌶', name: 'Mix Pickle',                 desc: 'Side pickle',                           diet: 'vegan' },
      { emoji: '🥛', name: 'Curd',                       desc: 'Curd on side',                          diet: 'veg' },
    ],
  },

  '2026-10-18': { // Sunday
    breakfast: [
      { emoji: '🫓', name: 'Masala Dosa',               desc: 'Crispy dosa with potato masala (2+1)',  diet: 'veg' },
      { emoji: '🍮', name: 'Kesari Bath',               desc: 'Sweet semolina halwa',                   diet: 'veg' },
      { emoji: '🥣', name: 'Sambar',                    desc: 'Classic sambar',                         diet: 'veg' },
      { emoji: '🥥', name: 'Coconut Chutney',           desc: 'Fresh ground coconut chutney',           diet: 'vegan' },
      { emoji: '🍞', name: 'Bread + Butter / Jam',      desc: '2 slices',                               diet: 'veg' },
      { emoji: '🍌', name: 'Banana',                    desc: 'Fresh banana (cereals)',                 diet: 'vegan' },
      { emoji: '☕', name: 'Tea / Coffee / Milk',       desc: '110 ml',                                diet: 'veg' },
      { emoji: '🥚', name: 'Boiled Egg / Banana',       desc: 'Choice of egg or banana',               diet: 'nonveg' },
    ],
    lunch: [
      { emoji: '🍗', name: 'Ambur Chicken Biryani',     desc: 'Fragrant Ambur-style chicken biryani',  diet: 'nonveg' },
      { emoji: '🍛', name: 'Paneer & Soya Biryani',     desc: 'Veg biryani — limited chapathi side',   diet: 'veg' },
      { emoji: '🟡', name: 'Channa Dal Tadka',           desc: 'Tempered split chickpea dal',           diet: 'veg' },
      { emoji: '🌿', name: 'Pepper Rasam',               desc: 'Peppery thin rasam',                    diet: 'vegan' },
      { emoji: '🍚', name: 'Plain Rice',                 desc: '300 gm steamed rice',                   diet: 'vegan' },
      { emoji: '🥗', name: 'Salad',                      desc: 'Fresh salad',                           diet: 'vegan' },
      { emoji: '🥛', name: 'Mixed Raita',                desc: 'Mixed raita',                           diet: 'veg' },
      { emoji: '🫓', name: 'Chapathi (limited 100 nos)', desc: '2 plain chapathis',                    diet: 'veg' },
      { emoji: '🫘', name: 'Papad',                      desc: 'Crispy papad',                          diet: 'veg' },
      { emoji: '🍦', name: 'Ice Cream',                  desc: 'Sweet dessert of the day',              diet: 'veg' },
      { emoji: '🌶', name: 'Pickle',                     desc: 'Side pickle',                           diet: 'vegan' },
    ],
    snack: [
      { emoji: '🥟', name: 'Aloo Bonda (2 nos)',        desc: 'Potato bonda with tomato ketchup',       diet: 'veg' },
      { emoji: '☕', name: 'Tea / Coffee / Milk',       desc: '110 ml',                                diet: 'veg' },
    ],
    dinner: [
      { emoji: '🍌', name: 'Raw Banana 65',              desc: 'Crispy raw banana fritters',            diet: 'vegan' },
      { emoji: '🌾', name: 'Beerakaya Pappu',            desc: 'Ridge gourd lentil dal — Andhra',      diet: 'veg' },
      { emoji: '🥣', name: 'Sambar',                     desc: 'Classic sambar',                        diet: 'veg' },
      { emoji: '🍚', name: 'Plain Rice',                 desc: '300 gm steamed rice',                   diet: 'vegan' },
      { emoji: '🌯', name: 'Veg Spring Roll',            desc: 'Crispy spring roll — live',             diet: 'veg' },
      { emoji: '🍛', name: 'Andhra Style Veg Pulao',    desc: 'Spicy Andhra-style pulao',               diet: 'vegan' },
      { emoji: '🫓', name: 'Tawa Paratha',               desc: 'Griddle-fried paratha',                 diet: 'veg' },
      { emoji: '🥜', name: 'Fryums',                     desc: 'Side fryums',                           diet: 'veg' },
      { emoji: '🌶', name: 'Mix Pickle',                 desc: 'Side pickle',                           diet: 'vegan' },
      { emoji: '🥗', name: 'Mix Veg Raitha',             desc: 'Yogurt raitha',                         diet: 'veg' },
    ],
  },

  // ════ WEEK 2: Oct 19–25 2026 ════

  '2026-10-19': { // Monday
    breakfast: [
      { emoji: '🫓', name: 'Rice Idly & Uddina Vada',  desc: 'Steamed idly with crispy vada (2+1)',   diet: 'veg' },
      { emoji: '🌾', name: 'Bhel Upma',                desc: 'Puffed rice upma',                       diet: 'vegan' },
      { emoji: '🥣', name: 'Sambar',                   desc: 'Classic sambar',                         diet: 'veg' },
      { emoji: '🥥', name: 'Coconut Chutney',          desc: 'Fresh ground coconut chutney',           diet: 'vegan' },
      { emoji: '🍞', name: 'Bread + Butter / Jam',     desc: '2 slices',                               diet: 'veg' },
      { emoji: '🍉', name: 'Watermelon Juice',         desc: 'Fresh watermelon juice (150 ml)',        diet: 'vegan' },
      { emoji: '☕', name: 'Tea / Coffee / Milk',      desc: '110 ml',                                diet: 'veg' },
    ],
    lunch: [
      { emoji: '🥬', name: 'Mix Veg Poriyal',          desc: 'South Indian mixed veg stir-fry',        diet: 'vegan' },
      { emoji: '🫘', name: 'Lobiya Masala',             desc: 'Black-eyed pea curry',                   diet: 'vegan' },
      { emoji: '💚', name: 'Green Moong Dal Tadka',    desc: 'Tempered whole green moong',             diet: 'vegan' },
      { emoji: '🧄', name: 'Garlic Rasam',             desc: 'Thin peppery garlic rasam',              diet: 'vegan' },
      { emoji: '🍚', name: 'Plain Rice',               desc: '300 gm steamed rice',                    diet: 'vegan' },
      { emoji: '🥗', name: 'Salad',                    desc: 'Fresh salad',                            diet: 'vegan' },
      { emoji: '🥛', name: 'Curd',                     desc: '80 ml curd',                             diet: 'veg' },
      { emoji: '🫓', name: 'Plain Chapathi',           desc: '2 plain chapathis',                      diet: 'veg' },
      { emoji: '🥜', name: 'Frymes',                   desc: 'Side frymes papad',                      diet: 'veg' },
      { emoji: '🌶', name: 'Pickle',                   desc: 'Side pickle',                            diet: 'vegan' },
    ],
    snack: [
      { emoji: '🥪', name: 'Veg & Paneer Tikka Subway Sandwich', desc: 'Sub with tikka filling',     diet: 'veg' },
      { emoji: '🍅', name: 'Tomato Ketchup',           desc: 'Side ketchup',                           diet: 'vegan' },
      { emoji: '☕', name: 'Tea / Coffee',             desc: '110 ml',                                diet: 'veg' },
    ],
    dinner: [
      { emoji: '🥒', name: 'Lauki Chawli Masala',      desc: 'Bottle gourd & cowpea masala',           diet: 'vegan' },
      { emoji: '🍛', name: 'Masala Dal',               desc: 'Spiced mixed dal',                       diet: 'veg' },
      { emoji: '🌿', name: 'Pepper Rasam',             desc: 'Peppery thin rasam',                     diet: 'vegan' },
      { emoji: '🍚', name: 'Plain Rice',               desc: '300 gm steamed rice',                    diet: 'vegan' },
      { emoji: '🍝', name: 'Pasta with Pink Sauce',    desc: 'Pasta in tomato cream sauce — live',    diet: 'veg' },
      { emoji: '🍛', name: 'Sabzi Pulao',              desc: 'Mixed vegetable pulao',                  diet: 'vegan' },
      { emoji: '🫓', name: 'Plain Chapathi',           desc: '2 chapathis',                            diet: 'veg' },
      { emoji: '🫘', name: 'Papad',                    desc: 'Side papad',                             diet: 'veg' },
      { emoji: '🌶', name: 'Pickle',                   desc: 'Side pickle',                            diet: 'vegan' },
      { emoji: '🥩', name: 'Afghani Korma (Paneer)',   desc: 'Paneer in creamy Afghani gravy',          diet: 'veg' },
      { emoji: '🥚', name: 'Egg Bhuna Masala',         desc: 'Spiced dry egg masala',                  diet: 'nonveg' },
    ],
  },

  '2026-10-20': { // Tuesday
    breakfast: [
      { emoji: '🫔', name: 'Moong Dal Chilla',          desc: 'Savoury moong dal pancake (2+1)',       diet: 'veg' },
      { emoji: '🍛', name: 'Palak Dal Khichdi',         desc: 'Spinach & lentil one-pot dish',          diet: 'veg' },
      { emoji: '🥣', name: 'Sambar',                    desc: 'Classic sambar',                         diet: 'veg' },
      { emoji: '🥥', name: 'Coconut Chutney',           desc: 'Fresh ground coconut chutney',           diet: 'vegan' },
      { emoji: '🍞', name: 'Bread + Butter / Jam',      desc: '2 slices',                               diet: 'veg' },
      { emoji: '☕', name: 'Tea / Coffee / Milk',       desc: '110 ml',                                diet: 'veg' },
      { emoji: '🥚', name: 'Boiled Egg / Banana',       desc: 'Choice of egg or banana',               diet: 'nonveg' },
    ],
    lunch: [
      { emoji: '🥬', name: 'Bhindi Kur Kure',           desc: 'Crispy okra fry',                        diet: 'vegan' },
      { emoji: '🫘', name: 'Kadala Curry',               desc: 'Kerala-style black chickpea curry',     diet: 'vegan' },
      { emoji: '🧄', name: 'Dal Lasooni',                desc: 'Garlic-infused dal',                    diet: 'veg' },
      { emoji: '🌶', name: 'Andhra Sambar',              desc: 'Spicy Andhra-style sambar',              diet: 'veg' },
      { emoji: '🍚', name: 'Plain Rice',                 desc: '300 gm steamed rice',                   diet: 'vegan' },
      { emoji: '🥗', name: 'Salad',                      desc: 'Fresh salad',                           diet: 'vegan' },
      { emoji: '🥛', name: 'Curd',                       desc: '80 ml curd',                            diet: 'veg' },
      { emoji: '🫓', name: 'Plain Chapathi',             desc: '2 plain chapathis',                     diet: 'veg' },
      { emoji: '🫘', name: 'Papad',                      desc: 'Crispy papad',                          diet: 'veg' },
      { emoji: '🌶', name: 'Pickle',                     desc: 'Side pickle',                           diet: 'vegan' },
      { emoji: '🍰', name: 'Pineapple Pastry',           desc: 'Sweet dessert of the day',              diet: 'veg' },
    ],
    snack: [
      { emoji: '🥣', name: 'Dahi Papadi Chaat',          desc: 'Crispy papadi with yogurt & chutney',   diet: 'veg' },
      { emoji: '☕', name: 'Tea / Coffee',               desc: '110 ml',                               diet: 'veg' },
    ],
    dinner: [
      { emoji: '🥔', name: 'Punjabi Aloo Matar Semi Gravy', desc: 'Potato & pea semi-dry curry',       diet: 'vegan' },
      { emoji: '🟡', name: 'Dal Mughlai',                desc: 'Rich Mughlai-style dal',                diet: 'veg' },
      { emoji: '🌿', name: 'Pepper Rasam',               desc: 'Peppery thin rasam',                   diet: 'vegan' },
      { emoji: '🍚', name: 'Plain Rice',                 desc: '300 gm steamed rice',                   diet: 'vegan' },
      { emoji: '🍩', name: 'Special Poori',              desc: 'Fluffy special poori — live',           diet: 'veg' },
      { emoji: '🍛', name: 'Veg Biryani',               desc: 'Fragrant vegetable biryani',             diet: 'vegan' },
      { emoji: '🥛', name: 'Mix Veg Raitha',             desc: 'Yogurt raitha',                         diet: 'veg' },
      { emoji: '🥜', name: 'Frymes',                     desc: 'Side frymes',                           diet: 'veg' },
      { emoji: '🌶', name: 'Pickle',                     desc: 'Side pickle',                           diet: 'vegan' },
    ],
  },

  '2026-10-21': { // Wednesday
    breakfast: [
      { emoji: '🍜', name: 'Idiyappam',                 desc: 'Steamed string hoppers (2+1)',           diet: 'veg' },
      { emoji: '🍞', name: 'Bread Pakoda',              desc: 'Crispy battered bread fritters',         diet: 'veg' },
      { emoji: '🥥', name: 'Veg Stew',                  desc: 'Coconut milk vegetable stew',            diet: 'veg' },
      { emoji: '🥥', name: 'Coconut Chutney',           desc: 'Fresh ground coconut chutney',           diet: 'vegan' },
      { emoji: '🍞', name: 'Bread + Butter / Jam',      desc: '2 slices',                               diet: 'veg' },
      { emoji: '☕', name: 'Tea / Coffee / Milk',       desc: '110 ml',                                diet: 'veg' },
    ],
    lunch: [
      { emoji: '🫚', name: 'Veg Jaipuri Dry',           desc: 'Rajasthani mixed veg dry',               diet: 'vegan' },
      { emoji: '🥦', name: 'Chow Chow Kootu',           desc: 'Chayote & lentil kootu',                 diet: 'veg' },
      { emoji: '🌿', name: 'Dal Palak',                 desc: 'Spinach lentil dal',                     diet: 'veg' },
      { emoji: '🌿', name: 'Pepper Rasam',              desc: 'Peppery thin rasam',                     diet: 'vegan' },
      { emoji: '🍚', name: 'Plain Rice',                desc: '300 gm steamed rice',                    diet: 'vegan' },
      { emoji: '🥗', name: 'Salad',                     desc: 'Fresh salad',                            diet: 'vegan' },
      { emoji: '🥛', name: 'Curd',                      desc: '80 ml curd',                             diet: 'veg' },
      { emoji: '🫓', name: 'Plain Chapathi',            desc: '2 plain chapathis',                      diet: 'veg' },
      { emoji: '🥜', name: 'Frymes',                    desc: 'Side frymes papad',                      diet: 'veg' },
      { emoji: '🌶', name: 'Pickle',                    desc: 'Side pickle',                            diet: 'vegan' },
      { emoji: '🍗', name: 'Butter Chicken',            desc: 'Non-veg special',                        diet: 'nonveg' },
    ],
    snack: [
      { emoji: '🥟', name: 'Goli Bajji',               desc: 'Soft maida fritters',                     diet: 'veg' },
      { emoji: '🥛', name: 'White Chutney',            desc: 'Side white chutney',                      diet: 'veg' },
      { emoji: '☕', name: 'Tea / Coffee',             desc: '110 ml',                                 diet: 'veg' },
    ],
    dinner: [
      { emoji: '🔴', name: 'Beetroot Channa Poriyal',   desc: 'Beetroot & chickpea stir-fry',           diet: 'vegan' },
      { emoji: '🧄', name: 'Lasooni Dal',               desc: 'Garlic-tempered dal',                    diet: 'veg' },
      { emoji: '🍋', name: 'Lemon Rasam',               desc: 'Tangy lemon rasam',                      diet: 'vegan' },
      { emoji: '🍚', name: 'Plain Rice',                desc: '300 gm steamed rice',                    diet: 'vegan' },
      { emoji: '🍛', name: 'Jeera Chilli Pulao',        desc: 'Cumin & chilli flavoured rice',          diet: 'vegan' },
      { emoji: '🫓', name: 'Plain Chapathi',            desc: '2 chapathis',                            diet: 'veg' },
      { emoji: '�', name: 'Papad',                     desc: 'Side papad',                             diet: 'veg' },
      { emoji: '🌶', name: 'Pickle',                    desc: 'Side pickle',                            diet: 'vegan' },
      { emoji: '�', name: 'Butter Chicken',            desc: 'Non-veg special',                        diet: 'nonveg' },
      { emoji: '🥩', name: 'Paneer Tikka Masala',       desc: 'Grilled paneer in spicy gravy',          diet: 'veg' },
    ],
  },

  '2026-10-22': { // Thursday
    breakfast: [
      { emoji: '🍅', name: 'Tomato & Peas Karabath',    desc: 'Spicy semolina upma (2+1)',              diet: 'veg' },
      { emoji: '🍩', name: 'Poori',                     desc: 'Deep-fried fluffy poori',                diet: 'veg' },
      { emoji: '🥦', name: 'Veg Sagu',                  desc: 'Mixed veg coconut-based sagu',           diet: 'veg' },
      { emoji: '🥥', name: 'Coconut Chutney',           desc: 'Fresh ground coconut chutney',           diet: 'vegan' },
      { emoji: '🍞', name: 'Bread + Butter / Jam',      desc: '2 slices',                               diet: 'veg' },
      { emoji: '☕', name: 'Tea / Coffee / Milk',       desc: '110 ml',                                diet: 'veg' },
      { emoji: '🥚', name: 'Boiled Egg / Boiled Peanut', desc: 'Choice of egg or boiled peanuts',      diet: 'nonveg' },
    ],
    lunch: [
      { emoji: '🌶', name: 'Soya 65',                   desc: 'Crispy spiced soya chunks',               diet: 'veg' },
      { emoji: '🌽', name: 'Corn Peas Makhanwala',      desc: 'Corn & peas in buttery tomato gravy',     diet: 'veg' },
      { emoji: '🟡', name: 'Masala Dal',                desc: 'Spiced mixed dal',                        diet: 'veg' },
      { emoji: '🥬', name: 'Vegetable Sambar',          desc: 'Hearty vegetable sambar',                 diet: 'veg' },
      { emoji: '🍚', name: 'Plain Rice',                desc: '300 gm steamed rice',                     diet: 'vegan' },
      { emoji: '🥗', name: 'Salad',                     desc: 'Fresh salad',                             diet: 'vegan' },
      { emoji: '🥛', name: 'Curd',                      desc: '80 ml curd',                              diet: 'veg' },
      { emoji: '🫓', name: 'Plain Chapathi',            desc: '2 plain chapathis',                       diet: 'veg' },
      { emoji: '🫘', name: 'Papad',                     desc: 'Crispy papad',                            diet: 'veg' },
      { emoji: '🌶', name: 'Pickle',                    desc: 'Side pickle',                             diet: 'vegan' },
      { emoji: '🥥', name: 'Coconut Burfi',             desc: 'Sweet coconut barfi',                     diet: 'veg' },
    ],
    snack: [
      { emoji: '🫘', name: 'Black Chana Peanut Sundal', desc: 'Protein-packed boiled sundal',            diet: 'vegan' },
      { emoji: '☕', name: 'Tea / Coffee',              desc: '110 ml',                                 diet: 'veg' },
      { emoji: '🍉', name: 'Watermelon Slice',          desc: 'Fresh watermelon slices',                diet: 'vegan' },
    ],
    dinner: [
      { emoji: '🥬', name: 'Kadai Vegetables',          desc: 'Mixed vegetables in spiced kadai',        diet: 'vegan' },
      { emoji: '🎃', name: 'Pumpkin Dal',               desc: 'Yellow pumpkin lentil dal',               diet: 'veg' },
      { emoji: '🥣', name: 'Sambar',                    desc: 'Classic sambar',                          diet: 'veg' },
      { emoji: '🍚', name: 'Plain Rice',                desc: '300 gm steamed rice',                     diet: 'vegan' },
      { emoji: '🧆', name: 'Masala Vada',               desc: 'Crispy lentil fritters — live',           diet: 'veg' },
      { emoji: '🍅', name: 'Tomato Rice Bath',          desc: 'Karnataka tomato rice',                   diet: 'vegan' },
      { emoji: '🫓', name: 'Plain Chapathi',            desc: '2 chapathis',                             diet: 'veg' },
      { emoji: '🥛', name: 'Buttermilk',               desc: 'Chilled buttermilk',                      diet: 'veg' },
      { emoji: '🥜', name: 'Frymes',                    desc: 'Side frymes',                             diet: 'veg' },
      { emoji: '🌶', name: 'Pickle',                    desc: 'Side pickle',                             diet: 'vegan' },
    ],
  },

  '2026-10-23': { // Friday
    breakfast: [
      { emoji: '🫓', name: 'Adai',                      desc: 'Thick multi-lentil dosa (2+1)',           diet: 'veg' },
      { emoji: '🌾', name: 'Daliya Upma',               desc: 'Broken wheat upma',                      diet: 'veg' },
      { emoji: '🍛', name: 'Kurma',                     desc: 'Mixed vegetable kurma',                  diet: 'veg' },
      { emoji: '🔴', name: 'Red Chutney',               desc: 'Spicy tomato-chilli chutney',             diet: 'vegan' },
      { emoji: '🍞', name: 'Bread + Butter / Jam',      desc: '2 slices',                               diet: 'veg' },
      { emoji: '🍌', name: 'Banana',                    desc: 'Fresh banana (cereals)',                 diet: 'vegan' },
      { emoji: '☕', name: 'Tea / Coffee / Milk',       desc: '110 ml',                                diet: 'veg' },
      { emoji: '🥚', name: 'Boiled Egg / Banana',       desc: 'Choice of egg or banana',               diet: 'nonveg' },
    ],
    lunch: [
      { emoji: '🥕', name: 'Aloo Peas & Carrot Dry',   desc: 'Potato, peas & carrot dry sabzi',         diet: 'vegan' },
      { emoji: '🥒', name: 'Keera Kootu',               desc: 'Cucumber & lentil kootu',                diet: 'veg' },
      { emoji: '🫘', name: 'Rajma Raseela Semi Dry',    desc: 'Rajma in semi-dry masala',               diet: 'vegan' },
      { emoji: '🌿', name: 'Mysore Rasam',              desc: 'Fragrant Mysore-style rasam',             diet: 'vegan' },
      { emoji: '🍚', name: 'Plain Rice',                desc: '300 gm steamed rice',                    diet: 'vegan' },
      { emoji: '🥗', name: 'Salad',                     desc: 'Fresh salad',                            diet: 'vegan' },
      { emoji: '🥛', name: 'Curd',                      desc: '80 ml curd',                             diet: 'veg' },
      { emoji: '🫓', name: 'Plain Chapathi',            desc: '2 plain chapathis',                      diet: 'veg' },
      { emoji: '🥜', name: 'Frymes',                    desc: 'Side frymes papad',                      diet: 'veg' },
      { emoji: '🌶', name: 'Pickle',                    desc: 'Side pickle',                            diet: 'vegan' },
      { emoji: '🍮', name: 'Jalebi',                    desc: 'Crispy sweet jalebi',                    diet: 'veg' },
    ],
    snack: [
      { emoji: '🥨', name: 'Namak Para (Spicy)',        desc: 'Crispy spiced snack',                     diet: 'vegan' },
      { emoji: '☕', name: 'Tea / Coffee',              desc: '110 ml',                                diet: 'veg' },
    ],
    dinner: [
      { emoji: '🥬', name: 'Cabbage & Channa Dal Poriyal', desc: 'Cabbage & lentil dry fry',            diet: 'vegan' },
      { emoji: '🟡', name: 'Dal Mughlai',               desc: 'Rich Mughlai-style dal',                 diet: 'veg' },
      { emoji: '🍋', name: 'Tamarind Rasam',            desc: 'Tangy tamarind rasam',                   diet: 'vegan' },
      { emoji: '🍚', name: 'Plain Rice',                desc: '300 gm steamed rice',                    diet: 'vegan' },
      { emoji: '🥢', name: 'Veg Ball Manchurian Semi Dry', desc: 'Indo-Chinese Manchurian — live',      diet: 'veg' },
      { emoji: '🍜', name: 'Veg Schezwan Noodles',      desc: 'Spicy noodles with more veggies',        diet: 'veg' },
      { emoji: '🫓', name: 'Plain Chapathi',            desc: '2 chapathis',                            diet: 'veg' },
      { emoji: '🫘', name: 'Papad',                     desc: 'Side papad',                             diet: 'veg' },
      { emoji: '🌶', name: 'Pickle',                    desc: 'Side pickle',                            diet: 'vegan' },
    ],
  },

  '2026-10-24': { // Saturday
    breakfast: [
      { emoji: '🫓', name: 'Mix Veg Paratha',           desc: 'Stuffed mixed veg flatbread (2+1)',       diet: 'veg' },
      { emoji: '🍛', name: 'Chitranna',                 desc: 'Karnataka lemon-turmeric rice',           diet: 'vegan' },
      { emoji: '🥛', name: 'Curd',                      desc: 'Curd side',                              diet: 'veg' },
      { emoji: '🥥', name: 'Coconut Chutney',           desc: 'Fresh ground coconut chutney',           diet: 'vegan' },
      { emoji: '🍞', name: 'Bread + Butter / Jam',      desc: '2 slices',                               diet: 'veg' },
      { emoji: '☕', name: 'Tea / Coffee / Milk',       desc: '110 ml',                                diet: 'veg' },
      { emoji: '🥚', name: 'Boiled Egg / Sundal',       desc: 'Choice of egg or boiled sundal',        diet: 'nonveg' },
      { emoji: '🍌', name: 'Banana Milkshake',          desc: 'Chilled banana milkshake (150 ml)',      diet: 'veg' },
    ],
    lunch: [
      { emoji: '🌿', name: 'Green Moong Soppu Palya',   desc: 'Moong greens stir-fry',                   diet: 'vegan' },
      { emoji: '🥬', name: 'Subzi Tikka Masala',        desc: 'Mixed veg tikka masala curry',            diet: 'veg' },
      { emoji: '🫛', name: 'Ma Ki Dal',                 desc: 'Slow-cooked whole black lentil dal',      diet: 'veg' },
      { emoji: '🍅', name: 'Tomato Rasam',              desc: 'Tangy tomato rasam',                      diet: 'vegan' },
      { emoji: '🍚', name: 'Plain Rice',                desc: '300 gm steamed rice',                    diet: 'vegan' },
      { emoji: '🥗', name: 'Salad',                     desc: 'Fresh salad',                            diet: 'vegan' },
      { emoji: '🥛', name: 'Curd',                      desc: '80 ml curd',                             diet: 'veg' },
      { emoji: '🫓', name: 'Plain Chapathi',            desc: '2 plain chapathis',                      diet: 'veg' },
      { emoji: '🫘', name: 'Papad',                     desc: 'Crispy papad',                           diet: 'veg' },
      { emoji: '🌶', name: 'Pickle',                    desc: 'Side pickle',                            diet: 'vegan' },
    ],
    snack: [
      { emoji: '🧁', name: 'Vanilla Muffin',            desc: 'Soft baked vanilla muffin',               diet: 'veg' },
      { emoji: '🌿', name: 'Mint Chutney',              desc: 'Side mint chutney',                       diet: 'vegan' },
      { emoji: '☕', name: 'Tea / Coffee',              desc: '110 ml',                                diet: 'veg' },
      { emoji: '🍊', name: 'Cut Fruits',                desc: 'Seasonal fresh cut fruit',              diet: 'vegan' },
    ],
    dinner: [
      { emoji: '🥔', name: 'Aloo Baingan Masala',       desc: 'Potato & brinjal masala',                 diet: 'vegan' },
      { emoji: '🫛', name: 'Maa Ki Dal',                desc: 'Rich whole black dal',                    diet: 'veg' },
      { emoji: '🥣', name: 'Sambar',                    desc: 'Classic sambar',                          diet: 'veg' },
      { emoji: '🍚', name: 'Plain Rice',                desc: '300 gm steamed rice',                    diet: 'vegan' },
      { emoji: '🧆', name: 'Paneer Kurma',              desc: 'Paneer in coconut kurma gravy — live',   diet: 'veg' },
      { emoji: '🍛', name: 'Rajma Pulao',               desc: 'Kidney bean pulao',                      diet: 'vegan' },
      { emoji: '🫓', name: 'Plain Chapathi',            desc: '2 chapathis',                            diet: 'veg' },
      { emoji: '🥜', name: 'Frymes',                    desc: 'Side frymes',                            diet: 'veg' },
      { emoji: '🌶', name: 'Pickle',                    desc: 'Side pickle',                            diet: 'vegan' },
      { emoji: '🥛', name: 'Curd',                      desc: 'Curd on side',                           diet: 'veg' },
    ],
  },

  '2026-10-25': { // Sunday
    breakfast: [
      { emoji: '🫓', name: 'Masala Dosa',               desc: 'Crispy dosa with potato masala (2+1)',   diet: 'veg' },
      { emoji: '🍲', name: 'Vangi Bath',                desc: 'Brinjal rice — Karnataka style',         diet: 'vegan' },
      { emoji: '🥣', name: 'Sambar',                    desc: 'Classic sambar',                         diet: 'veg' },
      { emoji: '🥥', name: 'Coconut Chutney',           desc: 'Fresh ground coconut chutney',           diet: 'vegan' },
      { emoji: '🍞', name: 'Bread + Butter / Jam',      desc: '2 slices',                               diet: 'veg' },
      { emoji: '☕', name: 'Tea / Coffee / Milk',       desc: '110 ml',                                diet: 'veg' },
      { emoji: '🥚', name: 'Boiled Egg / Banana',       desc: 'Choice of egg or banana',               diet: 'nonveg' },
    ],
    lunch: [
      { emoji: '🍗', name: 'Chicken Kabab Kushka',       desc: 'Chicken kabab with kushka rice',         diet: 'nonveg' },
      { emoji: '🍛', name: 'Paneer & Soya Biryani',     desc: 'Veg biryani with paneer & soya',          diet: 'veg' },
      { emoji: '🟡', name: 'Masala Dal',                desc: 'Spiced mixed dal',                        diet: 'veg' },
      { emoji: '🌿', name: 'Puli Rasam',                desc: 'Tangy tamarind rasam',                    diet: 'vegan' },
      { emoji: '🍚', name: 'Plain Rice',                desc: '300 gm steamed rice',                    diet: 'vegan' },
      { emoji: '🥗', name: 'Salad',                     desc: 'Fresh salad',                            diet: 'vegan' },
      { emoji: '🥛', name: 'Onion & Cucumber Raitha',  desc: 'Fresh raitha',                            diet: 'veg' },
      { emoji: '🫓', name: 'Plain Chapathi (200 nos)',  desc: '2 plain chapathis',                      diet: 'veg' },
      { emoji: '🥜', name: 'Frymes',                    desc: 'Side frymes papad',                      diet: 'veg' },
      { emoji: '🍫', name: 'Chocolate Ice Cream',       desc: 'Sweet dessert of the day',               diet: 'veg' },
      { emoji: '🌶', name: 'Pickle',                    desc: 'Side pickle',                            diet: 'vegan' },
    ],
    snack: [
      { emoji: '🥟', name: 'Samosa',                    desc: 'Crispy potato samosa',                   diet: 'veg' },
      { emoji: '🍅', name: 'Ketchup',                   desc: 'Side tomato ketchup',                    diet: 'vegan' },
      { emoji: '☕', name: 'Tea / Coffee',              desc: '110 ml',                                diet: 'veg' },
    ],
    dinner: [
      { emoji: '🥬', name: 'Hara Bhara Sabzi',          desc: 'Green spinach & pea sabzi',              diet: 'vegan' },
      { emoji: '🟡', name: 'Punjabi Dal Tadka',         desc: 'Tempered yellow dal',                    diet: 'veg' },
      { emoji: '🧄', name: 'Garlic Rasam',              desc: 'Thin peppery garlic rasam',              diet: 'vegan' },
      { emoji: '🍚', name: 'Plain Rice',                desc: '300 gm steamed rice',                   diet: 'vegan' },
      { emoji: '🥤', name: 'Strawberry Milkshake',      desc: 'Chilled strawberry milkshake — live',   diet: 'veg' },
      { emoji: '🍛', name: 'Peas & Carrot Pulao',       desc: 'Light peas & carrot pulao',             diet: 'vegan' },
      { emoji: '🫓', name: 'Plain Chapathi',            desc: '2 chapathis',                           diet: 'veg' },
      { emoji: '🫘', name: 'Papad',                     desc: 'Side papad',                            diet: 'veg' },
      { emoji: '🌶', name: 'Pickle',                    desc: 'Side pickle',                           diet: 'vegan' },
      { emoji: '🥗', name: 'Mix Veg Raitha',            desc: 'Yogurt raitha',                         diet: 'veg' },
    ],
  },
};

  // ════ WEEK 1: Oct 12–18 2026 ════
// use a generic placeholder so the UI never breaks
const menuFallback = {
  0: { // Monday
    breakfast: [{ emoji: '🍽️', name: 'Menu not available', desc: 'Check the notice board for today\'s menu', diet: 'veg' }],
    lunch:     [{ emoji: '🍽️', name: 'Menu not available', desc: 'Check the notice board for today\'s menu', diet: 'veg' }],
    snack:     [{ emoji: '🍽️', name: 'Menu not available', desc: 'Check the notice board for today\'s menu', diet: 'veg' }],
    dinner:    [{ emoji: '🍽️', name: 'Menu not available', desc: 'Check the notice board for today\'s menu', diet: 'veg' }],
  },
};
[1,2,3,4,5,6].forEach(d => { menuFallback[d] = menuFallback[0]; });

// Helper: get menu for a specific date (YYYY-MM-DD) or fallback
function getMenuForDate(dateStr) {
  return menuByDate[dateStr] || null;
}

// Keep old day-selector working: convert day index (0=Mon) to today's
// actual date string for that weekday in the current week
function dateStrForDayIndex(dayIndex) {
  // dayIndex: 0=Mon, 6=Sun
  const d = new Date();
  const jsDay = d.getDay(); // 0=Sun
  const currentMonIndex = jsDay === 0 ? 6 : jsDay - 1; // convert to Mon-based
  const diff = dayIndex - currentMonIndex;
  const target = new Date(d);
  target.setDate(d.getDate() + diff);
  return target.toISOString().split('T')[0];
}

// Legacy menuData kept as alias for fallback
const menuData = menuFallback;

// ── Shuttle data (JANANI bus — real APU timetable) ───────────────
// Weekdays: Mon–Fri  |  Weekends: Sat–Sun

// ── Shuttle data (JANANI bus — real APU timetable) ───────────────
// Weekdays: Mon–Fri  |  Weekends: Sat–Sun
const shuttleData = {
  weekday: {
    stationToCampus: [
      '07:15','07:30','07:45','08:00','08:15','08:30','08:45',
      '09:00','09:35','10:00','10:30','11:45','14:15','15:00',
      '16:15','16:35','17:05','17:20','17:35','17:50','18:05',
      '18:35','18:45','19:05','19:45','20:10','20:40','21:15',
      '21:45','22:10',
    ],
    campusToStation: [
      '07:00','07:20','07:35','07:50','08:05','08:20','08:35',
      '08:50','09:05','09:40','10:20','11:30','14:00','14:45',
      '16:00','16:30','17:00','17:15','17:30','17:45','18:00',
      '18:15','18:40','19:00','19:30','20:00','20:30','21:00',
      '21:30','22:00',
    ],
  },
  weekend: {
    stationToCampus: [
      '07:30','08:00','08:30','09:00','10:00','14:15','15:00',
      '16:15','16:45','17:15','18:15','19:00','20:00','21:00','22:05',
    ],
    campusToStation: [
      '07:20','07:45','08:20','08:50','09:10','13:45','14:45',
      '16:00','16:30','17:00','17:45','18:45','19:45','20:45','22:00',
    ],
  },
};

// ── Holidays data — Azim Premji University 2026 ──────────────────
// Source: Official APU Holiday List Jan–Dec 2026
const holidays2026 = [
  // ── Official university holidays ──
  { date: '2026-01-15', name: 'Makar Sankranti / Magha Bihu / Bhogi' },
  { date: '2026-01-26', name: 'Republic Day' },
  { date: '2026-03-19', name: 'Ugadi / Gudi Padwa / Chaithi Chand' },
  { date: '2026-05-01', name: 'May Day' },
  { date: '2026-05-28', name: 'Id-ul-Zuha (Bakrid)' },
  { date: '2026-09-14', name: 'Vinayaka Chaturti' },
  { date: '2026-10-02', name: 'Gandhi Jayanthi' },
  { date: '2026-10-21', name: 'Vijaya Dashami / Dussera' },
  { date: '2026-11-10', name: 'Deepavali / Naraka Chaturdasi / Balipadyami / Govardhan Puja' },
  { date: '2026-12-25', name: 'Christmas' },
];

// Build a quick lookup set: "YYYY-MM-DD" → name
const holidayMap = {};
holidays2026.forEach(h => { holidayMap[h.date] = h.name; });


// ─────────────────────────────────────────
// 2. STATE
// ─────────────────────────────────────────
const today  = new Date();
const todayY = today.getFullYear();
const todayM = today.getMonth();    // 0-indexed
const todayD = today.getDate();

// Map JS getDay() (0=Sun) to our Mon-based index for menu
// Mon=0 ... Sun=6  (menu uses 0=Mon)
function jsDay2MenuDay(jsDay) {
  return jsDay === 0 ? 6 : jsDay - 1; // Sun→6, Mon→0 ... Sat→5
}

// Meal windows — defined here so getCurrentMeal() and state init can use them
const MEAL_WINDOWS = {
  breakfast: { start: [7,  0],  end: [9,  30] },
  lunch:     { start: [12, 0],  end: [14, 20] },
  snack:     { start: [16, 30], end: [18, 15] },
  dinner:    { start: [19, 0],  end: [21, 30] },
};

// Returns the meal that should be active right now based on current time
function getCurrentMeal() {
  const now = today.getHours() * 60 + today.getMinutes();
  const order = ['breakfast', 'lunch', 'snack', 'dinner'];
  for (const meal of order) {
    const w = MEAL_WINDOWS[meal];
    const start = w.start[0] * 60 + w.start[1];
    const end   = w.end[0]   * 60 + w.end[1];
    if (now >= start && now <= end) return meal;
  }
  const firstStart = MEAL_WINDOWS.breakfast.start[0] * 60 + MEAL_WINDOWS.breakfast.start[1];
  if (now < firstStart) return 'breakfast';
  for (const meal of order) {
    const start = MEAL_WINDOWS[meal].start[0] * 60 + MEAL_WINDOWS[meal].start[1];
    if (now < start) return meal;
  }
  return 'dinner';
}

// isWeekend for shuttle schedule selection
function isWeekendDay(date) {
  const d = date.getDay();
  return d === 0 || d === 6; // Sun or Sat
}

let state = {
  menu: {
    day:  jsDay2MenuDay(today.getDay()),
    meal: getCurrentMeal(),   // auto-detect based on current time
  },
  shuttle: {
    schedule: isWeekendDay(today) ? 'weekend' : 'weekday',
    dir: 'stationToCampus',
  },
  calendar: {
    year:  todayY,
    month: todayM,
  },
};

let userSelectedMainTab = false;


// ─────────────────────────────────────────
// 3. FOOD MENU
// ─────────────────────────────────────────
function renderMenu() {
  const { day, meal } = state.menu;
  const dateStr  = dateStrForDayIndex(day);
  const dayMenu  = getMenuForDate(dateStr) || menuFallback[day] || menuFallback[0];
  const dishes   = dayMenu[meal] || [];
  const grid     = document.getElementById('menuGrid');
  const timing   = document.getElementById('mealTiming');

  timing.textContent = `⏰ ${MEAL_TIMINGS[meal]}`;

  // Show LIVE badge if this meal is currently happening
  const liveBadge = document.getElementById('liveMealBadge');
  if (liveBadge) {
    const w = MEAL_WINDOWS[meal];
    const now  = new Date().getHours() * 60 + new Date().getMinutes();
    const start = w.start[0] * 60 + w.start[1];
    const end   = w.end[0]   * 60 + w.end[1];
    const isLive = now >= start && now <= end;
    liveBadge.classList.toggle('hidden', !isLive);
  }

  // Show "no menu" notice if falling back
  const isFallback = !getMenuForDate(dateStr);

  grid.innerHTML = (isFallback
    ? `<div class="col-span-full text-center py-8 text-gray-400 dark:text-gray-600">
        <p class="text-3xl mb-2">📋</p>
        <p class="font-semibold">Menu not available for this date</p>
        <p class="text-xs mt-1">Check the notice board or ask the cafeteria staff</p>
       </div>`
    : dishes.map((d, i) => `
    <div class="menu-card bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 fade-up"
         style="animation-delay:${i * 50}ms">
      <span class="text-xl mb-1.5 block">${d.emoji}</span>
      <p class="font-bold text-xs mb-0.5 leading-snug">${d.name}</p>
      <p class="text-xs text-gray-500 dark:text-gray-400 mb-2 leading-snug">${d.desc}</p>
      <span class="diet-tag text-xs font-bold px-2 py-0.5 rounded-full ${dietClass(d.diet)}">${dietLabel(d.diet)}</span>
    </div>`).join('')
  );

  // Render comments for this day+meal
  renderComments(dateStr, meal);
}

function dietClass(diet) {
  return { veg: 'diet-veg', nonveg: 'diet-nonveg', vegan: 'diet-vegan' }[diet] || 'diet-veg';
}
function dietLabel(diet) {
  return { veg: '🟢 Veg', nonveg: '🔴 Non-Veg', vegan: '🌿 Vegan' }[diet] || diet;
}

function initMenu() {
  const todayMenuDay = jsDay2MenuDay(today.getDay());

  // Set active day button + today ring
  document.querySelectorAll('.day-btn').forEach(btn => {
    const d = parseInt(btn.dataset.day);
    btn.classList.toggle('active',     d === state.menu.day);
    btn.classList.toggle('today-ring', d === todayMenuDay);
    btn.addEventListener('click', () => {
      state.menu.day = d;
      document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMenu();
    });
  });

  // Set active meal tab from auto-detected current meal
  activateMealTab(state.menu.meal);
  document.querySelectorAll('.meal-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      state.menu.meal = tab.dataset.meal;
      activateMealTab(tab.dataset.meal);
      renderMenu();
    });
  });

  renderMenu();
}

function activateMealTab(meal) {
  document.querySelectorAll('.meal-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.meal === meal);
  });
}

// ─────────────────────────────────────────
// 4. FOOD COMMENTS
// ─────────────────────────────────────────

// Storage key per meal+date: "apu-comments-2026-10-24-lunch"
function commentKey(dateStr, meal) {
  return `apu-comments-${dateStr}-${meal}`;
}

function getComments(record, dateStr, meal) {
  if (!record || (!Array.isArray(record) && typeof record !== 'object')) {
    throw new Error('The food-comments bin does not contain a valid record.');
  }
  if (Array.isArray(record)) {
    return record.filter(comment => comment.date === dateStr && comment.meal === meal);
  }
  return Array.isArray(record[commentKey(dateStr, meal)])
    ? record[commentKey(dateStr, meal)]
    : [];
}

function updateCommentsInRecord(record, dateStr, meal, transform) {
  const key = commentKey(dateStr, meal);
  if (Array.isArray(record)) {
    const current = getComments(record, dateStr, meal);
    const result = transform(current);
    if (!result.changed) return false;
    const retained = record.filter(comment => comment.date !== dateStr || comment.meal !== meal);
    record.splice(0, record.length, ...retained, ...result.comments);
    return true;
  }

  const current = getComments(record, dateStr, meal);
  const result = transform(current);
  if (!result.changed) return false;
  if (result.comments.length) record[key] = result.comments;
  else delete record[key];
  return true;
}

async function loadComments(dateStr, meal) {
  let record = await readJsonBin(JSONBIN_IDS.foodComments, {});
  let comments = getComments(record, dateStr, meal);

  if (isCommentWindowExpired(meal, dateStr) && comments.length) {
    record = await updateJsonBin(JSONBIN_IDS.foodComments, {}, current =>
      updateCommentsInRecord(current, dateStr, meal, () => ({ changed: true, comments: [] }))
    );
    comments = getComments(record, dateStr, meal);
  }
  return comments;
}

// Is the comment window open right now for this meal?
function isCommentWindowOpen(meal, dateStr) {
  const w = MEAL_WINDOWS[meal];
  if (!w) return false;
  const start = new Date(`${dateStr}T${String(w.start[0]).padStart(2, '0')}:${String(w.start[1]).padStart(2, '0')}:00`);
  return Date.now() >= start.getTime(); // open from meal start; close after the expiry window
}

// Should comments be pruned? Yes if now > end + 2h
function isCommentWindowExpired(meal, dateStr) {
  const w = MEAL_WINDOWS[meal];
  if (!w) return false;
  const close = new Date(`${dateStr}T${String(w.end[0]).padStart(2, '0')}:${String(w.end[1]).padStart(2, '0')}:00`);
  close.setMinutes(close.getMinutes() + 120);
  return Date.now() > close.getTime();
}

// Human-readable window description
function windowDesc(meal) {
  const w = MEAL_WINDOWS[meal];
  const fmt = ([h, m]) => {
    const ap = h >= 12 ? 'PM' : 'AM';
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${h12}:${String(m).padStart(2,'0')} ${ap}`;
  };
  const closeH = w.end[0] + 2, closeM = w.end[1];
  const closeAdj = closeH > 23 ? [23, 59] : [closeH, closeM];
  return `Open ${fmt(w.start)} – ${fmt(closeAdj)} (deleted 2h after meal ends)`;
}

const RATING_LABELS = ['', '😣 Terrible', '😕 Not great', '😐 It\'s okay', '😊 Pretty good', '🤩 Excellent!'];

let selectedRating = 0;
let commentRenderSequence = 0;

async function renderComments(dateStr, meal) {
  const renderSequence = ++commentRenderSequence;
  const isOpen      = isCommentWindowOpen(meal, dateStr);
  const isExpired   = isCommentWindowExpired(meal, dateStr);

  const formEl      = document.getElementById('commentForm');
  const closedEl    = document.getElementById('commentClosed');
  const listEl      = document.getElementById('commentList');
  const emptyEl     = document.getElementById('commentEmpty');
  const windowLabel = document.getElementById('commentWindowLabel');
  const countEl     = document.getElementById('commentCount');

  setSyncStatus('commentSyncStatus', 'Loading comments…');
  let comments;
  try {
    comments = await loadComments(dateStr, meal);
  } catch (error) {
    if (renderSequence === commentRenderSequence) {
      setSyncStatus('commentSyncStatus', error.message, true);
    }
    return;
  }
  if (renderSequence !== commentRenderSequence) return;
  setSyncStatus('commentSyncStatus', '');

  // Window label
  windowLabel.textContent = windowDesc(meal);

  // LIVE badge on accordion header
  const liveHeaderBadge = document.getElementById('liveCommentBadge');
  if (liveHeaderBadge) {
    liveHeaderBadge.classList.toggle('hidden', !(isOpen && !isExpired));
  }

  // Show/hide form vs closed notice
  if (isOpen && !isExpired) {
    formEl.classList.remove('hidden');
    closedEl.classList.add('hidden');
  } else if (isExpired) {
    formEl.classList.add('hidden');
    closedEl.classList.remove('hidden');
    closedEl.textContent = '🔒 Comments closed (deleted — meal has ended)';
  } else {
    formEl.classList.add('hidden');
    closedEl.classList.remove('hidden');
    const w = MEAL_WINDOWS[meal];
    const h = w.start[0], m = w.start[1];
    const ap = h >= 12 ? 'PM' : 'AM';
    const h12 = h > 12 ? h - 12 : h;
    closedEl.textContent = `🔒 Comments open at ${h12}:${String(m).padStart(2,'0')} ${ap} when ${meal} starts`;
  }

  // Comment count badge
  countEl.textContent = comments.length > 0 ? `${comments.length} comment${comments.length > 1 ? 's' : ''}` : '';
  countEl.classList.toggle('hidden', comments.length === 0);

  // Render list
  if (comments.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.toggle('hidden', !isOpen || isExpired);
    return;
  }
  emptyEl.classList.add('hidden');

  listEl.innerHTML = comments.map(c => {
    const stars = c.rating ? '⭐'.repeat(c.rating) : '';
    const name  = c.name || 'Anonymous';
    const initials = name.charAt(0).toUpperCase();
    const ago   = timeAgoComment(c.postedAt);
    return `
      <div class="flex gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 px-4 py-3 fade-up">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500
                    flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">
          ${initials}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-semibold text-sm">${escHtml(name)}</span>
            ${stars ? `<span class="text-sm">${stars}</span>` : ''}
            <span class="text-xs text-gray-400 dark:text-gray-600 ml-auto">${ago}</span>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">${escHtml(c.text)}</p>
        </div>
      </div>
    `;
  }).join('');
}

function timeAgoComment(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function initComments() {
  // Star rating interaction
  const stars = document.querySelectorAll('.star-btn');
  const label = document.getElementById('ratingLabel');

  stars.forEach(btn => {
    btn.addEventListener('mouseenter', () => highlightStars(+btn.dataset.val));
    btn.addEventListener('mouseleave', () => highlightStars(selectedRating));
    btn.addEventListener('click', () => {
      selectedRating = +btn.dataset.val;
      highlightStars(selectedRating);
      label.textContent = RATING_LABELS[selectedRating];
      label.classList.remove('text-gray-400', 'dark:text-gray-500');
      label.classList.add('text-orange-500', 'font-semibold');
    });
  });

  function highlightStars(val) {
    stars.forEach(s => {
      s.textContent = +s.dataset.val <= val ? '⭐' : '☆';
    });
  }

  // Submit
  document.getElementById('commentSubmit').addEventListener('click', async () => {
    const text    = document.getElementById('commentText').value.trim();
    const name    = document.getElementById('commentName').value.trim();
    const errEl   = document.getElementById('commentError');
    const submitBtn = document.getElementById('commentSubmit');
    const dateStr = dateStrForDayIndex(state.menu.day);
    const meal    = state.menu.meal;

    if (!text) {
      errEl.textContent = 'Please write something before posting.';
      errEl.classList.remove('hidden');
      return;
    }
    errEl.classList.add('hidden');

    const comment = {
      id:       `${Date.now()}-${Math.random().toString(36).slice(2,6)}`,
      name:     name || 'Anonymous',
      text,
      rating:   selectedRating,
      postedAt: Date.now(),
      date:     dateStr,
      meal,
    };
    submitBtn.disabled = true;
    setSyncStatus('commentSyncStatus', 'Posting comment…');
    try {
      await updateJsonBin(JSONBIN_IDS.foodComments, {}, record =>
        updateCommentsInRecord(record, dateStr, meal, comments => ({
          changed: true,
          comments: [...comments, comment],
        }))
      );
    } catch (error) {
      errEl.textContent = error.message;
      errEl.classList.remove('hidden');
      setSyncStatus('commentSyncStatus', '');
      submitBtn.disabled = false;
      return;
    }
    submitBtn.disabled = false;
    setSyncStatus('commentSyncStatus', '');

    // Clear inputs
    document.getElementById('commentText').value = '';
    document.getElementById('commentName').value = '';
    selectedRating = 0;
    highlightStars(0);
    document.getElementById('ratingLabel').textContent = 'Tap to rate';
    document.getElementById('ratingLabel').classList.remove('text-orange-500', 'font-semibold');
    document.getElementById('ratingLabel').classList.add('text-gray-400', 'dark:text-gray-500');

    await renderComments(dateStr, meal);
  });

  // Allow Enter key to submit
  document.getElementById('commentText').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('commentSubmit').click();
  });

  // Auto-refresh every 60s (prune expired, update "X min ago")
  setInterval(() => {
    const dateStr = dateStrForDayIndex(state.menu.day);
    renderComments(dateStr, state.menu.meal);
  }, 60000);
}


// ─────────────────────────────────────────
// 5. SHUTTLE TIMINGS
// ─────────────────────────────────────────
function timeToMins(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function fmt12(t) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
}

function renderShuttle() {
  const { schedule } = state.shuttle;
  const s2c  = shuttleData[schedule].stationToCampus;
  const c2s  = shuttleData[schedule].campusToStation;
  const body = document.getElementById('shuttleBody');
  const hero = document.getElementById('shuttleHero');
  const now  = today.getHours() * 60 + today.getMinutes();

  // Next bus helpers for each direction
  function nextFor(times) {
    const idx = times.findIndex(t => timeToMins(t) > now);
    return { idx, time: idx !== -1 ? times[idx] : null };
  }

  const s2cNext = nextFor(s2c);
  const c2sNext = nextFor(c2s);

  function heroCard(label, emoji, color, bgClass, nextTime, times) {
    if (!nextTime) {
      return `
        <div class="flex-1 flex items-center gap-3 p-4 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-400 dark:text-gray-500">
          <span class="text-3xl">🌙</span>
          <div>
            <p class="text-xs font-bold uppercase tracking-wide opacity-70">${label}</p>
            <p class="font-bold text-gray-600 dark:text-gray-400">No more buses</p>
          </div>
        </div>`;
    }
    const minsAway = timeToMins(nextTime) - now;
    const hAway    = Math.floor(minsAway / 60);
    const mAway    = minsAway % 60;
    const awayStr  = hAway > 0 ? `${hAway}h ${mAway}m away` : `${mAway} min${mAway !== 1 ? 's' : ''} away`;
    const prevIdx  = times.findIndex(t => timeToMins(t) > now) - 1;
    const prevTime = prevIdx >= 0 ? times[prevIdx] : null;

    return `
      <div class="flex-1 ${bgClass} rounded-xl p-4 text-white">
        <p class="text-xs font-bold uppercase tracking-widest opacity-75 mb-1">${emoji} ${label}</p>
        <p class="text-4xl font-extrabold tracking-tight leading-none mb-1">${fmt12(nextTime)}</p>
        <p class="text-sm opacity-80">${awayStr}</p>
        ${prevTime ? `<p class="text-xs opacity-60 mt-2">Prev: ${fmt12(prevTime)}</p>` : ''}
      </div>`;
  }

  // ── Hero: two cards side by side ──
  hero.innerHTML = `
    <div class="mb-1">
      <p class="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">🚌 Next JANANI Bus</p>
      <div class="flex gap-3 flex-col sm:flex-row mb-6">
        ${heroCard('Station → Campus', '🏙️', 'blue', 'bg-blue-600 dark:bg-blue-700', s2cNext.time, s2c)}
        ${heroCard('Campus → Station', '🏫', 'indigo', 'bg-indigo-600 dark:bg-indigo-700', c2sNext.time, c2s)}
      </div>
    </div>
  `;

  // ── Full timetable: two columns ──
  const maxRows = Math.max(s2c.length, c2s.length);
  let rows = '';
  for (let i = 0; i < maxRows; i++) {
    const t1 = s2c[i];
    const t2 = c2s[i];

    function cellHtml(t, nextIdx) {
      if (!t) return `<td class="px-4 py-2.5 text-gray-300 dark:text-gray-700 border-r border-gray-100 dark:border-gray-800">—</td>`;
      const mins   = timeToMins(t);
      const isPast = mins < now;
      const isNext = i === nextIdx;
      const isSoon = !isPast && !isNext && nextIdx !== -1 && i === nextIdx + 1;

      let cls = isPast ? 'opacity-40' : isNext ? 'font-extrabold text-blue-600 dark:text-blue-400' : '';
      let badge = isPast  ? ''
                : isNext  ? `<span class="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">Next</span>`
                : isSoon  ? `<span class="ml-2 text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-300 px-2 py-0.5 rounded-full font-bold">Soon</span>`
                : '';

      return `<td class="px-4 py-2.5 font-mono border-r border-gray-100 dark:border-gray-800 ${cls}">${fmt12(t)}<span class="text-xs text-gray-400 dark:text-gray-600 ml-1">${t}</span>${badge}</td>`;
    }

    const rowHighlight = (i === s2cNext.idx || i === c2sNext.idx) ? 'bg-blue-50 dark:bg-blue-950/40' : '';
    rows += `<tr class="${rowHighlight} border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">${cellHtml(t1, s2cNext.idx)}${cellHtml(t2, c2sNext.idx)}</tr>`;
  }

  body.innerHTML = rows;
}

function initShuttle() {
  document.querySelectorAll('.schedule-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.schedule === state.shuttle.schedule);
    tab.addEventListener('click', () => {
      state.shuttle.schedule = tab.dataset.schedule;
      document.querySelectorAll('.schedule-tab').forEach(t =>
        t.classList.toggle('active', t.dataset.schedule === tab.dataset.schedule)
      );
      renderShuttle();
    });
  });

  renderShuttle();
}


// ─────────────────────────────────────────
// 5. HOLIDAY CALENDAR
// ─────────────────────────────────────────
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function renderCalendar() {
  const { year, month } = state.calendar;
  const grid  = document.getElementById('calGrid');
  const label = document.getElementById('calMonthLabel');

  label.textContent = `${MONTH_NAMES[month]} ${year}`;

  const firstDay   = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth= new Date(year, month + 1, 0).getDate();

  let html = '';

  // Empty cells before 1st
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cal-day empty"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr  = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isToday  = year === todayY && month === todayM && d === todayD;
    const hName    = holidayMap[dateStr];
    const dow      = new Date(year, month, d).getDay(); // 0=Sun, 6=Sat
    const isWeekend= dow === 0 || dow === 6;

    const classes  = [
      'cal-day',
      isToday   ? 'today'      : '',
      hName     ? 'is-holiday' : '',
      isWeekend ? 'weekend'    : '',
    ].filter(Boolean).join(' ');

    const dot     = hName ? `<span class="holiday-dot"></span>` : '';
    const tooltip = hName ? `<span class="holiday-tooltip">${hName}</span>` : '';

    html += `
      <div class="${classes}">
        <span class="day-num">${d}</span>
        ${dot}
        ${tooltip}
      </div>
    `;
  }

  grid.innerHTML = html;
}

function renderHolidayList() {
  const list    = document.getElementById('holidayList');
  const todayMs = new Date(todayY, todayM, todayD).getTime();

  const sorted = [...holidays2026].sort((a, b) => new Date(a.date) - new Date(b.date));

  list.innerHTML = sorted.map(h => {
    const hDate   = new Date(h.date);
    const hMs     = hDate.getTime();
    const isPast  = hMs < todayMs;
    const diffDays= Math.round((hMs - todayMs) / 86400000);

    const dayLabel = isPast
      ? `${Math.abs(diffDays)}d ago`
      : diffDays === 0
        ? '🎉 Today!'
        : diffDays <= 14
          ? `in ${diffDays}d`
          : `in ${diffDays}d`;

    const isSoon  = !isPast && diffDays <= 14;
    const daySpan = `<span class="text-sm font-semibold ml-auto ${isSoon ? 'text-orange-500' : 'text-gray-400 dark:text-gray-500'}">${dayLabel}</span>`;

    const dayName = hDate.toLocaleDateString('en-MY', { weekday: 'short' });
    const dayNum  = hDate.getDate();
    const mon     = hDate.toLocaleDateString('en-MY', { month: 'short' });

    return `
      <div class="holiday-item ${isPast ? 'past' : ''}">
        <div class="holiday-item-date">
          <div>${mon}</div>
          <div style="font-size:1.1rem">${dayNum}</div>
          <div style="font-size:.65rem;opacity:.8">${dayName}</div>
        </div>
        <span class="font-semibold text-sm">${h.name}</span>
        ${daySpan}
      </div>
    `;
  }).join('');
}

function initCalendar() {
  document.getElementById('calPrev').addEventListener('click', () => {
    state.calendar.month--;
    if (state.calendar.month < 0) { state.calendar.month = 11; state.calendar.year--; }
    renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    state.calendar.month++;
    if (state.calendar.month > 11) { state.calendar.month = 0; state.calendar.year++; }
    renderCalendar();
  });

  renderCalendar();
  renderHolidayList();
}


// ─────────────────────────────────────────
// 6. MAIN TAB SWITCHING
// ─────────────────────────────────────────
function initMainTabs() {
  const tabs   = document.querySelectorAll('.main-tab');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      userSelectedMainTab = true;
      switchMainTab(tab.dataset.tab);
    });
  });

  // Default: shuttle
  switchMainTab('shuttle');
}

function switchMainTab(tabId) {
  document.querySelectorAll('.main-tab').forEach(tab => {
    const isActive = tab.dataset.tab === tabId;
    tab.classList.toggle('tab-active', isActive);
    tab.classList.toggle('text-gray-400', !isActive);
    tab.classList.toggle('dark:text-gray-500', !isActive);
  });

  document.querySelectorAll('.tab-panel').forEach(panel => {
    const isActive = panel.id === `panel-${tabId}`;
    panel.classList.toggle('hidden', !isActive);
    if (isActive) panel.classList.add('fade-up');
  });
}


// ─────────────────────────────────────────
function initDarkMode() {
  const btn  = document.getElementById('darkToggle');
  const root = document.documentElement;

  // Respect system preference or saved preference
  const saved = localStorage.getItem('apu-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (saved === 'dark' || (!saved && prefersDark)) {
    root.classList.add('dark');
    btn.textContent = '☀️';
  }

  btn.addEventListener('click', () => {
    const isDark = root.classList.toggle('dark');
    btn.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('apu-theme', isDark ? 'dark' : 'light');
  });
}


// ─────────────────────────────────────────
// 7. MOBILE MENU
// ─────────────────────────────────────────
function initMobileMenu() {
  const btn  = document.getElementById('hamburger');
  const menu = document.getElementById('mobileMenu');

  btn.addEventListener('click', () => {
    menu.classList.toggle('hidden');
  });

  // Close when a link is clicked
  document.querySelectorAll('.mob-link').forEach(link => {
    link.addEventListener('click', () => menu.classList.add('hidden'));
  });
}


// ─────────────────────────────────────────
// 8. SCROLL SPY (active nav link)
// ─────────────────────────────────────────
function initScrollSpy() {
  const sections = ['menu', 'shuttle', 'calendar'];
  const navLinks = document.querySelectorAll('.nav-link');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.classList.toggle('active', link.dataset.section === id);
        });
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });

  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
}


// ─────────────────────────────────────────
// 9. FOOTER YEAR
// ─────────────────────────────────────────
function setFooterYear() {
  const el = document.getElementById('footerYear');
  if (el) el.textContent = new Date().getFullYear();
}


// ─────────────────────────────────────────
// 9. CAB SHARE
// ─────────────────────────────────────────
let cabPostsCache = [];

function validateCabPosts(record) {
  if (!Array.isArray(record)) {
    throw new Error('The cab-share bin does not contain a valid list.');
  }
  return record;
}

async function loadCabPosts() {
  let posts = validateCabPosts(await readJsonBin(JSONBIN_IDS.cabShare, []));
  if (posts.some(isPostExpired)) {
    posts = validateCabPosts(await updateJsonBin(JSONBIN_IDS.cabShare, [], record => {
      validateCabPosts(record);
      const activePosts = record.filter(post => !isPostExpired(post));
      if (activePosts.length === record.length) return false;
      record.splice(0, record.length, ...activePosts);
      return true;
    }));
  }
  return posts;
}

function fmt12FromTime(timeStr) {
  // timeStr = "HH:MM"
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12  = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${String(m).padStart(2,'0')} ${ampm}`;
}

function fmtDate(dateStr) {
  // dateStr = "YYYY-MM-DD"
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function isPostExpired(post) {
  // Post expires exactly at the departure datetime
  if (!post.date || !post.time) return false;
  const dept = new Date(`${post.date}T${post.time}:00`);
  return Date.now() > dept.getTime();
}

function renderCabPosts(filterText = '', savedPosts = cabPostsCache) {
  const container = document.getElementById('cab-posts');
  const empty     = document.getElementById('cab-empty');
  let posts       = savedPosts.filter(p => !isPostExpired(p));

  // Apply filter
  const q = filterText.trim().toLowerCase();
  if (q) posts = posts.filter(p => p.dest.toLowerCase().includes(q));

  // Sort: soonest departure first
  posts.sort((a, b) => {
    const da = new Date(`${a.date}T${a.time}:00`);
    const db = new Date(`${b.date}T${b.time}:00`);
    return da - db;
  });

  if (posts.length === 0) {
    container.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');

  container.innerHTML = posts.map(p => {
    const isPast   = new Date(`${p.date}T${p.time}:00`) < new Date();
    const expiresStr = timeUntilDept(p);
    const wa = p.contact.replace(/\D/g, '');
    const waLink = wa.length >= 10
      ? `https://wa.me/${wa.startsWith('91') ? wa : '91' + wa}?text=${encodeURIComponent(`Hi! I saw your cab share post on APU Student Hub. Going to ${p.dest} — can I join?`)}`
      : null;

    return `
      <div class="cab-card bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4
                  ${isPast ? 'opacity-50' : ''} fade-up relative group">

        <div class="flex items-start gap-3">
          <!-- Avatar -->
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-teal-500
                      flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            ${p.name.charAt(0).toUpperCase()}
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span class="font-bold text-sm">${escHtml(p.name)}</span>
              <span class="text-xs text-gray-400 dark:text-gray-500">·</span>
              <span class="text-xs text-gray-400 dark:text-gray-500">${timeAgo(p.postedAt)}</span>
              ${expiresStr
                ? `<span class="text-xs bg-orange-50 dark:bg-orange-950 text-orange-500 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium">⏳ ${expiresStr}</span>`
                : ''}
            </div>

            <!-- Destination big -->
            <p class="text-base font-extrabold text-gray-900 dark:text-white mb-2">
              📍 ${escHtml(p.dest)}
            </p>

            <!-- Meta chips -->
            <div class="flex flex-wrap gap-2 mb-3">
              <span class="inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full font-semibold">
                📅 ${fmtDate(p.date)}
              </span>
              <span class="inline-flex items-center gap-1 text-xs bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 px-2.5 py-1 rounded-full font-semibold">
                ⏰ ${fmt12FromTime(p.time)}
              </span>
              <span class="inline-flex items-center gap-1 text-xs bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 px-2.5 py-1 rounded-full font-semibold">
                🪑 ${p.seats} seat${p.seats > 1 ? 's' : ''} needed
              </span>
            </div>

            ${p.note ? `<p class="text-xs text-gray-500 dark:text-gray-400 mb-3 italic">"${escHtml(p.note)}"</p>` : ''}

            <!-- Contact -->
            <div class="flex items-center gap-2 flex-wrap">
              ${waLink
                ? `<a href="${waLink}" target="_blank" rel="noopener"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-400 text-white text-xs font-bold rounded-lg transition-all">
                     <span>💬</span> WhatsApp
                   </a>`
                : ''}
              <a href="tel:${escHtml(p.contact)}"
                 class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-lg transition-all">
                📞 ${escHtml(p.contact)}
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

}

async function refreshCabPosts() {
  setSyncStatus('cab-sync-status', 'Loading cab requests…');
  try {
    cabPostsCache = await loadCabPosts();
    setSyncStatus('cab-sync-status', '');
    renderCabPosts(document.getElementById('cab-filter').value);
    if (cabPostsCache.some(post => !isPostExpired(post)) && !userSelectedMainTab) {
      switchMainTab('cabshare');
    }
  } catch (error) {
    setSyncStatus('cab-sync-status', error.message, true);
  }
}

function timeUntilDept(post) {
  const dept    = new Date(`${post.date}T${post.time}:00`);
  const diffMs  = dept.getTime() - Date.now();
  if (diffMs <= 0) return null; // already past

  const diffMin = Math.floor(diffMs / 60000);
  const h       = Math.floor(diffMin / 60);
  const m       = diffMin % 60;

  if (h > 0)  return `expires in ${h}h ${m}m`;
  if (m > 1)  return `expires in ${m} mins`;
  return `expires in less than a minute`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)  return 'just now';
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

function initCabShare() {
  const panel = document.getElementById('panel-cabshare');
  const postForm = document.getElementById('cab-request-form');
  const filterBar = document.getElementById('cab-filter').parentElement;
  const postsList = document.getElementById('cab-posts');
  const syncStatus = document.getElementById('cab-sync-status');
  const emptyNotice = document.getElementById('cab-empty');
  [filterBar, postsList, syncStatus, emptyNotice].forEach(element => {
    panel.insertBefore(element, postForm);
  });

  // Set today as default date
  const dateInput = document.getElementById('cab-date');
  dateInput.value = new Date().toISOString().split('T')[0];
  dateInput.min   = new Date().toISOString().split('T')[0];

  // Post button
  document.getElementById('cab-post-btn').addEventListener('click', async () => {
    const postButton = document.getElementById('cab-post-btn');
    const name    = document.getElementById('cab-name').value.trim();
    const dest    = document.getElementById('cab-dest').value.trim();
    const date    = document.getElementById('cab-date').value;
    const time    = document.getElementById('cab-time').value;
    const seats   = document.getElementById('cab-seats').value;
    const contact = document.getElementById('cab-contact').value.trim();
    const note    = document.getElementById('cab-note').value.trim();
    const errEl   = document.getElementById('cab-error');

    // Validation
    if (!name)    { showCabError(errEl, 'Please enter your name.'); return; }
    if (!dest)    { showCabError(errEl, 'Please enter a destination.'); return; }
    if (!date)    { showCabError(errEl, 'Please pick a date.'); return; }
    if (!time)    { showCabError(errEl, 'Please pick a departure time.'); return; }
    if (!contact) { showCabError(errEl, 'Please enter your WhatsApp or phone number.'); return; }
    errEl.classList.add('hidden');

    const post = {
      id:       `${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      name, dest, date, time,
      seats:    parseInt(seats),
      contact, note,
      postedAt: Date.now(),
    };

    postButton.disabled = true;
    setSyncStatus('cab-sync-status', 'Posting cab request…');
    try {
      cabPostsCache = validateCabPosts(await updateJsonBin(JSONBIN_IDS.cabShare, [], record => {
        validateCabPosts(record);
        record.unshift(post);
        return true;
      }));
    } catch (error) {
      showCabError(errEl, error.message);
      setSyncStatus('cab-sync-status', '');
      postButton.disabled = false;
      return;
    }
    postButton.disabled = false;
    setSyncStatus('cab-sync-status', '');

    // Clear form
    document.getElementById('cab-name').value    = '';
    document.getElementById('cab-dest').value    = '';
    document.getElementById('cab-time').value    = '';
    document.getElementById('cab-seats').value   = '1';
    document.getElementById('cab-contact').value = '';
    document.getElementById('cab-note').value    = '';
    document.getElementById('cab-date').value    = new Date().toISOString().split('T')[0];

    renderCabPosts();

    // Scroll to posts
    document.getElementById('cab-posts').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  // Filter
  document.getElementById('cab-filter').addEventListener('input', e => {
    renderCabPosts(e.target.value);
  });

  refreshCabPosts();

  // Refresh posts every 60s so updates from other users appear and expired posts are removed.
  setInterval(refreshCabPosts, 60000);
}

function showCabError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}


// ─────────────────────────────────────────
// 10. BUY ME A COFFEE
// ─────────────────────────────────────────
function initCoffee() {
  const btn    = document.getElementById('coffeeBtn');
  const modal  = document.getElementById('coffeeModal');
  const close  = document.getElementById('coffeeClose');
  const copyBtn= document.getElementById('copyUpi');
  const upiTxt = document.getElementById('upiIdText');

  function openModal()  {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  }

  btn.addEventListener('click', openModal);
  close.addEventListener('click', closeModal);

  // Close on backdrop click
  modal.addEventListener('click', e => {
    if (e.target === modal) closeModal();
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // Copy UPI ID
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(upiTxt.textContent.trim()).then(() => {
      const orig = copyBtn.textContent;
      copyBtn.textContent = '✅ Copied!';
      copyBtn.classList.add('text-green-600');
      setTimeout(() => {
        copyBtn.textContent = orig;
        copyBtn.classList.remove('text-green-600');
      }, 2000);
    }).catch(() => {
      // Fallback for older browsers
      const range = document.createRange();
      range.selectNode(upiTxt);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      document.execCommand('copy');
      window.getSelection().removeAllRanges();
      copyBtn.textContent = '✅ Copied!';
      setTimeout(() => { copyBtn.textContent = '📋 Copy'; }, 2000);
    });
  });
}


// ─────────────────────────────────────────
// 11. FEEDBACK (Bug Report / Feature Request)
// ─────────────────────────────────────────
function initFeedback() {
  const FEEDBACK_EMAIL = 'anuragi.rajesh24_ug@apu.edu.in';

  const btn     = document.getElementById('feedbackBtn');
  const modal   = document.getElementById('feedbackModal');
  const closeBtn= document.getElementById('feedbackClose');
  const sendBtn = document.getElementById('feedbackSend');
  const subject = document.getElementById('feedbackSubject');
  const message = document.getElementById('feedbackMessage');
  const errEl   = document.getElementById('feedbackError');
  const typeBtns= document.querySelectorAll('.feedback-type-btn');

  let selectedType = 'bug';

  // Pre-select Bug Report by default
  setFeedbackType('bug');

  function setFeedbackType(type) {
    selectedType = type;
    typeBtns.forEach(b => {
      const isActive = b.dataset.type === type;
      b.classList.toggle('border-red-400',    isActive && type === 'bug');
      b.classList.toggle('text-red-500',      isActive && type === 'bug');
      b.classList.toggle('border-violet-400', isActive && type === 'feature');
      b.classList.toggle('text-violet-500',   isActive && type === 'feature');
      b.classList.toggle('border-gray-200',   !isActive);
      b.classList.toggle('dark:border-gray-700', !isActive);
      b.classList.toggle('text-gray-500',     !isActive);
    });
    subject.value = type === 'bug'
      ? '[Bug Report] APU Student Hub — '
      : '[Feature Request] APU Student Hub — ';
    subject.focus();
    subject.setSelectionRange(subject.value.length, subject.value.length);
  }

  typeBtns.forEach(b => b.addEventListener('click', () => setFeedbackType(b.dataset.type)));

  function openModal() {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
    errEl.classList.add('hidden');
  }

  btn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  sendBtn.addEventListener('click', () => {
    const sub = subject.value.trim();
    const msg = message.value.trim();

    if (!sub || sub === '[Bug Report] APU Student Hub —' || sub === '[Feature Request] APU Student Hub —') {
      errEl.textContent = 'Please complete the subject line.';
      errEl.classList.remove('hidden');
      return;
    }
    if (!msg) {
      errEl.textContent = 'Please write a message.';
      errEl.classList.remove('hidden');
      return;
    }
    errEl.classList.add('hidden');

    const mailtoUrl = `mailto:${FEEDBACK_EMAIL}`
      + `?subject=${encodeURIComponent(sub)}`
      + `&body=${encodeURIComponent(msg + '\n\n— Sent from APU Student Hub')}`;

    window.location.href = mailtoUrl;
    closeModal();
  });
}


// ─────────────────────────────────────────
// 12. BOOT
// ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initDarkMode();
  initMainTabs();
  initMenu();
  initComments();
  initShuttle();
  initCalendar();
  initCabShare();
  setFooterYear();
  initCoffee();
  initFeedback();
});
