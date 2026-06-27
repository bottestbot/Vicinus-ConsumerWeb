import DashboardNavbar from '@/components/dashboard/DashboardNavbar'

export default function FeedGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardNavbar />
      <main className="overflow-hidden">{children}</main>
    </>
  )
}
