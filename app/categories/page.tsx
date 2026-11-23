import type { Metadata } from 'next';
import CategoriesClient from './CategoriesClient';
import { ALL_CATEGORIES } from '../lib/seoData';
import { resolveUniqueFixedThumbs } from '../lib/mediaThumbResolver';

export const revalidate = 604800;

export const metadata: Metadata = {
  title: 'All Porn Categories & Desi Video Tags | HubTube - XVideos3',
  description:
    'Browse all HD porn categories, Desi videos, Bhabhi, Aunty, MMS, Amateur, 4K, and VR categories on HubTube (XVideos3.cam).',
  alternates: { canonical: '/categories' },
};

export default async function CategoriesPage() {
  const initialThumbs = await resolveUniqueFixedThumbs(ALL_CATEGORIES, false);
  return <CategoriesClient initialThumbs={initialThumbs} />;
}