import axios from 'axios'

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
})

// Attach the Clerk session token to every client-side request so protected
// `/users/me/*` routes (saved properties, visited, saved searches) authenticate.
// Clerk exposes the active session on `window.Clerk` once ClerkProvider mounts.
type ClerkWindow = {
  Clerk?: { session?: { getToken: () => Promise<string | null> } }
}

apiClient.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    try {
      const clerk = (window as unknown as ClerkWindow).Clerk
      const token = await clerk?.session?.getToken()
      if (token) config.headers.Authorization = `Bearer ${token}`
    } catch {
      // No active session — request proceeds unauthenticated (public endpoints).
    }
  }
  return config
})

export default apiClient
