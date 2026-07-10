// Shared styling tokens for the floating glass filter bar and its dropdowns.
// The bar adapts to what it floats over: a warm LIGHT frosted glass on the Map
// (light map + white results list), and a DARK glass on the Feed (dark photo /
// video media). Threading one `GlassTheme` through the bar + SearchBar +
// SaveSearch + ViewToggle keeps every surface on the same variant.

export type GlassTheme = 'light' | 'dark'

// Brand green active state is identical in both themes.
export const PILL_ACTIVE = 'bg-[#1C3829] text-white border-[#2E5C43]'

interface GlassTokens {
  /** The floating bar shell. */
  bar: string
  /** Dropdown / dialog surface (Filter panel, autocomplete, Save dialog). */
  surface: string
  text: string
  textMuted: string
  textFaint: string
  /** Inputs and selects. */
  input: string
  /** Idle segmented / home-type pill. */
  pillIdle: string
  /** Idle rounded chip button (Filter, Save Search). */
  chipIdle: string
  /** Vertical hairline divider (bg-based). */
  divider: string
  /** Section divider as a border color (border-t rows in the dropdown). */
  borderSoft: string
  /** Icon hover color (must be a literal class for Tailwind JIT). */
  iconHover: string
  /** Active/selected background for list rows (autocomplete). */
  hoverRow: string
  /** Hover background for list rows, as a literal `hover:` class. */
  rowHover: string
  /** View toggle track + idle label + "off" switch track. */
  toggleTrack: string
  toggleIdle: string
  toggleOff: string
  icon: string
}

const DARK: GlassTokens = {
  // Softer, glassier: lower opacity, heavier blur, inset top highlight, soft shadow.
  bar: 'bg-[#1E201C]/60 backdrop-blur-2xl border border-white/15 ring-1 ring-inset ring-white/10 shadow-xl shadow-black/20',
  surface: 'bg-[#141817]/90 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50',
  text: 'text-white',
  textMuted: 'text-white/60',
  textFaint: 'text-white/40',
  input:
    'bg-white/5 border border-white/15 text-white placeholder-white/40 focus:border-white/40 focus:ring-1 focus:ring-white/10',
  pillIdle: 'border-white/15 text-white/80 hover:border-white/40',
  chipIdle: 'bg-white/10 text-white border-white/15 hover:border-white/30',
  divider: 'bg-white/15',
  borderSoft: 'border-white/10',
  iconHover: 'hover:text-white',
  hoverRow: 'bg-white/10',
  rowHover: 'hover:bg-white/10',
  toggleTrack: 'bg-white/10',
  toggleIdle: 'text-white/60 hover:text-white',
  toggleOff: 'bg-white/15',
  icon: 'text-white/50',
}

const LIGHT: GlassTokens = {
  // Warm cream frosted glass to sit with the sepia map instead of a cold cutout.
  bar: 'bg-[#FAF9F6]/70 backdrop-blur-2xl border border-white/70 ring-1 ring-inset ring-white/50 shadow-xl shadow-black/10',
  surface: 'bg-white/95 backdrop-blur-xl border border-black/10 shadow-2xl shadow-black/20',
  text: 'text-[#111111]',
  textMuted: 'text-[#6B6B6B]',
  textFaint: 'text-[#9B9B9B]',
  input:
    'bg-white/70 border border-[#E8E6E1] text-[#111111] placeholder-[#9B9B9B] focus:border-[#1C3829] focus:ring-1 focus:ring-[#1C3829]/20',
  pillIdle: 'border-[#E8E6E1] text-[#111111] hover:border-[#1C3829]/40',
  chipIdle: 'bg-white/80 text-[#111111] border-[#E8E6E1] hover:border-[#1C3829]/40',
  divider: 'bg-[#E8E6E1]',
  borderSoft: 'border-[#E8E6E1]',
  iconHover: 'hover:text-[#111111]',
  hoverRow: 'bg-[#FAF9F6]',
  rowHover: 'hover:bg-[#FAF9F6]',
  toggleTrack: 'bg-black/5',
  toggleIdle: 'text-[#6B6B6B] hover:text-[#111111]',
  toggleOff: 'bg-[#E8E6E1]',
  icon: 'text-[#6B6B6B]',
}

export const glass = (theme: GlassTheme): GlassTokens => (theme === 'dark' ? DARK : LIGHT)
