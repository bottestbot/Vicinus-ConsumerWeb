import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/search(.*)',
  '/feed(.*)',
  '/properties/(.*)',
  '/neighbourhoods(.*)',
  '/sell(.*)',
  '/dashboard(.*)',
  '/onboarding(.*)',
])

// Next.js 16 uses "proxy.ts" instead of "middleware.ts".
// Named export "proxy" is the required convention.
export const proxy = clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
