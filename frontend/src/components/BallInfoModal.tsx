import React from 'react';
import { createPortal } from 'react-dom';
import { PlayerCard } from '../types';

interface BallInfoModalProps {
  open: boolean;
  onClose: () => void;
  players: PlayerCard[];
  lang?: 'en' | 'ko';
}

const LANG = {
  en: {
    title: 'Player Card List',
    reward: 'Reward',
    per_day: 'TON/day',
    rate: 'Rate',
    rarity: 'Rarity',
    common: 'Common',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary',
  },
  ko: {
    title: '선수 카드 목록',
    reward: '보상',
    per_day: 'TON/일',
    rate: '확률',
    rarity: '희귀도',
    common: '일반',
    rare: '희귀',
    epic: '에픽',
    legendary: '전설',
  }
};

export default function BallInfoModal({ open, onClose, players, lang = 'en' }: BallInfoModalProps) {
  if (!open) return null;
  const t = LANG[lang];
  
  const modalContent = (
    <>
      <style>
        {`
          .modal-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0,0,0,0.7) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 999999 !important;
            padding: 20px !important;
            box-sizing: border-box !important;
            transform: none !important;
            margin: 0 !important;
          }
          
          .modal-content {
            background: #23284a !important;
            border-radius: 12px !important;
            padding: 24px !important;
            width: 90% !important;
            max-width: 500px !important;
            max-height: 80vh !important;
            color: #fff !important;
            position: relative !important;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
            border: 1px solid #444 !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            transform: none !important;
            left: auto !important;
            top: auto !important;
          }
          
          @media (max-width: 768px) {
            .modal-content {
              width: 95% !important;
              padding: 20px !important;
            }
          }
          
          @media (max-width: 480px) {
            .modal-content {
              width: 98% !important;
              padding: 16px !important;
            }
          }
          
          /* Ensure modal is always on top and centered */
          body {
            overflow: hidden !important;
          }
          
          .modal-overlay * {
            position: static !important;
          }
          
          .modal-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: rgba(0,0,0,0.7) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            z-index: 999999 !important;
            padding: 20px !important;
            box-sizing: border-box !important;
          }
        `}
      </style>
      <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Close button */}
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', 
            top: 8, 
            right: 12, 
            background: 'rgba(255,255,255,0.1)', 
            border: 'none', 
            color: '#fff', 
            fontSize: 20, 
            cursor: 'pointer',
            fontWeight: 'bold',
            borderRadius: '50%',
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
          }}
        >
          ×
        </button>
        
        {/* Title */}
        <h3 style={{ 
          textAlign: 'center', 
          marginBottom: 16, 
          fontSize: 20,
          color: '#ffb300',
          fontWeight: 'bold',
          marginTop: 0
        }}>
          {t.title}
        </h3>
        
        {/* Player cards list */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 12,
          maxHeight: '60vh',
          overflowY: 'auto'
        }}>
          {players.map((p, idx) => (
            <div key={p.name} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              background: '#181c2b', 
              borderRadius: 8, 
              padding: 12,
              border: '1px solid #333'
            }}>
                              {/* Player image */}
                <img 
                  src={p.image} 
                  alt={p.name} 
                  style={{ 
                    width: 48, 
                    height: 48, 
                    borderRadius: 6, 
                    objectFit: 'cover', 
                    border: '1px solid #444'
                  }} 
                />
              
                              {/* Player info */}
                <div style={{ flex: 1 }}>
                  <div style={{ 
                    fontWeight: 'bold', 
                    fontSize: 16, 
                    color: '#ffb300'
                  }}>
                    {p.name}
                  </div>
                  <div style={{ 
                    fontSize: 14, 
                    color: '#4CAF50'
                  }}>
                    {t.reward}: {p.reward.toFixed(4)} {t.per_day}
                  </div>
                  <div style={{ 
                    fontSize: 12, 
                    color: '#aaa'
                  }}>
                    {t.rate}: {p.rate}% | {t.rarity}: {t[p.rarity.toLowerCase() as keyof typeof t] || p.rarity}
                  </div>
                </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
  
  return createPortal(modalContent, document.body);
}