import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Clerk auth is handled at the page/layout level via auth() from @clerk/nextjs/server.
// Keeping middleware as a pass-through avoids edge function network calls to Clerk
// on every request, which caused timeouts on Netlify's edge runtime.
export function proxy(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
