import { config } from '../config/config.js'

/* ─────────────────────────────────────────────────────────────
   AI helpers — call Gemini / Mistral / Cohere based on model
───────────────────────────────────────────────────────────── */

async function callGemini(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  )
  if (!res.ok) throw new Error(`Gemini error: ${res.statusText}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function callMistral(prompt) {
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
    }),
  })
  if (!res.ok) throw new Error(`Mistral error: ${res.statusText}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

/* callMistralVision — pixtral can see images */
async function callMistralVision(imageUrl, prompt) {
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.MISTRAL_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'pixtral-12b-2409',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: imageUrl },
          { type: 'text',      text: prompt }
        ]
      }],
      max_tokens: 100,
    }),
  })
  if (!res.ok) throw new Error(`Mistral Vision error: ${res.statusText}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

async function callCohere(prompt) {
  const res = await fetch('https://api.cohere.com/v2/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.COHERE_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'command-r-plus-08-2024',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
    }),
  })
  if (!res.ok) throw new Error(`Cohere error: ${res.statusText}`)
  const data = await res.json()
  return data.message?.content?.[0]?.text || ''
}

/* ── Local Heuristic Fallbacks (when APIs are rate-limited or unavailable) ── */
const MOCK_TITLES = {
  Men: [
    "Snitch Street Oversized Cargo Fit Tee",
    "Snitch Core Boxy Graphic Sweatshirt",
    "Urban Camo Cropped Utility Shirt",
    "Snitch Retro Acid Wash Drop Shoulder Tee",
    "Cyberpunk Techwear Utility Jacket"
  ],
  Women: [
    "Snitch Cropped Velvet Corset Top",
    "Retro High-Waist Denim Utility Pant",
    "Vintage Acid Wash Graphic Tee",
    "Snitch Modern Minimalist Knit Cardigan",
    "Chic Streetwear Leather Bomber"
  ],
  Accessories: [
    "Snitch Signature Distressed Street Cap",
    "Retro Future Tinted Sunglasses",
    "Snitch Utility Canvas Crossbody Bag"
  ],
  Unisex: [
    "Snitch Relaxed Premium Drawstring Hoodie",
    "Classic Acid Wash Knit Beanie",
    "Retro Cyberpunk Oversized Windbreaker"
  ]
};

const MOCK_DESCRIPTIONS = [
  "Cop the ultimate fit for your streetwear rotations. Made from premium ultra-weight breathable fabric with boxy modern shoulders. Fr fr a certified slay.",
  "Understood the assignment. A super-soft, premium casual drop built different for all-day comfort. Level up your street style aesthetic.",
  "Lowkey obsessed with this silhouette. Boxy shoulders, relaxed waistline, and signature comfort branding. No cap, this slaps hard."
];

function fallbackTitle(category = 'Men', hint = '') {
  if (hint && hint.length > 3) {
    const cleanHint = hint.trim().replace(/^["']|["']$/g, '').slice(0, 30);
    return `Snitch ${cleanHint.charAt(0).toUpperCase() + cleanHint.slice(1)} Drop`;
  }
  const pool = MOCK_TITLES[category] || MOCK_TITLES.Unisex || MOCK_TITLES.Men;
  return pool[Math.floor(Math.random() * pool.length)];
}

function fallbackDescription(title = '') {
  const base = MOCK_DESCRIPTIONS[Math.floor(Math.random() * MOCK_DESCRIPTIONS.length)];
  if (title) {
    return `This "${title}" is built different. ${base}`;
  }
  return base;
}

function fallbackPrice() {
  return {
    min: 799,
    max: 1499,
    suggested: 999,
    confidence: "local benchmark"
  };
}

async function runAI(model, prompt) {
  // Ordered sequence of fallback models
  const order = [model];
  const others = ['gemini', 'mistral', 'cohere'].filter(m => m !== model);
  order.push(...others);

  let lastError = null;
  for (const m of order) {
    if (config[`${m.toUpperCase()}_API_KEY`]) {
      try {
        if (m === 'gemini')  return await callGemini(prompt);
        if (m === 'mistral') return await callMistral(prompt);
        if (m === 'cohere')  return await callCohere(prompt);
      } catch (err) {
        console.warn(`[AI System] Fallback trigger: ${m} failed with: ${err.message}`);
        lastError = err;
      }
    }
  }
  throw lastError || new Error("No configured or working AI API keys available");
}

/* ─────────────────────────────────────────────────────────────
   POST /api/ai/generate-title
   body: { model, category?, hint? }
───────────────────────────────────────────────────────────── */
export async function generateTitle(req, res) {
  const { model = 'gemini', category = 'Men', hint = '' } = req.body;
  try {
    const prompt = `You are a trendy fashion e-commerce copywriter for a Gen-Z brand called Snitch.
Generate a SINGLE creative product title (4–8 words, no quotes) for a ${category} item.
${hint ? `Hint: ${hint}` : ''}
Rules: punchy, street-culture vibes, no hashtags, no explanations, just the title.`;

    const title = (await runAI(model, prompt)).trim().replace(/^["']|["']$/g, '');
    return res.json({ title });
  } catch (err) {
    console.warn(`[AI controller] Title generation fallback engaged: ${err.message}`);
    // Safe heuristic fallback
    return res.json({ title: fallbackTitle(category, hint) });
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/ai/generate-description
   body: { model, title, category? }
───────────────────────────────────────────────────────────── */
export async function generateDescription(req, res) {
  const { model = 'gemini', title = '', category = 'Men' } = req.body;
  try {
    const prompt = `You are a Gen-Z fashion copywriter for Snitch, an edgy streetwear e-commerce brand.
Write a product description (2–3 sentences, max 60 words) for: "${title}" — category: ${category}.
Rules: energetic, confident, no hashtags, no emojis, no bullet points, no quotes around the output. Plain text only.`;

    const description = (await runAI(model, prompt)).trim();
    return res.json({ description });
  } catch (err) {
    console.warn(`[AI controller] Description generation fallback engaged: ${err.message}`);
    return res.json({ description: fallbackDescription(title) });
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/ai/predict-price
   body: { model, title, description, currency? }
───────────────────────────────────────────────────────────── */
export async function predictPrice(req, res) {
  const { model = 'gemini', title = '', description = '', currency = 'INR' } = req.body;
  try {
    const prompt = `You are a fashion market analyst with deep knowledge of Indian streetwear e-commerce pricing (platforms: Myntra, AJIO, Snitch, Bewakoof, The Souled Store).

Product: "${title}"
Description: "${description}"
Currency: ${currency}

Based on market benchmarks, suggest a competitive retail price.
Respond ONLY with a JSON object like: {"min": 799, "max": 1299, "suggested": 999, "confidence": "high"}
No explanation, no markdown, pure JSON.`;

    const raw = (await runAI(model, prompt)).trim();
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error('AI did not return valid JSON');
    const prediction = JSON.parse(jsonMatch[0]);
    return res.json(prediction);
  } catch (err) {
    console.warn(`[AI controller] Price prediction fallback engaged: ${err.message}`);
    return res.json(fallbackPrice());
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/ai/detect-color
   body: { imageUrl }   — uses Mistral Pixtral vision model
   Returns: { color }   — a short color name like "Navy Blue"
───────────────────────────────────────────────────────────── */
export async function detectImageColor(req, res) {
  try {
    const { imageUrl } = req.body
    if (!imageUrl) return res.status(400).json({ message: 'imageUrl is required' })
    if (!config.MISTRAL_API_KEY) {
      return res.status(400).json({ message: 'Mistral API key not configured in .env' })
    }

    const prompt = `Look at this clothing/costume product image.
Identify the PRIMARY color of the clothing item.
Respond ONLY with a short color name (1-3 words, Title Case), like "Navy Blue", "Crimson Red", "Olive Green", "Charcoal Grey", "Off White", "Forest Green", etc.
Do NOT include any explanation, punctuation, or extra words. Just the color name.`

    const raw = await callMistralVision(imageUrl, prompt)
    const color = raw.trim().replace(/^["'.]+|["'.]+$/g, '').trim()
    res.json({ color })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/ai/predict-metadata
   body: { title, description } — uses Cohere to suggest Category, Brand, and Tags
───────────────────────────────────────────────────────────── */
export async function predictMetadata(req, res) {
  try {
    const { title = '', description = '' } = req.body;
    const prompt = `You are a fashion catalog expert. Based on the product title: "${title}" and description: "${description}", predict:
1. Category: Must be exactly one of: Men, Women, Unisex, Kids, Accessories, Footwear, Bottoms, Outerwear
2. Brand: Suggest a brand name (default to "Snitch" if unsure)
3. Tags: An array of 3-5 relevant lowercase search tags (e.g. ["oversized", "cotton", "streetwear"])

Respond ONLY with a JSON object like:
{"category": "Men", "brand": "Snitch", "tags": ["oversized", "streetwear"]}
Do not include any explanation, markdown formatting, or extra text. Pure JSON only.`;

    const raw = (await runAI('cohere', prompt)).trim();
    const jsonMatch = raw.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error('AI did not return valid JSON');
    const metadata = JSON.parse(jsonMatch[0]);
    res.json(metadata);
  } catch (err) {
    console.warn(`[AI controller] Metadata prediction fallback engaged: ${err.message}`);
    // Safe mock fallback
    res.json({
      category: "Unisex",
      brand: "Snitch",
      tags: ["streetwear", "new-drop"]
    });
  }
}

