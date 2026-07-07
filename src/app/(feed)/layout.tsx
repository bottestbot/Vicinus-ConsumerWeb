import Navbar from '@/components/layout/Navbar'

export default function FeedGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="overflow-hidden">{children}</main>
    </>
  )
}
