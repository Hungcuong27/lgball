import React from 'react';
import { PlayerCard } from '../types';

interface BallInfoModalProps {
  open: boolean;
  onClose: () => void;
  players: PlayerCard[];
  lang?: 'en' | 'vi';
}

const LANG = {
  en: {
    title: 'Player Card List',
    reward: 'Reward',
    per_day: 'TON/day',
    rate: 'Rate',
    rarity: 'Rarity',
  },
  vi: {
    title: 'Danh sách thẻ cầu thủ',
    reward: 'Thưởng',
    per_day: 'TON/ngày',
    rate: 'Tỉ lệ',
    rarity: 'Độ hiếm',
  }
};

export default function BallInfoModal({ open, onClose, players, lang = 'en' }: BallInfoModalProps) {
  if (!open) return null;
  const t = LANG[lang];
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{ background: '#23284a', borderRadius: 16, padding: 32, minWidth: 340, maxWidth: 420, color: '#fff', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer' }}>&times;</button>
        <h2 style={{ textAlign: 'center', marginBottom: 16 }}>{t.title}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {players.map((p, idx) => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 16, background: '#181c2b', borderRadius: 10, padding: 10 }}>
              <img src={p.image} alt={p.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', border: '2px solid #444' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: 18 }}>{p.name}</div>
                <div style={{ fontSize: 14, color: '#ffb300' }}>{t.reward}: {p.reward.toFixed(4)} {t.per_day}</div>
                <div style={{ fontSize: 13, color: '#aaa' }}>{t.rate}: {p.rate}% | {t.rarity}: {p.rarity}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 