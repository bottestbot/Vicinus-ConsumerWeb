const STEPS = [
  {
    number: '1',
    title: 'Request access today.',
    body: 'Fill out the form below to register your interest before the cap is reached.',
  },
  {
    number: '2',
    title: 'Claim your neighbourhood and listings on launch day.',
    body: 'Get first 10 days of access to verify your listings and lock down your primary territory.',
  },
  {
    number: '3',
    title: 'Start connecting with serious buyers before anyone else.',
    body: 'Launch with an established profile and active leads while everyone else is just signing up.',
  },
]

export default function RealtorHubHowItWorks() {
  return (
    <section className="bg-[#FAF9F6] px-6 py-20 lg:py-24">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center font-heading text-3xl font-bold text-[#111111] sm:text-4xl">
          How It Works
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
          {STEPS.map((s) => (
            <div key={s.number}>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1C3829] text-sm font-bold text-[#A3E635]">
                {s.number}
              </span>
              <h3 className="mt-4 font-heading text-lg font-semibold leading-snug text-[#111111]">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[#6B6B6B]">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
