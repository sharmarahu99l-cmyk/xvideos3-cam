import type { Metadata } from 'next';
import PornstarsClient from './PornstarsClient';
import { ALL_PORNSTARS } from '../lib/seoData';
import { resolveUniqueFixedThumbs } from '../lib/mediaThumbResolver';

export const revalidate = 604800;

export const metadata: Metadata = {
  title: 'Top Pornstars & Trending Models | HubTube - IndianSexVideo',
  description:
    'Explore top pornstars and trending adult models in HD and 4K on HubTube (indiansexvideo.tv).',
  alternates: { canonical: '/pornstars' },
};

export default async function PornstarsPage() {
  const initialThumbs = await resolveUniqueFixedThumbs(ALL_PORNSTARS, true);
  return <PornstarsClient initialThumbs={initialThumbs} />;
}