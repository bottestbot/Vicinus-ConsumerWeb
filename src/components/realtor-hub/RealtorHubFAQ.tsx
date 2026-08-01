'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

const FAQS = [
  {
    q: 'What is the cost for the REALTOR® Hub?',
    a: 'Founding members get the REALTOR® Hub free through launch and their first onboarding period. We’ll introduce paid plans with additional tools later — every founding member is grandfathered into preferred pricing.',
  },
  {
    q: 'How do I verify my neighbourhood expert status?',
    a: 'Once you claim a spot, we verify your license and recent local sales against public brokerage records. Verification typically takes less than one business day.',
  },
  {
    q: 'How can I learn more about your paid offerings?',
    a: 'Book a 15-minute discovery call with our founder, Tom, using the form below. He’ll walk you through the roadmap and what founding-member pricing looks like.',
  },
]

export default function RealtorHubFAQ() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="bg-[#FAF9F6] px-6 py-20 lg:py-24">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center font-heading text-3xl font-bold text-[#111111] sm:text-4xl">
          Frequently Asked
        </h2>

        <div className="mt-10 divide-y divide-[#E8E6E1] border-t border-b border-[#E8E6E1]">
          {FAQS.map((item, i) => {
            const isOpen = open === i
            return (
              <div key={item.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="font-heading text-base font-semibold text-[#111111]">
                    {item.q}
                  </span>
                  <Plus
                    size={18}
                    className={`shrink-0 text-[#6B6B6B] transition-transform ${isOpen ? 'rotate-45' : ''}`}
                  />
                </button>
                {isOpen && (
                  <p className="pb-5 text-sm leading-relaxed text-[#6B6B6B]">{item.a}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
