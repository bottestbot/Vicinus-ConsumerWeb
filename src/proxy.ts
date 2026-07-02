import { clerkMiddleware } from '@clerk/nextjs/server'

// clerkMiddleware() processes the production session handshake (__clerk_handshake)
// that sets the session cookie after sign-in, and makes auth() work in server
// components. It's required with pk_live_/sk_live_ instances — without it, sign-in
// completes on Clerk's side but the session cookie is never set, so the app stays
// signed out. In Next.js 16 this proxy file runs on the Node.js runtime (not the
// Edge runtime), so it no longer triggers the Netlify edge-function timeouts that
// previously forced us to a pass-through.
export default clerkMiddleware()

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
