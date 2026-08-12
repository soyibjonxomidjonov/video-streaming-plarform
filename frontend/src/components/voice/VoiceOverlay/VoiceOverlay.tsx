'use client';

import React from 'react';
import { Mic, Loader, Volume2, X } from 'lucide-react';
import styles from './VoiceOverlay.module.css';
import type { VoiceState } from '@/types';

interface VoiceOverlayProps {
  state: VoiceState;
  caption?: string;
  onClose: () => void;
  onOrbClick: () => void;
}

const STATE_LABELS: Record<VoiceState, string> = {
  idle: '',
  listening: 'Tinglayapman...',
  thinking: 'O\'ylayapman...',
  speaking: 'Javob bermoqda...',
};

const STATE_ICONS: Record<VoiceState, React.ReactNode> = {
  idle: <Mic size={32} />,
  listening: <Mic size={32} />,
  thinking: <Loader size={32} />,
  speaking: <Volume2 size={32} />,
};

export function VoiceOverlay({ state, caption, onClose, onOrbClick }: VoiceOverlayProps) {
  const isVisible = state !== 'idle';

  return (
    <div
      className={`${styles.overlay} ${isVisible ? styles.visible : ''}`}
      role="dialog"
      aria-label="Ovozli boshqaruv"
      aria-hidden={!isVisible}
    >
      <div className={styles.scrim} onClick={onClose} />

      <div className={styles.content}>
        <div
          className={`${styles.orb} ${styles[state]}`}
          onClick={onOrbClick}
          role="button"
          aria-label={STATE_LABELS[state]}
          tabIndex={isVisible ? 0 : -1}
        >
          <div className={styles.orbRing} />
          <div className={styles.orbInner}>
            {STATE_ICONS[state]}
          </div>
        </div>

        {STATE_LABELS[state] && (
          <p className={styles.statusText}>{STATE_LABELS[state]}</p>
        )}

        {caption && (
          <p className={styles.caption}>{caption}</p>
        )}

        <div className={styles.controls}>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Yopish"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
