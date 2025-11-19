'use client';

import { useState, useEffect } from 'react';
import { advertisementsAPI } from '@/lib/api';
import styles from './Advertisement.module.css';

interface Ad {
  _id: string;
  ad_image: string;
  ad_url: string;
  published: boolean;
}

export default function Advertisement() {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRandomAd();
  }, []);

  const fetchRandomAd = async () => {
    try {
      const response = await advertisementsAPI.getRandom();
      setAd(response.data);
    } catch (error) {
      console.error('Error fetching advertisement:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !ad) {
    return null; // Don't show anything while loading or if no ad available
  }

  return (
    <div className={styles.adContainer}>
      <div className={styles.adLabel}>Advertisement</div>
      <a
        href={ad.ad_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={styles.adLink}
      >
        <img
          src={ad.ad_image}
          alt="Advertisement"
          className={styles.adImage}
          onError={(e) => {
            // Hide ad if image fails to load
            (e.target as HTMLImageElement).parentElement?.parentElement?.remove();
          }}
        />
      </a>
    </div>
  );
}
