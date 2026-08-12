'use client';
import React, { useEffect, useState } from 'react';
import { seriesService } from '@/services/series.service';
import { ContentRow } from '@/components/content/ContentRow/ContentRow';
import styles from '../page.module.css';

export default function SeriesPage() {
  const [series, setSeries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seriesService.getSeries().then(res => {
      setSeries(res.results.map(s => ({ ...s, type: 'series' })));
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main} style={{ paddingTop: 100 }}>
        <h1>Barcha Seriallar</h1>
        <ContentRow title="" items={series} loading={loading} />
      </main>
    </div>
  );
}
