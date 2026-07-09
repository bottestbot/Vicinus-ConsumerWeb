import Link from 'next/link'

/**
 * Vicinus wordmark — the primary brand identity (brand guide §02).
 *
 * "Vicinus" set in Space Grotesk Bold with a single lime full-stop. This is the
 * one source of truth for the wordmark; every placement (navbar, footer,
 * onboarding, auth) should render this rather than hand-rolling the text.
 *
 *   <Logo />                        → dark-green wordmark (on light backgrounds)
 *   <Logo variant="light" />        → white wordmark (on dark backgrounds)
 *   <Logo href="/" />               → wraps the wordmark in a link to home
 *   <Logo className="text-2xl" />   → size via font-size utility on the wrapper
 */

type LogoProps = {
  /** 'dark' = dark-green wordmark for light backgrounds; 'light' = white for dark backgrounds. */
  variant?: 'dark' | 'light'
  /** When set, the wordmark becomes a link to this route. */
  href?: string
  /** Extra classes (typically a text-size utility) applied to the wordmark. */
  className?: string
  /** Accessible label for the link/mark. */
  label?: string
}

export default function Logo({
  variant = 'dark',
  href,
  className = 'text-xl',
  label = 'Vicinus',
}: LogoProps) {
  const wordColor = variant === 'light' ? 'text-white' : 'text-[#1C3829]'

  const mark = (
    <span
      className={`font-wordmark font-bold leading-none tracking-tight ${wordColor} ${className}`}
    >
      Vicinus<span className="text-lime">.</span>
    </span>
  )

  if (href) {
    return (
      <Link
        href={href}
        aria-label={label}
        className="inline-flex shrink-0 items-center transition-colors"
      >
        {mark}
      </Link>
    )
  }

  return mark
}
