import express from 'express'
import { generateTitle, generateDescription, predictPrice, detectImageColor, predictMetadata } from '../controllers/ai.controller.js'

const aiRouter = express.Router()

aiRouter.post('/generate-title',       generateTitle)
aiRouter.post('/generate-description', generateDescription)
aiRouter.post('/predict-price',        predictPrice)
aiRouter.post('/detect-color',         detectImageColor)
aiRouter.post('/predict-metadata',     predictMetadata)

export default aiRouter
