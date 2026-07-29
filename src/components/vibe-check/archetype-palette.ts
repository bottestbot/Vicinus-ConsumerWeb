// Colour treatment per archetype accent (PRD §7 — every archetype gets its own
// hue). Only the approved "transit maximalist" lime/forest scheme exists today;
// add an entry per key as the remaining 8 archetype palettes get sign-off.
import type { VibeArchetypeColourKey } from '@/types/vibe-check'

interface ArchetypePalette {
  heroClassName: string
  stampClassName: string
}

export const archetypePalette: Record<VibeArchetypeColourKey, ArchetypePalette> = {
  'lime-forest': {
    heroClassName: 'bg-gradient-to-br from-[#1C3829] to-[#2D5A3D]',
    stampClassName: 'bg-[#A3E635] text-[#1C3829]',
  },
}
