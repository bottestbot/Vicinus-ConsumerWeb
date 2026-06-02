import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env' })

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const neighbourhoods = [
  {
    name: 'The Annex',
    slug: 'the-annex-toronto',
    city: 'Toronto',
    province: 'ON',
    bio: "The Annex is one of Toronto's most beloved neighbourhoods, known for its Victorian and Edwardian architecture, independent bookshops, and vibrant café culture. Bordering the University of Toronto, it attracts academics, artists, and families alike.",
    medianPrice: 1850000,
    walkScore: 96,
    transitScore: 92,
    livingGrade: 'A',
    essentials: [
      { category: 'education', name: 'University of Toronto - St. George Campus', rating: 4.8, distanceKm: 0.3 },
      { category: 'healthcare', name: 'Toronto Western Hospital', rating: 4.2, distanceKm: 1.1 },
      { category: 'park', name: 'Philosophers Walk', rating: 4.6, distanceKm: 0.5 },
    ],
  },
  {
    name: 'Kitsilano',
    slug: 'kitsilano-vancouver',
    city: 'Vancouver',
    province: 'BC',
    bio: "Kitsilano — affectionately called 'Kits' — sits along the shores of English Bay with sweeping mountain views. Known for its beach volleyball courts, yoga studios, and organic food scene, it blends outdoor living with urban sophistication.",
    medianPrice: 2200000,
    walkScore: 91,
    transitScore: 78,
    livingGrade: 'A+',
    essentials: [
      { category: 'education', name: 'Kitsilano Secondary School', rating: 4.4, distanceKm: 0.8 },
      { category: 'healthcare', name: 'Broadway Medical Clinic', rating: 4.1, distanceKm: 0.6 },
      { category: 'park', name: 'Kitsilano Beach Park', rating: 4.9, distanceKm: 0.4 },
    ],
  },
  {
    name: 'Le Plateau-Mont-Royal',
    slug: 'le-plateau-montreal',
    city: 'Montreal',
    province: 'QC',
    bio: "Le Plateau is Montreal's bohemian heartbeat — colourful duplexes with external staircases, world-class restaurants on Saint-Laurent, and a creative community that defines the city's cultural identity.",
    medianPrice: 980000,
    walkScore: 98,
    transitScore: 88,
    livingGrade: 'B+',
    essentials: [
      { category: 'education', name: 'École secondaire Jeanne-Mance', rating: 4.2, distanceKm: 0.9 },
      { category: 'healthcare', name: 'CLSC du Plateau-Mont-Royal', rating: 4.0, distanceKm: 0.5 },
      { category: 'park', name: 'Parc La Fontaine', rating: 4.8, distanceKm: 0.7 },
    ],
  },
  {
    name: 'Inglewood',
    slug: 'inglewood-calgary',
    city: 'Calgary',
    province: 'AB',
    bio: "Calgary's oldest neighbourhood, Inglewood sits along the Bow River and has transformed into a hub for indie boutiques, craft breweries, and art galleries while retaining its historic character.",
    medianPrice: 720000,
    walkScore: 82,
    transitScore: 65,
    livingGrade: 'B',
    essentials: [
      { category: 'education', name: 'Ramsay School', rating: 4.1, distanceKm: 1.2 },
      { category: 'healthcare', name: 'Inglewood Medical Clinic', rating: 3.9, distanceKm: 0.4 },
      { category: 'park', name: 'Pearce Estate Park', rating: 4.7, distanceKm: 0.6 },
    ],
  },
]

async function main() {
  console.log('Seeding neighbourhoods...\n')

  for (const n of neighbourhoods) {
    const { essentials, ...neighbourhoodData } = n

    const neighbourhood = await prisma.neighbourhood.upsert({
      where: { slug: neighbourhoodData.slug },
      create: neighbourhoodData,
      update: neighbourhoodData,
    })

    console.log(`  [${neighbourhood.id}] ${neighbourhood.name}, ${neighbourhood.city}`)

    // Delete existing essentials then recreate to keep upsert idempotent
    await prisma.localEssential.deleteMany({ where: { neighbourhoodId: neighbourhood.id } })
    await prisma.localEssential.createMany({
      data: essentials.map((e) => ({ ...e, neighbourhoodId: neighbourhood.id })),
    })

    console.log(`    + ${essentials.length} local essentials`)
  }

  const total = await prisma.neighbourhood.count()
  console.log(`\nDone. Total neighbourhoods in DB: ${total}`)
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
