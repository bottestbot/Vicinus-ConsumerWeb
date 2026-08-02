// Parallel-route slots stay on their last matched state across client-side
// navigations, so every other route in (main) has to resolve the slot to null —
// otherwise the overlay would linger after navigating away from a listing.
export default function PropertyModalCatchAll() {
  return null
}
