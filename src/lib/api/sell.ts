import apiClient from './client'

export interface SellAnswers {
  address: string
  sellingPriority?: string
  biggestHurdle?: string
  advisoryPreference?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}

export interface MarketPulseItem {
  title: string
  body: string
}

export interface Comparable {
  address: string
  soldPrice: string
  soldDate: string
  beds: number
  baths: number
  sqft: number
  distance: string
  comparability: string
}

export interface SellValuation {
  address: string
  tagline: string
  estimatedValueLow: number
  estimatedValueHigh: number
  confidenceScore: number
  pricePerSqFt: string
  estimatedYield: string
  daysOnMarket: string
  strategyNote: string
  marketPulse: MarketPulseItem[]
  comparables: Comparable[]
}

// POST /sell/valuation — captures the lead and returns a Gemini-generated valuation.
export async function createSellValuation(answers: SellAnswers): Promise<SellValuation> {
  const res = await apiClient.post('/sell/valuation', answers)
  return res.data as SellValuation
}

export interface SellPreviewAnswers {
  address: string
  sellingPriority?: string
  biggestHurdle?: string
  advisoryPreference?: string
}

export interface SellPreviewRange {
  low: number
  high: number
  currency: string
}

// POST /sell/preview — returns a real, model-derived estimate range for the
// address without capturing a lead. Powers the teaser above the lead form.
export async function getSellPreview(answers: SellPreviewAnswers): Promise<SellPreviewRange> {
  const res = await apiClient.post('/sell/preview', answers)
  return res.data as SellPreviewRange
}
