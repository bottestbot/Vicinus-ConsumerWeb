import { redirect } from 'next/navigation'

// The feed is now a view of the unified Buy screen (Feed | Map toggle on
// /search), not a standalone route. Keep this path as a redirect so any
// bookmarked/deep links still land users on the Buy screen's Feed view.
export default function FeedRedirect() {
  redirect('/search')
}
