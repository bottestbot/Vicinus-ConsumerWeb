import Image from 'next/image'

// Real screenshot of the live search screen (map + results rail) rather than a
// mock — this section's whole claim is "your listings are already here", so it
// should show the actual product.
function MapPreview() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
      <Image
        src="/realtor-hub/map.png"
        alt="Vicinus search screen showing Greater Vancouver listings on the map beside the results list"
        width={2556}
        height={1372}
        sizes="(min-width: 1024px) 34rem, 100vw"
        className="h-auto w-full"
      />
    </div>
  )
}

export default function RealtorHubListings() {
  return (
    <section className="bg-[#FAF9F6] px-6 py-20 lg:py-24">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <h2 className="font-heading text-3xl font-bold leading-tight text-[#111111] sm:text-4xl">
            Your listings are already here.
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-[#6B6B6B]">
            Most of the market will live on Vicinus on day one. Just claim yours, lock any
            remaining properties in your area, turn on notifications, and get alerted the moment a
            lead comes in.
          </p>
        </div>
        <MapPreview />
      </div>
    </section>
  )
}
