import { SUPABASE_URL } from '@/shared/supabase/publicClient';

const BUCKET = 'boat_images';

// Supabase image transform endpoint — resizes on CDN edge, cached
// Docs: https://supabase.com/docs/guides/storage/serving/image-transformations
function renderUrl(path: string, width: number, quality: number): string {
  return `${SUPABASE_URL}/storage/v1/render/image/public/${BUCKET}/${path}?width=${width}&quality=${quality}&format=webp`;
}

export function boatImageUrl(path: string | null | undefined, size: 'thumb' | 'card' | 'full'): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path; // already absolute, skip transform

  switch (size) {
    case 'thumb': return renderUrl(path, 80,  30); // placeholder blur ~1-2KB
    case 'card':  return renderUrl(path, 480, 75); // card display ~20-40KB
    case 'full':  return renderUrl(path, 1200, 88); // full screen
  }
}

// fallback for non-transform (free Supabase plan)
export function boatImageDirect(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}
