// SEO-01 + SEO-07 — robots.txt.
//
// ⚠️ Read this before editing the rules array.
//
// robots.txt group matching is *most-specific-wins, not additive*: a crawler
// that finds a group naming its own user-agent ignores the `*` group entirely.
// That has two consequences here:
//
//  1. Adding this file at all is a behaviour change. `vicinus.ca/robots.txt`
//     404s today, which every crawler reads as "allow everything". A robots.txt
//     that names some agents and omits others is *stricter* than no file at
//     all — that is exactly the silent-block failure SEO-07 exists to prevent.
//  2. The AI-crawler groups below must repeat the full `disallow` list. They do
//     not inherit it from the `*` group, so leaving it out would hand them the
//     private routes.
import type { MetadataRoute } from 'next'

// Same convention as `metadataBase` in src/app/layout.tsx.
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vicinus.ca'

/** Private, thin, or non-HTML routes. Kept out of the index to preserve crawl
 *  budget for the neighbourhood and search surfaces that can actually rank. */
const DISALLOW = ['/dashboard', '/feed', '/onboarding', '/sign-in', '/sign-up', '/api']

/** SEO-07 — explicitly allowlisted AI / answer-engine crawlers.
 *
 *  Our most citable asset is deterministic livability scoring with a published
 *  methodology, and these agents do not execute JavaScript, so the SSR work in
 *  SEO-02/03 is what makes it visible to them. Naming them here is what keeps
 *  this file from silently revoking the access they have today. */
const AI_CRAWLERS = [
  'GPTBot', // OpenAI — training + retrieval crawler
  'ChatGPT-User', // OpenAI — live fetch on a user's behalf
  'ClaudeBot', // Anthropic
  'PerplexityBot', // Perplexity
  'Google-Extended', // Gemini / Vertex AI grounding control token
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: DISALLOW,
      },
      {
        userAgent: AI_CRAWLERS,
        allow: '/',
        disallow: DISALLOW,
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
