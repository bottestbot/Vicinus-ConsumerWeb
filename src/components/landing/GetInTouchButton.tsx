'use client'

import { useState } from 'react'
import ContactVicinusModal from './ContactVicinusModal'

export default function GetInTouchButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#A3E635] text-[#111111] text-sm font-bold rounded-xl hover:bg-[#95D62F] transition-colors"
      >
        Get in Touch
      </button>
      {open && <ContactVicinusModal onClose={() => setOpen(false)} />}
    </>
  )
}
