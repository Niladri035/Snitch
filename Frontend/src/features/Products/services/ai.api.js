const BASE = '/api/ai'

/**
 * Generate a product title using the selected AI model.
 * @param {Object} opts - { model, category, hint }
 */
export async function aiGenerateTitle({ model = 'gemini', category = 'fashion', hint = '' } = {}) {
  const res = await fetch(`${BASE}/generate-title`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ model, category, hint }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'AI title generation failed')
  }
  return res.json() // { title }
}

/**
 * Generate a product description using the selected AI model.
 * @param {Object} opts - { model, title, category }
 */
export async function aiGenerateDescription({ model = 'gemini', title = '', category = 'fashion' } = {}) {
  const res = await fetch(`${BASE}/generate-description`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ model, title, category }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'AI description generation failed')
  }
  return res.json() // { description }
}

/**
 * Predict a price range using the selected AI model + RAG market knowledge.
 * @param {Object} opts - { model, title, description, currency }
 */
export async function aiPredictPrice({ model = 'gemini', title = '', description = '', currency = 'INR' } = {}) {
  const res = await fetch(`${BASE}/predict-price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ model, title, description, currency }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'AI price prediction failed')
  }
  return res.json() // { min, max, suggested, confidence }
}

/**
 * Detect the dominant clothing color in a product image using Mistral Pixtral vision.
 * @param {string} imageUrl - Public URL of the product image
 * @returns {{ color: string }}
 */
export async function aiDetectColor(imageUrl) {
  const res = await fetch(`${BASE}/detect-color`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ imageUrl }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'AI color detection failed')
  }
  return res.json() // { color }
}

/**
 * Predict category, brand, and tags using Cohere.
 * @param {Object} opts - { title, description }
 */
export async function aiPredictMetadata({ title = '', description = '' } = {}) {
  const res = await fetch(`${BASE}/predict-metadata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ title, description }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || 'AI metadata prediction failed')
  }
  return res.json() // { category, brand, tags }
}

