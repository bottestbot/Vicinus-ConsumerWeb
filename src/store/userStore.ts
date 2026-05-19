import { create } from 'zustand'

interface UserStore {
  savedPropertyIds: Set<string>
  toggleSaved: (propertyId: string) => void
  setSaved: (ids: string[]) => void
}

export const useUserStore = create<UserStore>((set) => ({
  savedPropertyIds: new Set(),
  toggleSaved: (id) =>
    set((s) => {
      const next = new Set(s.savedPropertyIds)
      next.has(id) ? next.delete(id) : next.add(id)
      return { savedPropertyIds: next }
    }),
  setSaved: (ids) => set({ savedPropertyIds: new Set(ids) }),
}))
