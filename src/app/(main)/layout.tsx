import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

export default function MainLayout({
  children,
  propertyModal,
}: {
  children: React.ReactNode
  // Parallel-route slot for the Zillow-style property overlay. Renders null on
  // every route except a client-side navigation to /properties/[id], which the
  // intercepting route in @propertyModal catches.
  propertyModal: React.ReactNode
}) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      {propertyModal}
    </>
  )
}
