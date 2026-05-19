export default function NeighbourhoodPage({ params }: { params: { slug: string } }) {
  return <div className="pt-16 min-h-screen bg-black text-white p-8">Neighbourhood: {params.slug} — coming in Sprint 5</div>
}
