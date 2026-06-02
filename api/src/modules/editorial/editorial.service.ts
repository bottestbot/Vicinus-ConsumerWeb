import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'

const MOCK_EDITORIAL = [
  {
    id: 'mock-1',
    title: 'Hidden Gems in East Toronto',
    subtitle: 'Discover neighbourhood treasures',
    imageUrl: null,
    category: 'Neighbourhood Spotlight',
    ctaUrl: '/neighbourhoods/east-toronto',
  },
  {
    id: 'mock-2',
    title: 'First-Time Buyer Guide',
    subtitle: 'Everything you need to know',
    imageUrl: null,
    category: 'Buyer Tips',
    ctaUrl: '/guides/first-time-buyer',
  },
  {
    id: 'mock-3',
    title: 'Market Trends: Spring 2026',
    subtitle: 'What the data tells us',
    imageUrl: null,
    category: 'Market Insights',
    ctaUrl: '/editorial/market-trends-spring-2026',
  },
]

@Injectable()
export class EditorialService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const records = await this.prisma.editorialCuration.findMany({
      orderBy: { position: 'asc' },
      select: { id: true, title: true, subtitle: true, imageUrl: true, category: true, ctaUrl: true },
    })
    return records.length > 0 ? records : MOCK_EDITORIAL
  }
}
