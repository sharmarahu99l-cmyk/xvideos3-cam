'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import VideoCard from './VideoCard';

type Video = {
  id: string;
  title: string;
  default_thumb: { src: string };
  length_min: number;
  length_sec: number;
  embed: string;
  views?: string;
};

const fetchWithFallback = async (query: string, pageNum: number = 1) => {
  const searchTerm = query.trim() || "porn";
  try {
    const res = await fetch(`https://www.eporner.com/api/v2/video/search/?query=${encodeURIComponent(searchTerm)}&per_page=15&page=${pageNum}&order=most_viewed`, { cache: 'no-store' });
    const data = await res.json();
    if (data.videos?.length >= 5) return data.videos;
  } catch (e) {}
  try {
    const res = await fetch(`https://api.redtube.com/?data=redtube.Videos.searchVideos&output=json&search=${encodeURIComponent(searchTerm)}&page=${pageNum}`);
    const data = await res.json();
    return (data.videos || []).map((v: any) => ({
      id: v.video_id,
      title: v.title,
      default_thumb: { src: v.thumb || '' },
      length_min: parseInt(v.duration?.split(':')[0] || '0'),
      length_sec: parseInt(v.duration?.split(':')[1] || '0'),
      embed: `https://embed.redtube.com/?id=${v.video_id}`,
      views: v.views || '0'
    }));
  } catch (e) {
    return [];
  }
};

const categories = ["Hentai", "MILF", "Pinay", "Lesbian", "Anal", "Big Ass", "Latina", "Anime", "Asian", "Femboy"];

export default function HomeClient() {
  const searchParams = useSearchParams();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || "");
  const [showMenu, setShowMenu] = useState(false);
  const [page, setPage] = useState(1);

  const loadVideos = async (query: string = "", pageNum: number = 1) => {
    setLoading(true);
    const fetched = await fetchWithFallback(query, pageNum);
    setVideos(fetched);
    setPage(pageNum);
    setLoading(false