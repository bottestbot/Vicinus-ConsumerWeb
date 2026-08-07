// Shared page shell for /methodology and its sub-pages. Matches the static
// content pages (/privacy, /terms): #FAF9F6 canvas, single 3xl measure column.
export default function MethodologyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF9F6] pt-16 pb-24 font-ui">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10">{children}</div>
    </div>
  )
}
