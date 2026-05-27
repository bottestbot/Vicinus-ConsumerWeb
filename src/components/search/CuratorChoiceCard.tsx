'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart, Share2, Maximize2, Bed, Bath } from 'lucide-react'
import type { Property } from '@/types/search'
import { formatFullPrice } from '@/types/search'

interface CuratorChoiceCardProps {
  property: Property
}

export default function CuratorChoiceCard({ property }: CuratorChoiceCardProps) {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-[#E8E6E1] shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#F2F0EB]">
        <div className="w-6 h-6 bg-[#1C3829] rounded-full flex items-center justify-center">
          <span className="text-white text-[9px] font-bold">TC</span>
        </div>
        <span className="text-xs font-semibold text-[#111111] tracking-wide">The Curator&apos;s Choice</span>
      </div>

      {/* Image */}
      <Link href={`/properties/${property.id}`}>
        <div className="relative h-52 overflow-hidden bg-[#1C2020] group">
          <Image
            src={property.imageUrl}
            alt={property.address}
            fill
            sizes="400px"
            className="object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Action buttons */}
          <div className="absolute top-3 right-3 flex gap-2">
            {[
              { icon: Heart, label: 'Save' },
              { icon: Maximize2, label: 'Expand' },
              { icon: Share2, label: 'Share' },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                aria-label={label}
                onClick={(e) => e.preventDefault()}
                className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/25 transition-colors"
              >
                <Icon size={14} className="text-white" />
              </button>
            ))}
          </div>

          {/* Property name on image */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="font-heading text-lg font-semibold text-white leading-tight mb-0.5">
              {property.description?.split('—')[0]?.trim() || property.address}
            </p>
            <p className="text-white/70 text-xs line-clamp-2">
              {property.description}
            </p>
          </div>
        </div>
      </Link>

      {/* Content below image */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-heading text-2xl font-semibold text-[#111111]">
              {formatFullPrice(property.price)}
            </p>
            <p className="text-sm text-[#111111] mt-0.5">{property.address}</p>
            <p className="text-xs text-[#6B6B6B]">
              {property.city}, {property.province} {property.postalCode}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-[#6B6B6B] mb-3">
          <span className="flex items-center gap-1">
            <Bed size={12} /> {property.beds} bd
          </span>
          <span className="text-[#E8E6E1]">|</span>
          <span className="flex items-center gap-1">
            <Bath size={12} /> {property.baths} ba
          </span>
          <span className="text-[#E8E6E1]">|</span>
          <span>{property.sqft.toLocaleString()} sqft</span>
        </div>

        {/* Features */}
        {property.features && property.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {property.features.slice(0, 3).map((f) => (
              <span key={f} className="text-[10px] px-2 py-0.5 bg-[#FAF9F6] border border-[#E8E6E1] rounded-full text-[#6B6B6B]">
                {f}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <Link href={`/properties/${property.id}`}>
          <button className="w-full py-2.5 bg-[#1C3829] text-white rounded-lg text-sm font-medium hover:bg-[#2D5A3D] transition-colors">
            View Property
          </button>
        </Link>

        {/* CREA compliance */}
        <div className="mt-3 flex items-center justify-between">
          <p className="text-[10px] text-[#6B6B6B]">
            {property.agentName} · {property.brokerageName}
          </p>
          <a
            href="https://www.realtor.ca"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] text-[#6B6B6B] hover:text-[#1C3829] transition-colors"
          >
            Powered by <span className="font-semibold">REALTOR.ca</span>
          </a>
        </div>
      </div>
    </div>
  )
}
