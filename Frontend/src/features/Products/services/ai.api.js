import api from '../../../services/api.js';

/**
 * Generate a product title using the selected AI model.
 * @param {Object} opts - { model, category, hint }
 */
export async function aiGenerateTitle({ model = 'gemini', category = 'fashion', hint = '' } = {}) {
  const res = await api.post('/ai/generate-title', { model, category, hint });
  return res.data;
}

/**
 * Generate a product description using the selected AI model.
 * @param {Object} opts - { model, title, category }
 */
export async function aiGenerateDescription({ model = 'gemini', title = '', category = 'fashion' } = {}) {
  const res = await api.post('/ai/generate-description', { model, title, category });
  return res.data;
}

/**
 * Predict a price range using the selected AI model + RAG market knowledge.
 * @param {Object} opts - { model, title, description, currency }
 */
export async function aiPredictPrice({ model = 'gemini', title = '', description = '', currency = 'INR' } = {}) {
  const res = await api.post('/ai/predict-price', { model, title, description, currency });
  return res.data;
}

/**
 * Detect the dominant clothing color in a product image using Mistral Pixtral vision.
 * @param {string} imageUrl - Public URL of the product image
 * @returns {{ color: string }}
 */
export async function aiDetectColor(imageUrl) {
  const res = await api.post('/ai/detect-color', { imageUrl });
  return res.data;
}

/**
 * Predict category, brand, and tags using Cohere.
 * @param {Object} opts - { title, description }
 */
export async function aiPredictMetadata({ title = '', description = '' } = {}) {
  const res = await api.post('/ai/predict-metadata', { title, description });
  return res.data;
}
