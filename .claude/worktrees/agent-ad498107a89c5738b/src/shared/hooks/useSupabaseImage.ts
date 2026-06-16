import { useMemo } from 'react';

import { SUPABASE_URL } from '@/shared/supabase/publicClient';

export function useBoatImageUrl(imagePath: string | null | undefined, variant?: 'medium'): string | null {
  return useMemo(() => {
    if (!imagePath) return null;
    const base = `${SUPABASE_URL}/storage/v1/object/public/boat_images/${imagePath}`;
    if (variant === 'medium') {
      const ext = imagePath.split('.').pop();
      const withoutExt = imagePath.slice(0, imagePath.lastIndexOf('.'));
      return `${SUPABASE_URL}/storage/v1/object/public/boat_images/${withoutExt}_medium.webp`;
    }
    return base;
  }, [imagePath, variant]);
}

export function useShipImageUrl(imagePath: string | null | undefined): string | null {
  return useMemo(() => {
    if (!imagePath) return null;
    return `${SUPABASE_URL}/storage/v1/object/public/ship_images/${imagePath}`;
  }, [imagePath]);
}

export function useHeroSlideUrl(imagePath: string | null | undefined): string | null {
  return useMemo(() => {
    if (!imagePath) return null;
    return `${SUPABASE_URL}/storage/v1/object/public/hero-slides/${imagePath}`;
  }, [imagePath]);
}
