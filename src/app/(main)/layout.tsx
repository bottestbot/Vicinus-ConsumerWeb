import DashboardNavbar from '@/components/dashboard/DashboardNavbar'
import Footer from '@/components/layout/Footer'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DashboardNavbar />
      <main>{children}</main>
      <Footer />
    </>
  )
}
