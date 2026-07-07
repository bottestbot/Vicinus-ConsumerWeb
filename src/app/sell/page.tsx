'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import SellIntro from '@/components/sell/SellIntro'
import SellWizard from '@/components/sell/SellWizard'
import SellValuationView from '@/components/sell/SellValuation'
import { createSellValuation, type SellAnswers, type SellValuation } from '@/lib/api/sell'

type Stage = 'intro' | 'wizard' | 'loading' | 'valuation'

export default function SellPage() {
  const [stage, setStage] = useState<Stage>('intro')
  const [address, setAddress] = useState('')
  const [valuation, setValuation] = useState<SellValuation | null>(null)
  const [error, setError] = useState<string | null>(null)

  function startWizard(addr: string) {
    setAddress(addr)
    setStage('wizard')
  }

  async function complete(answers: Omit<SellAnswers, 'address'>) {
    setStage('loading')
    setError(null)
    try {
      const result = await createSellValuation({ address, ...answers })
      setValuation(result)
      setStage('valuation')
    } catch {
      setError('We couldn’t generate your valuation just now. Please try again.')
      setStage('wizard')
    }
  }

  return (
    <>
      <Navbar overHero />

      {stage === 'intro' && <SellIntro onExplore={startWizard} />}

      {stage === 'wizard' && (
        <>
          {error && (
            <div className="pt-24 px-6 max-w-3xl mx-auto">
              <p className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</p>
            </div>
          )}
          <SellWizard address={address} onComplete={complete} onBack={() => setStage('intro')} />
        </>
      )}

      {stage === 'loading' && (
        <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center px-6 text-center">
          <Loader2 size={36} className="text-[#1C3829] animate-spin mb-6" />
          <h2 className="font-heading text-2xl font-bold text-[#1C3829] mb-2">Analyzing {address}</h2>
          <p className="text-[#6B6B6B] text-sm max-w-sm">
            Our intelligence engine is generating your editorial-grade valuation. This takes a few seconds.
          </p>
        </div>
      )}

      {stage === 'valuation' && valuation && <SellValuationView data={valuation} />}

      <Footer />
    </>
  )
}
