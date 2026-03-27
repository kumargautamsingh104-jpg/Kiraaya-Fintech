'use client';

import React, { useEffect, useState } from 'react';

/**
 * Kiraaya Premium ScoreMeter
 * Implements PRD Step 8.2 exact specifications.
 * Scale: 300-900. Tiers: Building/Emerging/Established/Strong/Prime.
 */
export const ScoreMeter = ({ score = 300, tier = 'building', streakMonths = 0, isLimitedData = false }) => {
  const [displayScore, setDisplayScore] = useState(0);

  // Animated on first load
  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += 15;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(interval);
      } else {
        setDisplayScore(current);
      }
    }, 15);
    return () => clearInterval(interval);
  }, [score]);

  // PRD Color System
  let color = '#D85A30'; // Coral (300-550) - Emerging/Building
  if (score >= 781) color = '#2E7D32'; // Green - Prime
  else if (score >= 651) color = '#0F6E56'; // Teal - Strong
  else if (score >= 551) color = '#EF9F27'; // Amber - Established

  return (
    <div style={{ textAlign: 'center', padding: '24px', background: '#F8F7F4', borderRadius: '16px', border: '0.5px solid #EAE8E1' }}>
      <h3 style={{ fontSize: '13px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px 0' }}>Your RentScore</h3>
      
      {/* Score Meter */}
      <div style={{ 
        width: '180px', height: '180px', margin: '0 auto', borderRadius: '50%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        border: `8px solid ${color}`, background: '#fff',
        boxShadow: `0 0 30px ${color}33`, transition: 'all 0.5s ease-out'
      }}>
        <div style={{ fontSize: '48px', fontWeight: '800', color: '#111' }}>{displayScore}</div>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color, textTransform: 'uppercase', marginTop: '4px' }}>
          {tier}
        </div>
      </div>

      {/* Streak Hook */}
      <div style={{ marginTop: '20px', padding: '12px', background: '#fff', borderRadius: '12px', border: '0.5px solid #eee' }}>
        <span style={{ fontSize: '18px', marginRight: '6px' }}>🔥</span>
        <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
          {streakMonths} months paid on time
        </span>
      </div>

      {isLimitedData && (
        <p style={{ fontSize: '12px', color: '#888', marginTop: '12px' }}>
          Verified with limited cash-based data.
        </p>
      )}
    </div>
  );
};
