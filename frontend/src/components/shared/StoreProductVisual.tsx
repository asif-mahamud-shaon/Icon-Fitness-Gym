'use client';

import React, { useEffect, useState } from 'react';
import {
  Droplets,
  Shield,
  Dumbbell,
  Flame,
  Zap,
  Shirt,
  Package,
} from 'lucide-react';

export const STORE_CATEGORY_META: Record<
  string,
  { label: string; accent: string; tagline: string }
> = {
  BOTTLES: {
    label: 'Water Bottles & Shakers',
    accent: '#38BDF8',
    tagline: 'Hydration & Mixing',
  },
  GLOVES: {
    label: 'Gym Gloves',
    accent: '#C7F464',
    tagline: 'Grip & Wrist Support',
  },
  BELTS: {
    label: 'Lifting Belts',
    accent: '#F59E0B',
    tagline: 'Core Bracing',
  },
  SUPPLEMENTS: {
    label: 'Protein & Supplements',
    accent: '#22C55E',
    tagline: 'Nutrition & Recovery',
  },
  ACCESSORIES: {
    label: 'Straps & Accessories',
    accent: '#A855F7',
    tagline: 'Training Essentials',
  },
  APPAREL: {
    label: 'Gym Apparel',
    accent: '#EC4899',
    tagline: 'Performance Wear',
  },
};

export function formatStoreCategoryLabel(category?: string | null): string {
  const key = String(category || 'ACCESSORIES').trim().toUpperCase();
  if (STORE_CATEGORY_META[key]?.label) {
    return STORE_CATEGORY_META[key].label;
  }
  return key
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function CategoryArtwork({ category }: { category: string }) {
  const upper = String(category || 'ACCESSORIES').toUpperCase();

  if (upper === 'BOTTLES') {
    return (
      <svg viewBox="0 0 120 120" className="w-24 h-24 drop-shadow-sm" aria-hidden="true">
        <rect x="44" y="14" width="32" height="10" rx="4" fill="#38BDF8" />
        <rect x="48" y="24" width="24" height="6" rx="2" fill="#94A3B8" />
        <rect x="38" y="30" width="44" height="74" rx="12" fill="#1E293B" stroke="#38BDF8" strokeWidth="2.5" />
        <rect x="44" y="52" width="32" height="24" rx="5" fill="#C7F464" fillOpacity="0.16" stroke="#C7F464" strokeWidth="1.5" />
        <path d="M52 64h16M60 58v12" stroke="#C7F464" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (upper === 'GLOVES') {
    return (
      <svg viewBox="0 0 120 120" className="w-24 h-24 drop-shadow-sm" aria-hidden="true">
        <rect x="34" y="42" width="52" height="44" rx="12" fill="#1E293B" stroke="#C7F464" strokeWidth="2.5" />
        <path d="M42 42V28M54 42V24M66 42V25M78 42V30" stroke="#C7F464" strokeWidth="6" strokeLinecap="round" />
        <rect x="36" y="84" width="48" height="14" rx="5" fill="#0F172A" stroke="#94A3B8" strokeWidth="2" />
        <path d="M44 64h32" stroke="#C7F464" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (upper === 'BELTS') {
    return (
      <svg viewBox="0 0 120 120" className="w-24 h-24 drop-shadow-sm" aria-hidden="true">
        <ellipse cx="60" cy="64" rx="42" ry="22" fill="#1E293B" stroke="#F59E0B" strokeWidth="4" />
        <ellipse cx="60" cy="56" rx="34" ry="15" fill="#0F172A" stroke="#475569" strokeWidth="2" />
        <rect x="48" y="72" width="24" height="16" rx="3" fill="#F59E0B" />
        <circle cx="60" cy="80" r="3" fill="#0F172A" />
      </svg>
    );
  }

  if (upper === 'SUPPLEMENTS') {
    return (
      <svg viewBox="0 0 120 120" className="w-24 h-24 drop-shadow-sm" aria-hidden="true">
        <rect x="34" y="20" width="52" height="12" rx="4" fill="#22C55E" />
        <rect x="30" y="34" width="60" height="70" rx="10" fill="#1E293B" stroke="#22C55E" strokeWidth="2.5" />
        <rect x="38" y="48" width="44" height="34" rx="6" fill="#22C55E" fillOpacity="0.16" stroke="#22C55E" strokeWidth="1.5" />
        <path d="M60 55l5 10h-10l5 10" stroke="#C7F464" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    );
  }

  if (upper === 'APPAREL') {
    return (
      <svg viewBox="0 0 120 120" className="w-24 h-24 drop-shadow-sm" aria-hidden="true">
        <path
          d="M36 26l14-6c4 6 16 6 20 0l14 6 14 18-12 10-6-8v52H40V46l-6 8-12-10 14-18z"
          fill="#1E293B"
          stroke="#EC4899"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
        <path d="M50 56h20" stroke="#C7F464" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 120 120" className="w-24 h-24 drop-shadow-sm" aria-hidden="true">
      <circle cx="40" cy="60" r="18" fill="#1E293B" stroke="#A855F7" strokeWidth="3" />
      <circle cx="80" cy="60" r="18" fill="#1E293B" stroke="#A855F7" strokeWidth="3" />
      <rect x="38" y="55" width="44" height="10" rx="4" fill="#C7F464" />
    </svg>
  );
}

export function StoreCategoryIcon({
  category,
  className = 'w-4 h-4',
}: {
  category: string;
  className?: string;
}) {
  switch (String(category || '').toUpperCase()) {
    case 'BOTTLES':
      return <Droplets className={className} />;
    case 'GLOVES':
      return <Shield className={className} />;
    case 'BELTS':
      return <Dumbbell className={className} />;
    case 'SUPPLEMENTS':
      return <Flame className={className} />;
    case 'ACCESSORIES':
      return <Zap className={className} />;
    case 'APPAREL':
      return <Shirt className={className} />;
    default:
      return <Package className={className} />;
  }
}

export function StoreProductVisual({
  imageUrl,
  category,
  name,
  className = 'h-44',
}: {
  imageUrl?: string | null;
  category: string;
  name: string;
  className?: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [imageUrl]);

  if (imageUrl && !imgFailed) {
    return (
      <div
        className={`relative w-full ${className} rounded-2xl overflow-hidden bg-[#0D0D0D] border border-[#2C2C2C] flex items-center justify-center group`}
      >
        <img
          src={imageUrl}
          alt={name}
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative w-full ${className} rounded-2xl overflow-hidden bg-[#171717] border border-[#2C2C2C] flex flex-col items-center justify-center p-4`}
    >
      <CategoryArtwork category={category} />
      <span className="mt-1 text-[10px] font-mono uppercase tracking-widest text-[#A1A1AA]">
        {STORE_CATEGORY_META[category]?.tagline || 'Icon Gym Store'}
      </span>
    </div>
  );
}
