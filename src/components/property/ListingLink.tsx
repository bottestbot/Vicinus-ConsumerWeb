'use client'

// CREA-05: a <Link> to a listing detail page that reports the DDF `Click`
// event as it navigates. Use this anywhere a card links to /properties/<key>;
// surfaces that navigate imperatively (router.push) call logListingClick
// directly instead.
//
// The ListingKey is derived from the href rather than passed as a second prop
// on purpose: the detail route param *is* the DDF ListingKey — it's what
// ListingViewTracker reports as `view` — so deriving it here makes it
// impossible for a card's Click event and the resulting view event to disagree
// about which listing they describe.
import Link from 'next/link'
import type { ComponentProps } from 'react'
import { logListingClick } from '@/lib/api/analytics'

const LISTING_HREF = /^\/properties\/([^/?#]+)/

/** Pull the DDF ListingKey out of a `/properties/<key>` href, if it is one. */
export function listingKeyFromHref(href: string): string | null {
  const raw = LISTING_HREF.exec(href)?.[1]
  if (!raw) return null
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

type ListingLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & { href: string }

export default function ListingLink({ href, onClick, ...rest }: ListingLinkProps) {
  return (
    <Link
      href={href}
      onClick={(e) => {
        const listingKey = listingKeyFromHref(href)
        if (listingKey) logListingClick(listingKey)
        onClick?.(e)
      }}
      {...rest}
    />
  )
}
