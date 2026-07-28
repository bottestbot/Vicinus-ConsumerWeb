import { create } from 'zustand'

// Lets ActionBar (a sibling, not an ancestor/descendant of PropertyGallery)
// know the fullscreen photo lightbox is open so it can skip rendering itself
// entirely — avoids relying on z-index/CSS-class layering to keep the fixed
// bottom bar from showing through the fixed lightbox overlay.
interface LightboxStore {
  isOpen: boolean
  setOpen: (open: boolean) => void
}

export const useLightboxStore = create<LightboxStore>((set) => ({
  isOpen: false,
  setOpen: (open) => set({ isOpen: open }),
}))
